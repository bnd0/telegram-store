/**
 * pages/AdminPage.jsx
 *
 * PURPOSE: Password-gated admin panel for managing store apps.
 *
 * Sections:
 *   1. Login screen  — enter the ADMIN_SECRET_KEY; stored in sessionStorage
 *   2. App table     — lists all apps with edit + delete buttons
 *   3. App form      — slide-in drawer for create or edit
 *
 * The admin key is sent as the X-Admin-Key header on every mutating request.
 * It never leaves the browser except to your own backend.
 *
 * Access at: /admin
 * Keep this URL private — share it only with people who manage the store.
 */

import { useState, useEffect, useCallback } from 'react'
import { fetchApps, fetchCategories, adminCreateApp, adminUpdateApp, adminDeleteApp } from '../api'

// ── Helpers ───────────────────────────────────────────────────────────────────
const SESSION_KEY = 'tgstore_admin_key'

function slugify(str) {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
}

const EMPTY_FORM = {
  name: '', slug: '', description: '', icon_url: '', banner_url: '',
  telegram_url: '', developer: '', category_id: '', is_featured: false, is_verified: false,
}

// ── Sub-components ────────────────────────────────────────────────────────────

function LoginScreen({ onLogin }) {
  const [key, setKey] = useState('')
  const [err, setErr] = useState('')

  const submit = () => {
    if (!key.trim()) { setErr('Enter your admin key'); return }
    sessionStorage.setItem(SESSION_KEY, key.trim())
    onLogin(key.trim())
  }

  return (
    <div className="min-h-screen bg-tg-dark flex items-center justify-center px-6">
      <div className="w-full max-w-sm bg-tg-panel border border-tg-border rounded-3xl p-8">
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">🔐</div>
          <h1 className="text-xl font-bold text-tg-text">Admin Panel</h1>
          <p className="text-tg-muted text-sm mt-1">TG App Store</p>
        </div>

        <label className="block text-xs font-medium text-tg-muted mb-1.5 uppercase tracking-wide">
          Admin Secret Key
        </label>
        <input
          type="password"
          value={key}
          onChange={e => { setKey(e.target.value); setErr('') }}
          onKeyDown={e => e.key === 'Enter' && submit()}
          placeholder="Paste your ADMIN_SECRET_KEY…"
          className="w-full bg-tg-dark border border-tg-border rounded-xl px-4 py-3 text-tg-text text-sm placeholder:text-tg-muted focus:outline-none focus:border-tg-blue mb-2"
          autoFocus
        />
        {err && <p className="text-red-400 text-xs mb-2">{err}</p>}

        <button
          onClick={submit}
          className="w-full bg-tg-blue text-white font-semibold py-3 rounded-xl hover:bg-blue-400 transition mt-2"
        >
          Sign In
        </button>
      </div>
    </div>
  )
}


