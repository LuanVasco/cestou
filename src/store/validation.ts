import type { GroceryItem, ShoppingList } from '../types'

export interface SavedLists {
  lists: ShoppingList[]
  favorites?: GroceryItem[]
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

const isText = (value: unknown): value is string =>
  typeof value === 'string' && value.trim().length > 0

const isMoney = (value: unknown): value is number =>
  typeof value === 'number' &&
  Number.isSafeInteger(value) &&
  value >= 0 &&
  value <= 100_000_000

const isOptionalMoney = (value: unknown) => value === null || isMoney(value)

function isItem(value: unknown): value is GroceryItem {
  return (
    isRecord(value) &&
    isText(value.id) &&
    isText(value.name) &&
    isText(value.emoji) &&
    typeof value.category === 'string' &&
    ['Hortifruti', 'Mercearia', 'Laticínios', 'Padaria', 'Limpeza'].includes(
      value.category,
    ) &&
    typeof value.quantity === 'number' &&
    Number.isInteger(value.quantity) &&
    value.quantity >= 1 &&
    value.quantity <= 9999 &&
    isOptionalMoney(value.estimatedPriceCents) &&
    typeof value.purchased === 'boolean' &&
    (value.purchased
      ? isMoney(value.paidPriceCents)
      : value.paidPriceCents === null)
  )
}

function isDate(value: unknown): value is string {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value))
    return false
  const date = new Date(`${value}T00:00:00Z`)
  return (
    Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value
  )
}

function isList(value: unknown): value is ShoppingList {
  return (
    isRecord(value) &&
    isText(value.id) &&
    isText(value.name) &&
    typeof value.description === 'string' &&
    isText(value.emoji) &&
    typeof value.color === 'string' &&
    ['green', 'peach', 'lavender'].includes(value.color) &&
    isMoney(value.budgetCents) &&
    value.budgetCents > 0 &&
    typeof value.status === 'string' &&
    ['active', 'completed'].includes(value.status) &&
    isDate(value.date) &&
    Array.isArray(value.items) &&
    value.items.every(isItem) &&
    new Set(value.items.map((item) => item.id)).size === value.items.length
  )
}

export function isSavedLists(value: unknown): value is SavedLists {
  return (
    isRecord(value) &&
    (value.favorites === undefined ||
      (Array.isArray(value.favorites) && value.favorites.every(isItem))) &&
    Array.isArray(value.lists) &&
    value.lists.every(isList) &&
    new Set(value.lists.map((list) => list.id)).size === value.lists.length
  )
}
