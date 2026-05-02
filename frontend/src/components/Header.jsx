/**
 * Header.jsx
 *
 * PURPOSE: Top navigation bar.
 * - Shows the store brand name on the left
 * - Shows the Telegram user's first name + avatar initial on the right
 *   (from window.Telegram.WebApp.initDataUnsafe.user)
 * - Contains the search input that updates global searchQuery in Zustand
 */

import { useStore } from '../store'

export default function Header({ onSearchFocus }) {
  const { tgUser, searchQuery, setSearchQuery } = useStore()

  const initials = tgUser
    ? (tgUser.first_name?.[0] ?? '') + (tgUser.last_name?.[0] ?? '')
    : '?'

  return (
    <header className="sticky top-0 z-30 bg-tg-dark/95 backdrop-blur border-b border-tg-border px-4 py-3">
      <div className="flex items-center gap-3 mb-3">
        {/* Brand */}
        <div className="flex-1">
          <span className="text-tg-blue font-semibold text-lg tracking-tight">TG</span>
          <span className="text-tg-text font-semibold text-lg tracking-tight"> Store</span>
        </div>

        {/* Telegram user avatar */}
        <div className="w-8 h-8 rounded-full bg-tg-blue flex items-center justify-center text-white text-xs font-semibold shrink-0">
          {initials}
        </div>
      </div>

      {/* Search bar */}
      <div className="relative">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-tg-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
        </svg>
        <input
          type="text"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          onFocus={onSearchFocus}
          placeholder="Search apps…"
          className="w-full bg-tg-panel border border-tg-border rounded-xl pl-9 pr-4 py-2 text-sm text-tg-text placeholder:text-tg-muted focus:outline-none focus:border-tg-blue transition"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-tg-muted hover:text-tg-text"
          >
            ✕
          </button>
        )}
      </div>
    </header>
  )
}
