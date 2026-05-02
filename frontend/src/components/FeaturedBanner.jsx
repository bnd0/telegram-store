/**
 * FeaturedBanner.jsx
 *
 * PURPOSE: Auto-advancing horizontal carousel of featured apps at the top
 * of the home screen. Uses CSS scroll-snap for smooth swiping.
 * Each slide shows the app banner image, name, and an Open button.
 *
 * Tapping a slide navigates to /app/:id.
 * The Open button additionally calls recordLaunch() to increment the counter.
 */

import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { fetchFeatured, recordLaunch } from '../api'

const tg = window?.Telegram?.WebApp

export default function FeaturedBanner() {
  const [apps, setApps] = useState([])
  const [active, setActive] = useState(0)
  const scrollRef = useRef(null)
  const navigate  = useNavigate()

  useEffect(() => {
    fetchFeatured().then(setApps).catch(console.error)
  }, [])

  // Auto-advance every 4 seconds
  useEffect(() => {
    if (apps.length < 2) return
    const id = setInterval(() => {
      setActive(a => {
        const next = (a + 1) % apps.length
        scrollRef.current?.children[next]?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'start' })
        return next
      })
    }, 4000)
    return () => clearInterval(id)
  }, [apps])

  const handleOpen = (e, app) => {
    e.stopPropagation()
    recordLaunch(app.id).catch(console.error)
    if (tg) tg.openTelegramLink(app.telegram_url)
    else window.open(app.telegram_url, '_blank')
  }

  if (!apps.length) return (
    <div className="mx-4 h-40 bg-tg-panel rounded-2xl animate-pulse" />
  )

  return (
    <div className="relative mx-4">
      {/* Slide container */}
      <div
        ref={scrollRef}
        className="flex overflow-x-auto hide-scrollbar gap-3 snap-x snap-mandatory"
      >
        {apps.map((app, i) => (
          <div
            key={app.id}
            onClick={() => navigate(`/app/${app.id}`)}
            className="shrink-0 w-full snap-start relative rounded-2xl overflow-hidden cursor-pointer bg-tg-panel border border-tg-border h-44"
          >
            {app.banner_url
              ? <img src={app.banner_url} alt={app.name} className="w-full h-full object-cover" />
              : <div className="w-full h-full bg-gradient-to-br from-tg-blue/40 to-tg-panel" />
            }

            {/* Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

            <div className="absolute bottom-0 left-0 right-0 p-3 flex items-end justify-between">
              <div>
                <div className="flex items-center gap-1 mb-0.5">
                  {app.is_featured && (
                    <span className="text-[10px] bg-tg-blue text-white px-1.5 py-0.5 rounded-full font-medium">Featured</span>
                  )}
                  {app.is_verified && (
                    <span className="text-[10px] bg-green-500/80 text-white px-1.5 py-0.5 rounded-full font-medium">Verified</span>
                  )}
                </div>
                <p className="text-white font-semibold text-base leading-tight">{app.name}</p>
                <p className="text-white/60 text-xs">{app.developer}</p>
              </div>
              <button
                onClick={e => handleOpen(e, app)}
                className="bg-tg-blue text-white text-sm font-semibold px-4 py-1.5 rounded-xl shrink-0 hover:bg-blue-400 transition"
              >
                Open
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Dot indicators */}
      <div className="flex justify-center gap-1.5 mt-2">
        {apps.map((_, i) => (
          <span
            key={i}
            className={`h-1.5 rounded-full transition-all ${i === active ? 'w-4 bg-tg-blue' : 'w-1.5 bg-tg-border'}`}
          />
        ))}
      </div>
    </div>
  )
}
