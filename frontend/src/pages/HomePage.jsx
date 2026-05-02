/**
 * pages/HomePage.jsx
 *
 * PURPOSE: Main landing screen.
 * Layout (top → bottom):
 *   1. FeaturedBanner (auto-scrolling hero)
 *   2. CategoryTabs (filter pills)
 *   3. App grid (2 columns, infinite-ish pagination via Load More)
 *
 * Reads activeCategory and searchQuery from Zustand.
 * When searchQuery is non-empty the user is shown SearchPage instead (see App.jsx).
 */

import { useState, useEffect } from 'react'
import { useStore } from '../store'
import { useApps } from '../hooks/useApps'
import FeaturedBanner from '../components/FeaturedBanner'
import CategoryTabs from '../components/CategoryTabs'
import AppCard from '../components/AppCard'

export default function HomePage() {
  const { activeCategory, searchQuery } = useStore()
  const [page, setPage] = useState(1)
  const [allItems, setAllItems] = useState([])

  const { data, loading } = useApps({
    category: activeCategory,
    search: searchQuery,
    page,
    pageSize: 20,
  })

  // Reset when filter changes
  useEffect(() => {
    setPage(1)
    setAllItems([])
  }, [activeCategory, searchQuery])

  // Append new page results
  useEffect(() => {
    if (data?.items) {
      setAllItems(prev => page === 1 ? data.items : [...prev, ...data.items])
    }
  }, [data])

  const hasMore = data ? allItems.length < data.total : false

  return (
    <div className="pb-24">
      {/* Only show banner when not filtering */}
      {activeCategory === 'all' && !searchQuery && (
        <div className="pt-3 pb-2">
          <FeaturedBanner />
        </div>
      )}

      <CategoryTabs />

      {/* Section title */}
      <div className="px-4 py-2">
        <h2 className="text-tg-text font-semibold text-base">
          {searchQuery
            ? `Results for "${searchQuery}"`
            : activeCategory === 'all'
              ? 'All Apps'
              : null
          }
        </h2>
        {data && (
          <p className="text-xs text-tg-muted">{data.total.toLocaleString()} apps</p>
        )}
      </div>

      {/* Grid */}
      <div className="px-4 grid grid-cols-2 gap-3">
        {allItems.map(app => (
          <AppCard key={app.id} app={app} />
        ))}
        {loading && [1, 2, 3, 4].map(i => (
          <div key={i} className="bg-tg-panel rounded-2xl h-40 animate-pulse" />
        ))}
      </div>

      {/* Load more */}
      {hasMore && !loading && (
        <div className="px-4 mt-4">
          <button
            onClick={() => setPage(p => p + 1)}
            className="w-full py-2.5 rounded-xl border border-tg-border text-tg-muted text-sm hover:border-tg-blue hover:text-tg-blue transition"
          >
            Load more
          </button>
        </div>
      )}
    </div>
  )
}
