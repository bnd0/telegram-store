/**
 * ReviewList.jsx
 *
 * PURPOSE: Displays user reviews for an app on the AppDetail page.
 * Also contains the ReviewForm for logged-in Telegram users to post a review.
 *
 * Props:
 *   appId — the app's numeric ID
 */

import { useState, useEffect } from 'react'
import { fetchReviews, postReview } from '../api'
import { useStore } from '../store'
import StarRating from './StarRating'

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const days = Math.floor(diff / 86_400_000)
  if (days === 0) return 'Today'
  if (days === 1) return 'Yesterday'
  if (days < 30)  return `${days}d ago`
  return new Date(dateStr).toLocaleDateString()
}

export default function ReviewList({ appId }) {
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)
  const [rating,  setRating]  = useState(5)
  const [body,    setBody]    = useState('')
  const [posting, setPosting] = useState(false)
  const [posted,  setPosted]  = useState(false)
  const { tgUser } = useStore()

  useEffect(() => {
    fetchReviews(appId)
      .then(setReviews)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [appId])

  const submitReview = async () => {
    if (!tgUser || posting || posted) return
    setPosting(true)
    try {
      const r = await postReview({
        app_id: appId,
        telegram_user_id: String(tgUser.id),
        username: tgUser.username ?? tgUser.first_name,
        rating,
        body: body.trim() || null,
      })
      setReviews(prev => [r, ...prev])
      setPosted(true)
      setBody('')
    } catch (e) {
      alert(e.response?.data?.detail ?? 'Could not post review')
    } finally {
      setPosting(false)
    }
  }

  return (
    <div>
      <h3 className="text-tg-text font-semibold mb-3">Reviews</h3>

      {/* Write a review */}
      {tgUser && !posted && (
        <div className="bg-tg-panel border border-tg-border rounded-2xl p-3 mb-4">
          <p className="text-sm text-tg-muted mb-2">Your rating</p>
          <div className="flex gap-1 mb-3">
            {[1,2,3,4,5].map(s => (
              <button key={s} onClick={() => setRating(s)} className="text-2xl">
                <span className={s <= rating ? 'star-filled' : 'star-empty'}>★</span>
              </button>
            ))}
          </div>
          <textarea
            value={body}
            onChange={e => setBody(e.target.value)}
            placeholder="Write your review (optional)…"
            rows={2}
            className="w-full bg-tg-dark border border-tg-border rounded-xl px-3 py-2 text-sm text-tg-text placeholder:text-tg-muted focus:outline-none focus:border-tg-blue resize-none mb-2"
          />
          <button
            onClick={submitReview}
            disabled={posting}
            className="w-full bg-tg-blue text-white text-sm font-semibold py-2 rounded-xl hover:bg-blue-400 transition disabled:opacity-50"
          >
            {posting ? 'Posting…' : 'Post Review'}
          </button>
        </div>
      )}

      {/* Review list */}
      {loading && <p className="text-tg-muted text-sm">Loading reviews…</p>}
      {!loading && reviews.length === 0 && (
        <p className="text-tg-muted text-sm">No reviews yet. Be the first!</p>
      )}
      <div className="flex flex-col gap-3">
        {reviews.map(r => (
          <div key={r.id} className="bg-tg-panel border border-tg-border rounded-2xl p-3">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-tg-blue/30 text-tg-blue text-xs flex items-center justify-center font-semibold">
                  {(r.username?.[0] ?? '?').toUpperCase()}
                </div>
                <span className="text-sm font-medium text-tg-text">{r.username ?? 'Anonymous'}</span>
              </div>
              <span className="text-xs text-tg-muted">{timeAgo(r.created_at)}</span>
            </div>
            <StarRating rating={r.rating} />
            {r.body && <p className="text-sm text-tg-muted mt-1">{r.body}</p>}
          </div>
        ))}
      </div>
    </div>
  )
}
