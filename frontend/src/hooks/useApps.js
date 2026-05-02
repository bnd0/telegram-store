/**
 * hooks/useApps.js — Data-fetching hook for the app list.
 *
 * Handles loading / error state so pages stay clean.
 * Re-fetches when category or search changes.
 */

import { useState, useEffect } from 'react'
import { fetchApps } from '../api'

export function useApps({ category = 'all', search = '', page = 1, pageSize = 20 } = {}) {
  const [data, setData]     = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]   = useState(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)

    fetchApps({ category, search, page, page_size: pageSize })
      .then(res => { if (!cancelled) { setData(res); setLoading(false) } })
      .catch(err => { if (!cancelled) { setError(err.message); setLoading(false) } })

    return () => { cancelled = true }
  }, [category, search, page, pageSize])

  return { data, loading, error }
}
