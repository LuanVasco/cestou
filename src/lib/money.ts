import type { ShoppingList } from '../types'

export const formatMoney = (cents: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
    cents / 100,
  )

export function parseMoney(value: string): number | null {
  const stripped = value.trim().replace(/\s|R\$/g, '')
  if (
    stripped.includes(',') &&
    !/^(?:\d+|\d{1,3}(?:\.\d{3})+),\d{1,2}$/.test(stripped)
  )
    return null
  const normalized = stripped.includes(',')
    ? stripped.replace(/\./g, '').replace(',', '.')
    : /^\d{1,3}(\.\d{3})+$/.test(stripped)
      ? stripped.replace(/\./g, '')
      : stripped
  if (!/^\d+(\.\d{1,2})?$/.test(normalized)) return null
  const cents = Math.round(Number(normalized) * 100)
  return Number.isSafeInteger(cents) && cents <= 100_000_000 ? cents : null
}

export function getTotals(list: ShoppingList) {
  const purchased = list.items.filter((item) => item.purchased)
  const pending = list.items.filter((item) => !item.purchased)
  const spent = purchased.reduce(
    (sum, item) => sum + (item.paidPriceCents ?? 0) * item.quantity,
    0,
  )
  const pendingEstimate = pending.reduce(
    (sum, item) => sum + (item.estimatedPriceCents ?? 0) * item.quantity,
    0,
  )
  return {
    spent,
    projected: spent + pendingEstimate,
    remaining: list.budgetCents - spent,
    purchased: purchased.length,
    pending: pending.length,
    unpriced: pending.filter((item) => item.estimatedPriceCents === null)
      .length,
    progress: list.items.length
      ? Math.round((purchased.length / list.items.length) * 100)
      : 0,
  }
}

export function formatDate(value: string) {
  return new Intl.DateTimeFormat('pt-BR', { day: 'numeric', month: 'short' })
    .format(new Date(`${value}T12:00:00`))
    .replace('.', '')
}
