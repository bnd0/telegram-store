/**
 * AppCard.jsx
 *
 * PURPOSE: Compact card displayed in the app grid.
 * Shows: icon, name, category, rating, install count, verified badge.
 * Tapping navigates to /app/:id (AppDetail page).
 * Heart button toggles favorites optimistically via Zustand + API.
 */

import { useNavigate } from 'react-router-dom'
import { useStore } from '../store'
import { toggleFavorite } from '../api'
import StarRating from './StarRating'

function fmtInstalls(n) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M'
  if (n >= 1_000)     return (n / 1_000).toFixed(0) + 'K'
  return String(n)
}

export default function AppCard({ app }) {
  const navigate = useNavigate()
  const { tgUser, favIds, toggleFavId } = useStore()
  const isFav = favIds.has(app.id)

  const handleFav = async (e) => {
    e.stopPropagation()
    if (!tgUser) return
    toggleFavId(app.id)                               // optimistic
    try {
      await toggleFavorite(app.id, String(tgUser.id))
    } catch {
      toggleFavId(app.id)                             // revert on error
    }
  }

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => navigate(`/app/${app.id}`)}
      className="bg-tg-panel border border-tg-border rounded-2xl p-3 flex flex-col gap-2 cursor-pointer hover:border-tg-blue transition-all active:scale-95"
    >
      {/* Icon row */}
      <div className="flex items-start justify-between">
        <img
          src={app.icon_url}
          alt={app.name}
          className="w-14 h-14 rounded-2xl object-cover bg-tg-dark"
          loading="lazy"
        />
        <button
          onClick={handleFav}
          aria-label={isFav ? 'Remove from favorites' : 'Add to favorites'}
          className="text-lg leading-none mt-0.5 transition-transform active:scale-125"
        >
          {isFav ? '❤️' : '🤍'}
        </button>
      </div>

      {/* Name + verified */}
      <div>
        <div className="flex items-center gap-1">
          <span className="text-sm font-semibold text-tg-text truncate">{app.name}</span>
          {app.is_verified && <span title="Verified" className="text-tg-blue text-xs">✓</span>}
        </div>
        <span className="text-xs text-tg-muted">{app.category?.name}</span>
      </div>

      {/* Rating + installs */}
      <div className="flex items-center justify-between mt-auto">
        <div className="flex items-center gap-1">
          <StarRating rating={app.rating} />
          <span className="text-xs text-tg-muted">{app.rating.toFixed(1)}</span>
        </div>
        <span className="text-xs text-tg-muted">{fmtInstalls(app.installs)}</span>
      </div>
    </div>
  )
}
