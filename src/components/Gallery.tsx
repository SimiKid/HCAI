import type { Restaurant } from '../types'
import { CUISINE_LABEL } from '../model/features'

export const kindLabel = (kind: 'food' | 'inside') => (kind === 'food' ? 'Food' : 'Look and feel')

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
