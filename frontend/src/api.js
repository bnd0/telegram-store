/**
 * api.js — Axios instance pointing to the FastAPI backend.
 *
 * In development Vite proxies /api → http://localhost:8000
 * In production set VITE_API_BASE to your deployed backend URL.
 */

import axios from 'axios'

const BASE = import.meta.env.VITE_API_BASE ?? '/api/v1'

const api = axios.create({
  baseURL: BASE,
  timeout: 10_000,
  headers: { 'Content-Type': 'application/json' },
})

// ── Apps ──────────────────────────────────────────────────────────────────────
export const fetchApps = (params = {}) =>
  api.get('/apps', { params }).then(r => r.data)

export const fetchFeatured = () =>
  api.get('/apps/featured').then(r => r.data)

export const fetchApp = (id) =>
  api.get(`/apps/${id}`).then(r => r.data)

export const recordLaunch = (id) =>
  api.post(`/apps/${id}/launch`).then(r => r.data)

export const createApp = (payload) =>
  api.post('/apps', payload).then(r => r.data)

// ── Categories ────────────────────────────────────────────────────────────────
export const fetchCategories = () =>
  api.get('/categories').then(r => r.data)

// ── Reviews ───────────────────────────────────────────────────────────────────
export const fetchReviews = (appId) =>
  api.get(`/reviews/${appId}`).then(r => r.data)

export const postReview = (payload) =>
  api.post('/reviews', payload).then(r => r.data)

// ── Favorites ─────────────────────────────────────────────────────────────────
export const fetchFavorites = (telegramUserId) =>
  api.get('/favorites', { params: { telegram_user_id: telegramUserId } }).then(r => r.data)

export const toggleFavorite = (appId, telegramUserId) =>
  api.post('/favorites/toggle', { app_id: appId, telegram_user_id: telegramUserId }).then(r => r.data)
