/**
 * pages/FavoritesPage.jsx
 *
 * PURPOSE: Shows the logged-in Telegram user's favorited apps.
 * Fetches from /favorites?telegram_user_id=... on mount.
 * If the user isn't inside Telegram (dev browser), shows a prompt.
 */

import { useState, useEffect } from 'react'
import { fetchFavorites } from '../api'
import { useStore } from '../store'
import AppCard from '../components/AppCard'

export default function FavoritesPage() {
  const { tgUser, setFavIds } = useStore()
  const [apps, setApps]       = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!tgUser) { setLoading(false); return }
    fetchFavorites(String(tgUser.id))
      .then(data => {
        setApps(data)
        setFavIds(data.map(a => a.id))
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [tgUser])

  if (!tgUser) return (
    <div className="flex flex-col items-center justify-center h-64 text-center px-8 gap-3">
      <span className="text-5xl">🔒</span>
      <p className="text-tg-text font-semibold">Open inside Telegram</p>
      <p className="text-tg-muted text-sm">Favorites are tied to your Telegram account. Open this app from a Telegram bot to sync them.</p>
    </div>
  )

  return (
    <div className="pb-24 pt-4 px-4">
      <h1 className="text-tg-text font-bold text-xl mb-1">❤️ Favorites</h1>
      <p className="text-tg-muted text-sm mb-4">Apps you've saved</p>

      {loading && (
        <div className="grid grid-cols-2 gap-3">
          {[1,2,3,4].map(i => <div key={i} className="bg-tg-panel rounded-2xl h-40 animate-pulse" />)}
        </div>
      )}

      {!loading && apps.length === 0 && (
        <div className="flex flex-col items-center justify-center h-48 gap-3 text-center">
          <span className="text-4xl">💔</span>
          <p className="text-tg-muted text-sm">No favorites yet. Tap the heart on any app to save it.</p>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        {apps.map(app => <AppCard key={app.id} app={app} />)}
      </div>
    </div>
  )
}
