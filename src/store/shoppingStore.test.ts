import { describe, expect, it, vi } from 'vitest'
import { createDemoLists } from '../data/demo'
import { createShoppingStore } from './shoppingStore'
import { STORAGE_KEY, STORAGE_VERSION } from './storage'
import type { BrowserStorage } from './storage'
import type { ShoppingList } from '../types'

function memoryStorage(initial?: string) {
  const data = new Map<string, string>()
  if (initial !== undefined) data.set(STORAGE_KEY, initial)
  return {
    getItem: vi.fn((key: string) => data.get(key) ?? null),
    setItem: vi.fn((key: string, value: string) => {
      data.set(key, value)
    }),
    removeItem: vi.fn((key: string) => {
      data.delete(key)
    }),
  } satisfies BrowserStorage
}

const encode = (
  lists: ShoppingList[] = createDemoLists(),
  version = STORAGE_VERSION,
) => JSON.stringify({ state: { lists }, version })

const personalList = (): ShoppingList => ({
  ...createDemoLists()[0],
  id: 'pessoal',
  name: 'Mercado de sábado',
  budgetCents: 18000,
  items: [],
})

describe('salvamento das compras', () => {
  it('salva os exemplos no primeiro acesso e os recupera sem duplicar', () => {
    const storage = memoryStorage()
    const first = createShoppingStore(() => storage)
    expect(JSON.parse(storage.getItem(STORAGE_KEY)!)).toEqual({
      state: { lists: first.getState().lists },
      version: STORAGE_VERSION,
    })
    const second = createShoppingStore(() => storage)
    expect(second.getState().lists).toEqual(first.getState().lists)
    expect(storage.setItem).toHaveBeenCalledTimes(1)
    expect(second.getState().storageIssue).toBeNull()
  })

  it('recupera uma lista pessoal, orçamento, quantidade e preço pago ao reabrir', () => {
    const storage = memoryStorage()
    const first = createShoppingStore(() => storage)
    first.getState().addList(personalList())
    first.getState().updateList('pessoal', (list) => ({
      ...list,
      budgetCents: 23456,
      items: [
        {
          ...createDemoLists()[0].items[1],
          quantity: 3,
          purchased: true,
          paidPriceCents: 499,
        },
      ],
    }))
    const reopened = createShoppingStore(() => storage)
    expect(reopened.getState().lists).toEqual(first.getState().lists)
    expect(reopened.getState().lists[0]).toMatchObject({
      id: 'pessoal',
      name: 'Mercado de sábado',
      budgetCents: 23456,
      items: [{ quantity: 3, paidPriceCents: 499, purchased: true }],
    })
  })

  it('preserva a exclusão e restauração de um produto entre recarregamentos', () => {
    const storage = memoryStorage()
    const first = createShoppingStore(() => storage)
    const item = first.getState().lists[0].items[0]
    first.getState().updateList('semana', (list) => ({
      ...list,
      items: list.items.filter((existing) => existing.id !== item.id),
    }))
    const reopened = createShoppingStore(() => storage)
    expect(
      reopened
        .getState()
        .lists[0].items.some((existing) => existing.id === item.id),
    ).toBe(false)
    reopened.getState().updateList('semana', (list) => ({
      ...list,
      items: [item, ...list.items],
    }))
    expect(
      createShoppingStore(() => storage).getState().lists[0].items[0],
    ).toEqual(item)
  })

  it('preserva a conclusão da compra e o preço final sem recalcular a estimativa', () => {
    const storage = memoryStorage()
    const first = createShoppingStore(() => storage)
    first.getState().updateList('semana', (list) => ({
      ...list,
      status: 'completed',
      date: '2026-10-27',
    }))
    const reopened = createShoppingStore(() => storage).getState()
    expect(reopened.lists[0]).toMatchObject({
      status: 'completed',
      date: '2026-10-27',
    })
    expect(reopened.lists[0].items[0].paidPriceCents).toBe(599)
    expect(reopened.lists[0].items[0].estimatedPriceCents).toBe(690)
  })

  it('respeita listas vazias salvas, sem reinserir exemplos', () => {
    const storage = memoryStorage(encode([]))
    const store = createShoppingStore(() => storage)
    expect(store.getState().lists).toEqual([])
    expect(store.getState().storageIssue).toBeNull()
    expect(storage.setItem).not.toHaveBeenCalled()
  })

  it('preserva uma lista nova ainda sem produtos', () => {
    const storage = memoryStorage(encode([personalList()]))
    expect(
      createShoppingStore(() => storage).getState().lists[0].items,
    ).toEqual([])
  })

  it('salva somente os dados de compras e ignora chaves que tentem substituir ações', () => {
    const encoded = JSON.stringify({
      version: STORAGE_VERSION,
      state: { lists: [], storageIssue: 'write', addList: 'inválido' },
    })
    const storage = memoryStorage(encoded)
    const store = createShoppingStore(() => storage)
    expect(store.getState().storageIssue).toBeNull()
    store.getState().addList(personalList())
    expect(
      Object.keys(JSON.parse(storage.getItem(STORAGE_KEY)!).state),
    ).toEqual(['lists'])
    expect(store.getState().lists[0].id).toBe('pessoal')
  })
})

