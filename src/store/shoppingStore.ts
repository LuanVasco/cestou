import { createStore } from 'zustand/vanilla'
import { persist } from 'zustand/middleware'
import { createDemoLists } from '../data/demo'
import { productKey } from '../lib/quickList'
import type { GroceryItem, ShoppingList } from '../types'
import { createListStorage, STORAGE_KEY, STORAGE_VERSION } from './storage'
import type { BrowserStorage, StorageIssue } from './storage'
import { isSavedLists } from './validation'
import type { SavedLists } from './validation'

export interface ShoppingState {
  lists: ShoppingList[]
  favorites: GroceryItem[]
  toggleFavorite: (item: GroceryItem) => void
  storageIssue: StorageIssue
  addList: (list: ShoppingList) => void
  updateList: (id: string, update: (list: ShoppingList) => ShoppingList) => void
}

export function createShoppingStore(
  getStorage: () => BrowserStorage = () => window.localStorage,
) {
  let initialIssue: StorageIssue = null
  let reportIssue = (issue: StorageIssue) => {
    initialIssue = issue
  }
  let setIssue = reportIssue
  const { storage, wasEmpty } = createListStorage(getStorage, (issue) =>
    reportIssue(issue),
  )

  const store = createStore<ShoppingState>()((set, get, api) => {
    // Use the original setter for status, so reporting a failed write never
    // triggers another write through the persist middleware.
    setIssue = (issue) =>
      set((state) =>
        state.storageIssue === issue ? state : { storageIssue: issue },
      )
    return persist<ShoppingState, [], [], SavedLists>(
      (persistedSet) => ({
        lists: createDemoLists(),
        favorites: [],
        toggleFavorite: (item) =>
          persistedSet((state) => ({
            favorites: state.favorites.some(
              (favorite) => productKey(favorite) === productKey(item),
            )
              ? state.favorites.filter(
                  (favorite) => productKey(favorite) !== productKey(item),
                )
              : [
                  ...state.favorites,
                  {
                    ...item,
                    estimatedPriceCents:
                      item.paidPriceCents ?? item.estimatedPriceCents,
                    purchased: false,
                    paidPriceCents: null,
                  },
                ],
          })),
        storageIssue: null,
        addList: (list) =>
          persistedSet((state) => ({ lists: [list, ...state.lists] })),
        updateList: (id, update) =>
          persistedSet((state) => ({
            lists: state.lists.map((list) =>
              list.id === id ? update(list) : list,
            ),
          })),
      }),
      {
        name: STORAGE_KEY,
        version: STORAGE_VERSION,
        storage,
        partialize: (state) => ({
          lists: state.lists,
          favorites: state.favorites,
        }),
        merge: (saved, current) => ({
          ...current,
          lists: isSavedLists(saved) ? saved.lists : current.lists,
          favorites: isSavedLists(saved)
            ? (saved.favorites ?? [])
            : current.favorites,
        }),
      },
    )(set, get, api)
  })

  // localStorage hydrates synchronously, before React's first render.
  reportIssue = setIssue
  setIssue(initialIssue)
  if (wasEmpty()) {
    storage.setItem(STORAGE_KEY, {
      state: { lists: store.getState().lists, favorites: [] },
      version: STORAGE_VERSION,
    })
  }
  return store
}
