export type GroceryCategory =
  'Hortifruti' | 'Mercearia' | 'Laticínios' | 'Padaria' | 'Limpeza'

export interface GroceryItem {
  id: string
  name: string
  category: GroceryCategory
  emoji: string
  quantity: number
  estimatedPriceCents: number | null
  paidPriceCents: number | null
  purchased: boolean
}

export interface ShoppingList {
  id: string
  name: string
  description: string
  emoji: string
  color: 'green' | 'peach' | 'lavender'
  budgetCents: number
  status: 'active' | 'completed'
  date: string
  items: GroceryItem[]
}

export type Route =
  | { page: 'home' }
  | { page: 'list'; id: string }
  | { page: 'summary'; id: string }