function AppForm({ form, setForm, categories, onSubmit, onClose, isEditing, loading, error }) {
  const handleNameChange = (e) => {
    const name = e.target.value
    setForm(f => ({ ...f, name, slug: isEditing ? f.slug : slugify(name) }))
  }

  const fields = [
    { key: 'name',         label: 'App Name',         type: 'text',  required: true,  onChange: handleNameChange },
    { key: 'slug',         label: 'Slug',              type: 'text',  required: true,  hint: 'lowercase-with-dashes' },
    { key: 'telegram_url', label: 'Telegram URL',      type: 'url',   required: true,  hint: 'https://t.me/yourbot/app' },
    { key: 'developer',    label: 'Developer',         type: 'text',  required: true  },
    { key: 'icon_url',     label: 'Icon URL',          type: 'url',   required: true,  hint: '512×512 image URL' },
    { key: 'banner_url',   label: 'Banner URL',        type: 'url',   required: false, hint: '800×300 image URL (optional)' },
  ]

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Drawer */}
      <div className="relative z-10 w-full max-w-lg bg-tg-panel border border-tg-border rounded-t-3xl sm:rounded-3xl max-h-[92vh] overflow-y-auto">
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1 sm:hidden">
          <div className="w-10 h-1 bg-tg-border rounded-full" />
        </div>

        <div className="px-6 pb-6 pt-4">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-tg-text">
              {isEditing ? '✏️ Edit App' : '➕ Add New App'}
            </h2>
            <button onClick={onClose} className="text-tg-muted hover:text-tg-text text-xl w-8 h-8 flex items-center justify-center rounded-full hover:bg-tg-dark transition">
              ✕
            </button>
          </div>

          {/* Icon preview */}
          {form.icon_url && (
            <div className="flex items-center gap-3 mb-5 p-3 bg-tg-dark rounded-2xl border border-tg-border">
              <img src={form.icon_url} alt="preview" className="w-14 h-14 rounded-2xl object-cover" onError={e => e.target.style.display='none'} />
              <div>
                <p className="text-sm font-semibold text-tg-text">{form.name || 'App Name'}</p>
                <p className="text-xs text-tg-muted">{form.developer || 'Developer'}</p>
              </div>
            </div>
          )}

          <div className="space-y-4">
            {/* Text fields */}
            {fields.map(f => (
              <div key={f.key}>
                <label className="block text-xs font-medium text-tg-muted mb-1 uppercase tracking-wide">
                  {f.label} {f.required && <span className="text-red-400">*</span>}
                </label>
                <input
                  type={f.type}
                  value={form[f.key]}
                  onChange={f.onChange ?? (e => setForm(prev => ({ ...prev, [f.key]: e.target.value })))}
                  placeholder={f.hint ?? ''}
                  className="w-full bg-tg-dark border border-tg-border rounded-xl px-3 py-2.5 text-sm text-tg-text placeholder:text-tg-muted focus:outline-none focus:border-tg-blue transition"
                />
              </div>
            ))}

            {/* Description */}
            <div>
              <label className="block text-xs font-medium text-tg-muted mb-1 uppercase tracking-wide">
                Description <span className="text-red-400">*</span>
              </label>
              <textarea
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                placeholder="Describe what this app does…"
                rows={3}
                className="w-full bg-tg-dark border border-tg-border rounded-xl px-3 py-2.5 text-sm text-tg-text placeholder:text-tg-muted focus:outline-none focus:border-tg-blue resize-none transition"
              />
            </div>

            {/* Category */}
            <div>
              <label className="block text-xs font-medium text-tg-muted mb-1 uppercase tracking-wide">
                Category <span className="text-red-400">*</span>
              </label>
              <select
                value={form.category_id}
                onChange={e => setForm(f => ({ ...f, category_id: Number(e.target.value) }))}
                className="w-full bg-tg-dark border border-tg-border rounded-xl px-3 py-2.5 text-sm text-tg-text focus:outline-none focus:border-tg-blue transition"
              >
                <option value="">Select a category…</option>
                {categories.map(c => (
                  <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
                ))}
              </select>
            </div>

            {/* Toggles */}
            <div className="flex gap-3">
              {[
                { key: 'is_featured', label: '⭐ Featured', hint: 'Show in hero banner' },
                { key: 'is_verified', label: '✓ Verified',  hint: 'Show verified badge' },
              ].map(t => (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => setForm(f => ({ ...f, [t.key]: !f[t.key] }))}
                  className={`flex-1 flex flex-col items-center gap-1 py-3 rounded-2xl border transition text-sm font-medium ${
                    form[t.key]
                      ? 'bg-tg-blue/20 border-tg-blue text-tg-blue'
                      : 'bg-tg-dark border-tg-border text-tg-muted'
                  }`}
                >
                  <span>{t.label}</span>
                  <span className="text-xs font-normal opacity-70">{t.hint}</span>
                </button>
              ))}
            </div>
          </div>

          {error && (
            <div className="mt-4 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">
              {error}
            </div>
          )}

          <button
            onClick={onSubmit}
            disabled={loading}
            className="w-full mt-6 bg-tg-blue text-white font-semibold py-3 rounded-2xl hover:bg-blue-400 active:scale-95 transition-all disabled:opacity-50"
          >
            {loading ? 'Saving…' : isEditing ? 'Save Changes' : 'Add App'}
          </button>
        </div>
      </div>
    </div>
  )
}


function StatBadge({ label, value, color = 'text-tg-text' }) {
  return (
    <div className="bg-tg-dark border border-tg-border rounded-2xl px-4 py-3 text-center">
      <p className={`text-xl font-bold ${color}`}>{value}</p>
      <p className="text-xs text-tg-muted">{label}</p>
    </div>
  )
}


