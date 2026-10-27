import { useEffect, useState } from 'react'
import type { Route } from '../types'

function readRoute(): Route {
  const parts = window.location.hash.replace(/^#\/?/, '').split('/')
  if (parts[0] === 'lista' && parts[1]) return { page: 'list', id: parts[1] }
  if (parts[0] === 'resumo' && parts[1])
    return { page: 'summary', id: parts[1] }
  return { page: 'home' }
}

export function useRoute() {
  const [route, setRoute] = useState<Route>(readRoute)
  useEffect(() => {
    const change = () => {
      setRoute(readRoute())
      window.scrollTo({ top: 0, behavior: 'instant' })
      requestAnimationFrame(() =>
        document.getElementById('page-title')?.focus(),
      )
    }
    window.addEventListener('hashchange', change)
    return () => window.removeEventListener('hashchange', change)
  }, [])
  return route
}

export const navigate = (path: string) => {
  window.location.hash = path
}
