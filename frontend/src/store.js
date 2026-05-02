/**
 * store.js — Zustand global state.
 *
 * Holds:
 *   tgUser      — user info from window.Telegram.WebApp (null in browser)
 *   favIds      — Set of app IDs the user has favorited
 *   activeCategory — currently selected category slug
 *
 * Kept small on purpose: per-page data stays local with useState/useEffect.
 */

import { create } from 'zustand'

const tg = window?.Telegram?.WebApp

export const useStore = create((set, get) => ({
  // Telegram SDK
  tgUser: tg?.initDataUnsafe?.user ?? null,
  tgReady: !!tg,

  // Favorites (synced to server; here we mirror IDs for instant UI feedback)
  favIds: new Set(),
  setFavIds: (ids) => set({ favIds: new Set(ids) }),
  toggleFavId: (id) => {
    const next = new Set(get().favIds)
    next.has(id) ? next.delete(id) : next.add(id)
    set({ favIds: next })
  },

  // Category filter (used across Home + Search pages)
  activeCategory: 'all',
  setActiveCategory: (slug) => set({ activeCategory: slug }),

  // Search query
  searchQuery: '',
  setSearchQuery: (q) => set({ searchQuery: q }),
}))