// ── Main AdminPage ─────────────────────────────────────────────────────────────
export default function AdminPage() {
  const [adminKey, setAdminKey]     = useState(() => sessionStorage.getItem(SESSION_KEY) ?? '')
  const [apps, setApps]             = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading]       = useState(false)
  const [formOpen, setFormOpen]     = useState(false)
  const [editingApp, setEditingApp] = useState(null)   // null = create mode
  const [form, setForm]             = useState(EMPTY_FORM)
  const [formError, setFormError]   = useState('')
  const [formLoading, setFormLoading] = useState(false)
  const [search, setSearch]         = useState('')
  const [deleteConfirm, setDeleteConfirm] = useState(null)   // app id to confirm
  const [toast, setToast]           = useState('')

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3000) }

  // Load all apps (admin view: page_size 100)
  const loadApps = useCallback(async () => {
    if (!adminKey) return
    setLoading(true)
    try {
      const data = await fetchApps({ page: 1, page_size: 100 })
      setApps(data.items)
    } catch { /* handled below */ }
    finally { setLoading(false) }
  }, [adminKey])

  useEffect(() => {
    if (adminKey) {
      loadApps()
      fetchCategories().then(setCategories).catch(console.error)
    }
  }, [adminKey, loadApps])

  // ── Form open/close ──────────────────────────────────────────────────────────
  const openCreate = () => {
    setEditingApp(null)
    setForm(EMPTY_FORM)
    setFormError('')
    setFormOpen(true)
  }

  const openEdit = (app) => {
    setEditingApp(app)
    setForm({
      name:         app.name,
      slug:         app.slug,
      description:  app.description,
      icon_url:     app.icon_url,
      banner_url:   app.banner_url ?? '',
      telegram_url: app.telegram_url,
      developer:    app.developer,
      category_id:  app.category.id,
      is_featured:  app.is_featured,
      is_verified:  app.is_verified,
    })
    setFormError('')
    setFormOpen(true)
  }

  // ── Submit ───────────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    setFormError('')

    // Basic client-side validation
    const required = ['name', 'slug', 'description', 'icon_url', 'telegram_url', 'developer', 'category_id']
    for (const f of required) {
      if (!form[f]) { setFormError(`"${f}" is required.`); return }
    }

    setFormLoading(true)
    try {
      const payload = {
        ...form,
        banner_url: form.banner_url || null,
        category_id: Number(form.category_id),
      }

      if (editingApp) {
        const updated = await adminUpdateApp(editingApp.id, payload, adminKey)
        setApps(prev => prev.map(a => a.id === updated.id ? updated : a))
        showToast(`✅ "${updated.name}" updated`)
      } else {
        const created = await adminCreateApp(payload, adminKey)
        setApps(prev => [created, ...prev])
        showToast(`✅ "${created.name}" added`)
      }
      setFormOpen(false)
    } catch (e) {
      const detail = e.response?.data?.detail
      if (Array.isArray(detail)) {
        setFormError(detail.map(d => d.msg).join(', '))
      } else {
        setFormError(detail ?? 'Something went wrong. Check your admin key and try again.')
      }
    } finally {
      setFormLoading(false)
    }
  }

  // ── Delete ───────────────────────────────────────────────────────────────────
  const handleDelete = async (id) => {
    try {
      await adminDeleteApp(id, adminKey)
      setApps(prev => prev.filter(a => a.id !== id))
      setDeleteConfirm(null)
      showToast('🗑️ App deleted')
    } catch (e) {
      alert(e.response?.data?.detail ?? 'Delete failed')
    }
  }

  // ── Gate ─────────────────────────────────────────────────────────────────────
  if (!adminKey) return <LoginScreen onLogin={setAdminKey} />

  const filtered = apps.filter(a =>
    a.name.toLowerCase().includes(search.toLowerCase()) ||
    a.developer.toLowerCase().includes(search.toLowerCase())
  )

  const featured = apps.filter(a => a.is_featured).length
  const verified = apps.filter(a => a.is_verified).length

  return (
    <div className="min-h-screen bg-tg-dark pb-10">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-tg-dark/95 backdrop-blur border-b border-tg-border px-4 py-3">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h1 className="text-tg-text font-bold text-lg">⚙️ Admin Panel</h1>
            <p className="text-tg-muted text-xs">{apps.length} apps in store</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => { sessionStorage.removeItem(SESSION_KEY); setAdminKey('') }}
              className="text-xs text-tg-muted border border-tg-border px-3 py-1.5 rounded-xl hover:border-red-400 hover:text-red-400 transition"
            >
              Sign out
            </button>
            <button
              onClick={openCreate}
              className="bg-tg-blue text-white text-sm font-semibold px-4 py-1.5 rounded-xl hover:bg-blue-400 transition flex items-center gap-1"
            >
              <span>＋</span> Add App
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-tg-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Filter by name or developer…"
            className="w-full bg-tg-panel border border-tg-border rounded-xl pl-9 pr-4 py-2 text-sm text-tg-text placeholder:text-tg-muted focus:outline-none focus:border-tg-blue transition"
          />
        </div>
      </div>

      <div className="px-4 pt-4 space-y-4">
        {/* Stats row */}
        <div className="grid grid-cols-3 gap-2">
          <StatBadge label="Total Apps"  value={apps.length} color="text-tg-blue" />
          <StatBadge label="Featured"    value={featured}    color="text-yellow-400" />
          <StatBadge label="Verified"    value={verified}    color="text-green-400" />
        </div>

        {/* App list */}
        {loading ? (
          <div className="space-y-2">
            {[1,2,3,4,5].map(i => <div key={i} className="h-20 bg-tg-panel rounded-2xl animate-pulse" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-tg-muted">
            <div className="text-4xl mb-2">🔍</div>
            <p>{search ? 'No apps match your search.' : 'No apps yet — add one!'}</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map(app => (
              <div key={app.id} className="bg-tg-panel border border-tg-border rounded-2xl p-3 flex items-center gap-3">
                {/* Icon */}
                <img
                  src={app.icon_url} alt={app.name}
                  className="w-12 h-12 rounded-xl object-cover shrink-0 bg-tg-dark"
                  onError={e => { e.target.style.display='none' }}
                />

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-sm font-semibold text-tg-text truncate">{app.name}</span>
                    {app.is_featured && <span className="text-[10px] bg-yellow-500/20 text-yellow-400 px-1.5 py-0.5 rounded-full shrink-0">Featured</span>}
                    {app.is_verified && <span className="text-[10px] bg-green-500/20 text-green-400 px-1.5 py-0.5 rounded-full shrink-0">Verified</span>}
                  </div>
                  <p className="text-xs text-tg-muted truncate">{app.developer} · {app.category?.icon} {app.category?.name}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-yellow-400">★ {app.rating.toFixed(1)}</span>
                    <span className="text-xs text-tg-muted">{app.installs.toLocaleString()} installs</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-1.5 shrink-0">
                  <button
                    onClick={() => openEdit(app)}
                    className="text-xs bg-tg-dark border border-tg-border text-tg-muted px-3 py-1.5 rounded-lg hover:border-tg-blue hover:text-tg-blue transition"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => setDeleteConfirm(app.id)}
                    className="text-xs bg-tg-dark border border-tg-border text-tg-muted px-3 py-1.5 rounded-lg hover:border-red-400 hover:text-red-400 transition"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create / Edit form drawer */}
      {formOpen && (
        <AppForm
          form={form}
          setForm={setForm}
          categories={categories}
          onSubmit={handleSubmit}
          onClose={() => setFormOpen(false)}
          isEditing={!!editingApp}
          loading={formLoading}
          error={formError}
        />
      )}

      {/* Delete confirmation modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-6">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setDeleteConfirm(null)} />
          <div className="relative bg-tg-panel border border-tg-border rounded-3xl p-6 w-full max-w-sm text-center">
            <div className="text-4xl mb-3">🗑️</div>
            <h3 className="text-tg-text font-bold mb-1">Delete this app?</h3>
            <p className="text-tg-muted text-sm mb-6">This will permanently remove it from the store along with all its reviews and favorites. This cannot be undone.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirm(null)} className="flex-1 py-2.5 rounded-xl border border-tg-border text-tg-muted hover:text-tg-text transition text-sm font-medium">
                Cancel
              </button>
              <button onClick={() => handleDelete(deleteConfirm)} className="flex-1 py-2.5 rounded-xl bg-red-500 text-white hover:bg-red-400 transition text-sm font-semibold">
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast notification */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-tg-panel border border-tg-border text-tg-text text-sm font-medium px-5 py-3 rounded-2xl shadow-xl animate-pulse">
          {toast}
        </div>
      )}
    </div>
  )
}
