/**
 * BottomNav.jsx
 *
 * PURPOSE: Fixed bottom navigation bar mimicking Telegram's UI.
 * Four tabs: Home, Search, Trending (top-rated), Favorites.
 * Active tab is highlighted in tg-blue; inactive tabs are muted.
 */

import { useNavigate, useLocation } from 'react-router-dom'

const TABS = [
  { path: '/',          icon: '🏠', label: 'Home'      },
  { path: '/search',    icon: '🔍', label: 'Search'    },
  { path: '/trending',  icon: '🔥', label: 'Trending'  },
  { path: '/favorites', icon: '❤️', label: 'Favorites' },
]

export default function BottomNav() {
  const navigate  = useNavigate()
  const { pathname } = useLocation()

  return (
    <nav className="fixed bottom-0 inset-x-0 z-30 bg-tg-dark/95 backdrop-blur border-t border-tg-border">
      <div className="flex">
        {TABS.map(tab => {
          const active = pathname === tab.path
          return (
            <button
              key={tab.path}
              onClick={() => navigate(tab.path)}
              className={`flex-1 flex flex-col items-center gap-0.5 py-2 transition-colors ${
                active ? 'text-tg-blue' : 'text-tg-muted hover:text-tg-text'
              }`}
            >
              <span className="text-xl leading-none">{tab.icon}</span>
              <span className="text-[10px] font-medium">{tab.label}</span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
