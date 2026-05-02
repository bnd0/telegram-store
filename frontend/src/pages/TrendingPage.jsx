/**
 * pages/TrendingPage.jsx
 *
 * PURPOSE: Shows all apps sorted by rating descending.
 * Re-uses the same /apps endpoint with page_size=50 and
 * client-side sorts by rating for a fast trending view.
 */

import { useState, useEffect } from 'react'
import { fetchApps } from '../api'
import AppCard from '../components/AppCard'

export default function TrendingPage() {
  const [apps, setApps]       = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchApps({ page: 1, page_size: 50 })
      .then(r => {
        const sorted = [...r.items].sort((a, b) => b.rating - a.rating || b.installs - a.installs)
        setApps(sorted)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="pb-24 pt-4 px-4">
      <h1 className="text-tg-text font-bold text-xl mb-1">🔥 Trending</h1>
      <p className="text-tg-muted text-sm mb-4">Top-rated apps right now</p>

      <div className="grid grid-cols-2 gap-3">
        {loading
          ? [1,2,3,4,5,6].map(i => <div key={i} className="bg-tg-panel rounded-2xl h-40 animate-pulse" />)
          : apps.map((app, i) => (
              <div key={app.id} className="relative">
                {i < 3 && (
                  <div className="absolute -top-2 -left-2 z-10 w-6 h-6 rounded-full bg-tg-blue text-white text-xs font-bold flex items-center justify-center shadow">
                    {i + 1}
                  </div>
                )}
                <AppCard app={app} />
              </div>
            ))
        }
      </div>
    </div>
  )
}
