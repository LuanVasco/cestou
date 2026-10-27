import type { PersistStorage } from 'zustand/middleware'
import { isRecord, isSavedLists } from './validation'
import type { SavedLists } from './validation'

export const STORAGE_KEY = 'cestou.shopping-lists'
export const STORAGE_VERSION = 1
export type StorageIssue = 'read' | 'write' | 'invalid' | 'version' | null
export type BrowserStorage = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>

export function createListStorage(
  getStorage: () => BrowserStorage,
  reportIssue: (issue: StorageIssue) => void,
) {
  let wasEmpty = false
  let writesBlocked = false

  const storage: PersistStorage<SavedLists> = {
    getItem(name) {
      let raw: string | null
      try {
        raw = getStorage().getItem(name)
      } catch {
        writesBlocked = true
        reportIssue('read')
        return null
      }
      if (raw === null) {
        wasEmpty = true
        return null
      }
      let parsed: unknown
      try {
        parsed = JSON.parse(raw)
      } catch {
        writesBlocked = true
        reportIssue('invalid')
        return null
      }
      if (
        isRecord(parsed) &&
        typeof parsed.version === 'number' &&
        parsed.version !== STORAGE_VERSION
      ) {
        writesBlocked = true
        reportIssue('version')
        return null
      }
      if (
        !isRecord(parsed) ||
        parsed.version !== STORAGE_VERSION ||
        !isSavedLists(parsed.state)
      ) {
        writesBlocked = true
        reportIssue('invalid')
        return null
      }
      // Only domain data is hydrated; persisted values cannot replace actions.
      return { state: { lists: parsed.state.lists }, version: STORAGE_VERSION }
    },
    setItem(name, value) {
      // Preserve unreadable or incompatible records instead of overwriting them.
      if (writesBlocked) return
      try {
        getStorage().setItem(name, JSON.stringify(value))
        reportIssue(null)
      } catch {
        reportIssue('write')
      }
    },
    removeItem(name) {
      if (writesBlocked) return
      try {
        getStorage().removeItem(name)
      } catch {
        reportIssue('write')
      }
    },
  }

  return { storage, wasEmpty: () => wasEmpty }
}
