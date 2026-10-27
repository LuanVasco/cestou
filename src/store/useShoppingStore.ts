import { useStore } from 'zustand'
import { createShoppingStore } from './shoppingStore'
import type { ShoppingState } from './shoppingStore'

const shoppingStore = createShoppingStore()

export function useShoppingStore<T>(selector: (state: ShoppingState) => T) {
  return useStore(shoppingStore, selector)
}
