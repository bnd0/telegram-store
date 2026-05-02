/**
 * CategoryTabs.jsx
 *
 * PURPOSE: Horizontal scrollable row of category pills.
 * Fetches categories from the API once and keeps them in local state.
 * Tapping a pill sets activeCategory in the Zustand store so the
 * app grid on HomePage re-fetches with the new filter.
 */

import { useState, useEffect } from 'react'
import { fetchCategories } from '../api'
import { useStore } from '../store'

export default function CategoryTabs() {
  const [categories, setCategories] = useState([])
  const { activeCategory, setActiveCategory } = useStore()

  useEffect(() => {
    fetchCategories().then(setCategories).catch(console.error)
  }, [])

  const all = [{ slug: 'all', name: 'All', icon: '🏠' }, ...categories]

  return (
    <div className="overflow-x-auto hide-scrollbar px-4 py-2 flex gap-2">
      {all.map(cat => {
        const active = cat.slug === activeCategory
        return (
          <button
            key={cat.slug}
            onClick={() => setActiveCategory(cat.slug)}
            className={`flex items-center gap-1.5 shrink-0 px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
              active
                ? 'bg-tg-blue text-white'
                : 'bg-tg-panel text-tg-muted border border-tg-border hover:border-tg-blue hover:text-tg-text'
            }`}
          >
            <span className="text-base leading-none">{cat.icon}</span>
            <span>{cat.name}</span>
          </button>
        )
      })}
    </div>
  )
}
