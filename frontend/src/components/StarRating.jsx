/**
 * StarRating.jsx
 *
 * PURPOSE: Renders 1–5 stars filled/empty based on a numeric rating.
 * Used in AppCard and AppDetail.
 *
 * Props:
 *   rating  — float 0-5
 *   size    — 'sm' | 'md' (default 'sm')
 */

export default function StarRating({ rating, size = 'sm' }) {
  const sz = size === 'md' ? 'text-lg' : 'text-sm'
  return (
    <span className={`inline-flex gap-0.5 ${sz}`} aria-label={`${rating} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map(i => (
        <span key={i} className={i <= Math.round(rating) ? 'star-filled' : 'star-empty'}>
          ★
        </span>
      ))}
    </span>
  )
}