describe('recuperação e falhas do navegador', () => {
  it.each([
    '{incompleto',
    'null',
    '[]',
    JSON.stringify({ state: { lists: 'inválido' }, version: STORAGE_VERSION }),
  ])('não quebra nem sobrescreve um registro inválido: %s', (raw) => {
    const storage = memoryStorage(raw)
    const store = createShoppingStore(() => storage)
    expect(store.getState().storageIssue).toBe('invalid')
    expect(() => store.getState().addList(personalList())).not.toThrow()
    expect(store.getState().lists[0].id).toBe('pessoal')
    expect(storage.getItem(STORAGE_KEY)).toBe(raw)
    expect(storage.setItem).not.toHaveBeenCalled()
  })

  it.each([0, STORAGE_VERSION + 1])(
    'preserva os dados de outra versão (%s)',
    (version) => {
      const raw = encode(createDemoLists(), version)
      const storage = memoryStorage(raw)
      const store = createShoppingStore(() => storage)
      expect(store.getState().storageIssue).toBe('version')
      store.getState().addList(personalList())
      expect(storage.getItem(STORAGE_KEY)).toBe(raw)
    },
  )

  it('continua em memória se o acesso ao localStorage estiver bloqueado', () => {
    const store = createShoppingStore(() => {
      throw new Error('SecurityError')
    })
    expect(store.getState().storageIssue).toBe('read')
    expect(() => store.getState().addList(personalList())).not.toThrow()
    expect(store.getState().lists[0].id).toBe('pessoal')
    expect(store.getState().storageIssue).toBe('read')
  })

  it('não grava sobre dados que não conseguiu ler', () => {
    const storage = memoryStorage(encode())
    storage.getItem.mockImplementation(() => {
      throw new Error('Read failed')
    })
    const store = createShoppingStore(() => storage)
    store.getState().addList(personalList())
    expect(store.getState().storageIssue).toBe('read')
    expect(storage.setItem).not.toHaveBeenCalled()
  })

  it('mantém alterações em memória se faltar espaço e salva tudo na próxima gravação bem-sucedida', () => {
    const storage = memoryStorage()
    const store = createShoppingStore(() => storage)
    const previous = storage.getItem(STORAGE_KEY)
    const normalWrite = storage.setItem.getMockImplementation()!
    storage.setItem.mockImplementation(() => {
      throw new Error('QuotaExceededError')
    })
    expect(() => store.getState().addList(personalList())).not.toThrow()
    expect(store.getState().storageIssue).toBe('write')
    expect(store.getState().lists[0].id).toBe('pessoal')
    expect(storage.getItem(STORAGE_KEY)).toBe(previous)
    storage.setItem.mockImplementation(normalWrite)
    store
      .getState()
      .updateList('pessoal', (list) => ({ ...list, budgetCents: 19000 }))
    expect(store.getState().storageIssue).toBeNull()
    expect(
      createShoppingStore(() => storage).getState().lists[0],
    ).toMatchObject({ id: 'pessoal', budgetCents: 19000 })
  })
})

describe('validação dos dados recuperados', () => {
  it.each([
    [
      'quantidade negativa',
      (list: ShoppingList) => {
        list.items[0].quantity = -1
      },
    ],
    [
      'valor fracionário em centavos',
      (list: ShoppingList) => {
        list.budgetCents = 1.5
      },
    ],
    [
      'produto comprado sem preço pago',
      (list: ShoppingList) => {
        list.items[0].paidPriceCents = null
      },
    ],
    [
      'IDs de produtos repetidos',
      (list: ShoppingList) => {
        list.items[1].id = list.items[0].id
      },
    ],
    [
      'data inexistente',
      (list: ShoppingList) => {
        list.date = '2026-02-30'
      },
    ],
    [
      'categoria desconhecida',
      (list: ShoppingList) => {
        Object.assign(list.items[0], { category: ['Hortifruti'] })
      },
    ],
  ] as const)('rejeita %s sem apagar o registro', (_label, corrupt) => {
    const lists = createDemoLists()
    corrupt(lists[0])
    const raw = encode(lists)
    const storage = memoryStorage(raw)
    const store = createShoppingStore(() => storage)
    expect(store.getState().storageIssue).toBe('invalid')
    expect(store.getState().lists).toEqual(createDemoLists())
    expect(storage.getItem(STORAGE_KEY)).toBe(raw)
  })

  it('rejeita IDs de listas duplicados', () => {
    const lists = createDemoLists()
    lists[1].id = lists[0].id
    expect(
      createShoppingStore(() => memoryStorage(encode(lists))).getState()
        .storageIssue,
    ).toBe('invalid')
  })
})
