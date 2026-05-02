/**
 * pages/AppDetailPage.jsx
 *
 * PURPOSE: Full-screen detail view for a single app.
 * Navigated to from AppCard (route: /app/:id).
 *
 * Sections:
 *   - Banner image
 *   - Icon + name + developer + badges
 *   - Open in Telegram button (calls recordLaunch then opens t.me link)
 *   - Stats row: rating, installs, review count
 *   - Description
 *   - ReviewList (read + post)
 *
 * On mobile inside Telegram the back gesture uses tg.BackButton.
 */

import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { fetchApp, recordLaunch, toggleFavorite } from '../api'
import { useStore } from '../store'
import StarRating from '../components/StarRating'
import ReviewList from '../components/ReviewList'

const tg = window?.Telegram?.WebApp

function fmtNum(n) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M'
  if (n >= 1_000)     return (n / 1_000).toFixed(0) + 'K'
  return String(n)
}

export default function AppDetailPage() {
  const { id }  = useParams()
  const navigate = useNavigate()
  const { tgUser, favIds, toggleFavId } = useStore()

  const [app,     setApp]     = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchApp(id)
      .then(setApp)
      .catch(() => navigate('/'))
      .finally(() => setLoading(false))

    // Register Telegram back button
    if (tg) {
      tg.BackButton.show()
      tg.BackButton.onClick(() => navigate(-1))
    }
    return () => tg?.BackButton.hide()
  }, [id])

  const handleOpen = async () => {
    if (app) {
      await recordLaunch(app.id).catch(console.error)
      if (tg) tg.openTelegramLink(app.telegram_url)
      else window.open(app.telegram_url, '_blank')
    }
  }

  const handleFav = async () => {
    if (!tgUser || !app) return
    toggleFavId(app.id)
    try {
      await toggleFavorite(app.id, String(tgUser.id))
    } catch {
      toggleFavId(app.id)
    }
  }

  if (loading) return (
    <div className="p-4 space-y-3">
      <div className="h-48 bg-tg-panel rounded-2xl animate-pulse" />
      <div className="h-6 bg-tg-panel rounded-xl animate-pulse w-2/3" />
      <div className="h-4 bg-tg-panel rounded-xl animate-pulse w-1/3" />
    </div>
  )

  if (!app) return null

  const isFav = favIds.has(app.id)

  return (
    <div className="pb-8">
      {/* Banner */}
      <div className="relative h-52 bg-tg-panel overflow-hidden">
        {app.banner_url
          ? <img src={app.banner_url} alt={app.name} className="w-full h-full object-cover" />
          : <div className="w-full h-full bg-gradient-to-br from-tg-blue/30 to-tg-panel" />
        }
        <div className="absolute inset-0 bg-gradient-to-t from-tg-dark via-transparent" />
        <button
          onClick={() => navigate(-1)}
          className="absolute top-3 left-3 bg-black/40 backdrop-blur text-white w-8 h-8 rounded-full flex items-center justify-center text-lg"
        >
          ‹
        </button>
        <button
          onClick={handleFav}
          className="absolute top-3 right-3 bg-black/40 backdrop-blur text-white w-8 h-8 rounded-full flex items-center justify-center"
        >
          {isFav ? '❤️' : '🤍'}
        </button>
      </div>

      <div className="px-4 -mt-6 relative z-10">
        {/* App identity */}
        <div className="flex items-end gap-3 mb-4">
          <img src={app.icon_url} alt={app.name} className="w-20 h-20 rounded-2xl border-4 border-tg-dark object-cover shadow-xl" />
          <div className="mb-1 flex-1 min-w-0">
            <div className="flex items-center gap-1 flex-wrap">
              <h1 className="text-lg font-bold text-tg-text leading-tight">{app.name}</h1>
              {app.is_verified && <span className="text-tg-blue text-sm">✓</span>}
              {app.is_featured && (
                <span className="text-[10px] bg-tg-blue/20 text-tg-blue px-1.5 py-0.5 rounded-full">Featured</span>
              )}
            </div>
            <p className="text-sm text-tg-muted">{app.developer}</p>
            <p className="text-xs text-tg-muted">{app.category?.icon} {app.category?.name}</p>
          </div>
        </div>

        {/* Open button */}
        <button
          onClick={handleOpen}
          className="w-full bg-tg-blue text-white font-semibold py-3 rounded-2xl hover:bg-blue-400 active:scale-95 transition-all mb-4 text-base"
        >
          Open in Telegram
        </button>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          {[
            { label: 'Rating', value: app.rating.toFixed(1), sub: <StarRating rating={app.rating} /> },
            { label: 'Installs', value: fmtNum(app.installs), sub: 'downloads' },
            { label: 'Reviews', value: fmtNum(app.review_count), sub: 'user reviews' },
          ].map(s => (
            <div key={s.label} className="bg-tg-panel border border-tg-border rounded-2xl p-3 text-center">
              <p className="text-tg-text font-bold text-lg leading-tight">{s.value}</p>
              <div className="text-xs text-tg-muted">{s.sub}</div>
            </div>
          ))}
        </div>

        {/* Description */}
        <div className="mb-6">
          <h2 className="text-tg-text font-semibold mb-2">About</h2>
          <p className="text-sm text-tg-muted leading-relaxed">{app.description}</p>
        </div>

        {/* Reviews */}
        <ReviewList appId={app.id} />
      </div>
    </div>
  )
}
