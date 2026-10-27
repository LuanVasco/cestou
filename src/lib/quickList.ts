import type { GroceryCategory, GroceryItem } from '../types'

export const categories: GroceryCategory[] = [
  'Hortifruti',
  'Mercearia',
  'Laticínios',
  'Padaria',
  'Limpeza',
]
export const categoryEmoji: Record<GroceryCategory, string> = {
  Hortifruti: '🥑',
  Mercearia: '🛒',
  Laticínios: '🥛',
  Padaria: '🥖',
  Limpeza: '🧴',
}
export type ProductDraft = Omit<
  GroceryItem,
  'id' | 'purchased' | 'paidPriceCents'
>
export const productKey = (item: Pick<GroceryItem, 'name' | 'category'>) =>
  `${item.category}:${item.name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .replace(/\s+/g, ' ')
    .toLocaleLowerCase('pt-BR')}`

export function freshItem(item: ProductDraft): GroceryItem {
  return {
    ...item,
    id: crypto.randomUUID(),
    purchased: false,
    paidPriceCents: null,
  }
}

const product = (
  name: string,
  category: GroceryCategory,
  quantity = 1,
): ProductDraft => ({
  name,
  category,
  quantity,
  emoji: categoryEmoji[category],
  estimatedPriceCents: null,
})

export const listTemplates = [
  {
    id: 'week',
    name: 'Compras da semana',
    emoji: '🛒',
    items: [
      product('Arroz · pacote', 'Mercearia'),
      product('Feijão · pacote', 'Mercearia'),
      product('Leite · 1 L', 'Laticínios', 2),
      product('Banana · porção', 'Hortifruti'),
      product('Tomate · porção', 'Hortifruti'),
      product('Pão · pacote', 'Padaria'),
    ],
  },
  {
    id: 'breakfast',
    name: 'Café da manhã',
    emoji: '☕',
    items: [
      product('Café · pacote', 'Mercearia'),
      product('Leite · 1 L', 'Laticínios', 2),
      product('Pão · pacote', 'Padaria'),
      product('Manteiga · pote', 'Laticínios'),
      product('Banana · porção', 'Hortifruti'),
    ],
  },
  {
    id: 'cleaning',
    name: 'Limpeza da casa',
    emoji: '🧴',
    items: [
      product('Detergente · frasco', 'Limpeza', 2),
      product('Esponja · pacote', 'Limpeza'),
      product('Sabão em pó · pacote', 'Limpeza'),
      product('Desinfetante · frasco', 'Limpeza'),
      product('Saco de lixo · pacote', 'Limpeza'),
    ],
  },
]

export function parseQuickProducts(text: string): ProductDraft[] {
  if (/\d+[.,]\d+(?:\s|[a-zA-Z×]|$)/.test(text))
    throw new Error(
      'Use quantidades inteiras por unidade ou pacote. Ex.: 2 leites. Para 1,5 kg, cadastre uma porção e ajuste o nome.',
    )
  const parts = text
    .split(/[,;\n]+/)
    .map((part) => part.trim())
    .filter(Boolean)
  if (!parts.length) throw new Error('Digite pelo menos um produto.')
  if (parts.length > 100) throw new Error('Adicione até 100 produtos por vez.')
  const products = new Map<string, ProductDraft>()
  for (const part of parts) {
    const match = part.match(/^([+-]?\d+)\s*(?:[x×]\s*|\s+)(.+)$/i)
    const quantity = match ? Number(match[1]) : 1
    const name = (match ? match[2] : part).trim()
    if (!name || name.length > 80)
      throw new Error('Cada nome deve ter entre 1 e 80 caracteres.')
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > 9999)
      throw new Error('Use uma quantidade entre 1 e 9.999 por produto.')
    const draft = product(name, 'Mercearia', quantity)
    const key = productKey(draft)
    const existing = products.get(key)
    if (existing) {
      existing.quantity += quantity
      if (existing.quantity > 9999)
        throw new Error(
          'A soma das quantidades de um produto não pode ultrapassar 9.999.',
        )
    } else products.set(key, draft)
  }
  return [...products.values()]
}
