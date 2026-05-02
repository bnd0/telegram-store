/**
 * App.jsx — Root component.
 *
 * Sets up React Router, initialises the Telegram WebApp SDK,
 * and wraps all pages with the shared Header and BottomNav.
 *
 * When the user types in the search bar the Header updates
 * the global searchQuery; App.jsx redirects to / where
 * HomePage reads the query and passes it to the useApps hook.
 */

import { useEffect } from 'react'
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom'
import { useStore } from './store'

import Header     from './components/Header'
import BottomNav  from './components/BottomNav'
import HomePage       from './pages/HomePage'
import AppDetailPage  from './pages/AppDetailPage'
import TrendingPage   from './pages/TrendingPage'
import FavoritesPage  from './pages/FavoritesPage'

const tg = window?.Telegram?.WebApp

export default function App() {
  const navigate  = useNavigate()
  const location  = useLocation()
  const { searchQuery } = useStore()

  // Tell Telegram the app is ready → hides the native loading spinner
  useEffect(() => {
    tg?.ready()
    tg?.expand()                    // go full-screen inside Telegram
    tg?.setHeaderColor('#17212B')
    tg?.setBackgroundColor('#17212B')
  }, [])

  // When user types in search, navigate to home so the grid updates
  useEffect(() => {
    if (searchQuery && location.pathname !== '/') {
      navigate('/')
    }
  }, [searchQuery])

  const isDetail = location.pathname.startsWith('/app/')

  return (
    <div className="min-h-screen bg-tg-dark text-tg-text max-w-lg mx-auto">
      {!isDetail && <Header />}
      <main>
        <Routes>
          <Route path="/"        element={<HomePage />} />
          <Route path="/app/:id" element={<AppDetailPage />} />
          <Route path="/search"  element={<HomePage />} />
          <Route path="/trending" element={<TrendingPage />} />
          <Route path="/favorites" element={<FavoritesPage />} />
        </Routes>
      </main>
      {!isDetail && <BottomNav />}
    </div>
  )
}
