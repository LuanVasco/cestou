import { describe, expect, it } from 'vitest'
import {
  freshItem,
  listTemplates,
  parseQuickProducts,
  productKey,
} from './quickList'

describe('inclusão rápida', () => {
  it('interpreta texto colado, quantidades e separadores sem alterar nomes de embalagens', () => {
    expect(
      parseQuickProducts('2 leites, arroz; 3x café\nSabão 500 g'),
    ).toMatchObject([
      { name: 'leites', quantity: 2 },
      { name: 'arroz', quantity: 1 },
      { name: 'café', quantity: 3 },
      { name: 'Sabão 500 g', quantity: 1 },
    ])
  })
  it('soma repetições com espaços, maiúsculas e acentos equivalentes', () => {
    expect(parseQuickProducts('2 café, CAFE')).toMatchObject([
      { name: 'café', quantity: 3 },
    ])
  })
  it.each([
    '',
    '0 leite',
    '-2 leite',
    '10000 leite',
    '9999 leite, 1 leite',
    '1,5 kg banana',
    '1.5 leite',
    '0,5kg banana',
    '2.5',
    'a'.repeat(81),
    Array(101).fill('arroz').join(','),
  ])('rejeita entrada inválida: %s', (text) => {
    expect(() => parseQuickProducts(text)).toThrow()
  })
  it('gera cópias independentes dos modelos, sem preço ou marcações de compra', () => {
    const draft = listTemplates[0].items[0]
    const a = freshItem(draft)
    const b = freshItem(draft)
    expect(a.id).not.toBe(b.id)
    expect(a).toMatchObject({
      purchased: false,
      paidPriceCents: null,
      estimatedPriceCents: null,
    })
    a.name = 'Alterado'
    expect(draft.name).not.toBe('Alterado')
    expect(productKey({ ...b, name: '  CAFÉ  ' })).toBe(
      productKey({ ...b, name: 'cafe' }),
    )
  })
})
