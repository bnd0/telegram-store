/**
 * App.jsx — Root component.
 *
 * Sets up React Router, initialises the Telegram WebApp SDK,
 * and wraps all pages with the shared Header and BottomNav.
 *
 * /admin is deliberately excluded from Header and BottomNav so the
 * admin panel feels like a separate tool, not part of the public store.
 */

import { useEffect } from 'react'
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom'
import { useStore } from './store'

import Header        from './components/Header'
import BottomNav     from './components/BottomNav'
import HomePage      from './pages/HomePage'
import AppDetailPage from './pages/AppDetailPage'
import TrendingPage  from './pages/TrendingPage'
import FavoritesPage from './pages/FavoritesPage'
import AdminPage     from './pages/AdminPage'

const tg = window?.Telegram?.WebApp

export default function App() {
  const navigate  = useNavigate()
  const location  = useLocation()
  const { searchQuery } = useStore()

  useEffect(() => {
    tg?.ready()
    tg?.expand()
    tg?.setHeaderColor('#17212B')
    tg?.setBackgroundColor('#17212B')
  }, [])

  useEffect(() => {
    if (searchQuery && location.pathname !== '/') navigate('/')
  }, [searchQuery])

  const isDetail = location.pathname.startsWith('/app/')
  const isAdmin  = location.pathname.startsWith('/admin')

  // Admin panel: no shared chrome at all
  if (isAdmin) return (
    <Routes>
      <Route path="/admin" element={<AdminPage />} />
    </Routes>
  )

  return (
    <div className="min-h-screen bg-tg-dark text-tg-text max-w-lg mx-auto">
      {!isDetail && <Header />}
      <main>
        <Routes>
          <Route path="/"          element={<HomePage />} />
          <Route path="/app/:id"   element={<AppDetailPage />} />
          <Route path="/search"    element={<HomePage />} />
          <Route path="/trending"  element={<TrendingPage />} />
          <Route path="/favorites" element={<FavoritesPage />} />
        </Routes>
      </main>
      {!isDetail && <BottomNav />}
    </div>
  )
}
