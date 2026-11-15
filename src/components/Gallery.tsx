import { useState } from 'react'
import type { Restaurant } from '../types'
import { CUISINE_LABEL } from '../model/features'

// the label says what the photo is: a typical dish or a similar room, not this restaurant itself
export const kindLabel = (kind: 'food' | 'inside') => (kind === 'food' ? 'Typical dish' : 'Similar dining room')

/** All photos of a place, side by side. Swipe or scroll sideways. */
export function Gallery({ restaurant: r }: { restaurant: Restaurant }) {
  return (
    <div className="gallery" role="group" aria-label={`${r.photos.length} photos`} tabIndex={0}>
      {r.photos.map((p) => (
        <figure key={p.src}>
          <img src={p.src} loading="lazy"
            alt={p.kind === 'food' ? `${CUISINE_LABEL[r.primaryType]} dish` : 'Dining room of a similar restaurant'} />
          <figcaption>{kindLabel(p.kind)}</figcaption>
        </figure>
      ))}
    </div>
  )
}

/**
 * The words "sample data" stay visible in every sheet. The photo credits and
 * where to read the full note open on a tap.
 */
export function DataNote({ restaurant: r }: { restaurant: Restaurant }) {
  const [open, setOpen] = useState(false)
  return (
    <div>
      <button type="button" className="link quiet" aria-expanded={open} onClick={() => setOpen(!open)}>
        Sample data and photo credits
      </button>
      {open && (
        <p className="tiny muted">
          Ratings, table times and other values are samples, and the photos are typical ones. The full note is in Group, “About this data”.
          Photo credits: {r.photos.map((p) => p.attribution).join('; ')}.
        </p>
      )}
    </div>
  )
}
