import { forwardRef, useImperativeHandle, useRef, useState } from 'react'
import { animate, motion, useMotionValue, useTransform } from 'framer-motion'
import type { Restaurant } from '../types'
import { CUISINE_LABEL } from '../model/features'
import { count, price, walk } from './Bits'
import { kindLabel } from './Gallery'
import { InfoIcon, PinIcon, StarIcon, WalkIcon } from './Icons'

export interface SwipeCardHandle {
  fling: (liked: boolean) => void
}

interface Props {
  restaurant: Restaurant
  distanceKm: number
  hotelLabel: string
  onDecide: (liked: boolean) => void
  onMore: () => void
}

/** The facts on the card, also used as its spoken description. */
export function cardSummary(r: Restaurant, distance: number, hotelLabel: string): string {
  return `${r.displayName}. ${CUISINE_LABEL[r.primaryType]} in ${r.neighbourhood}. Price level ${r.priceLevel} of 4. ${walk(distance)} from ${hotelLabel}. Rated ${r.rating} from ${count(r.userRatingCount)} reviews.`
}

export const SwipeCard = forwardRef<SwipeCardHandle, Props>(function SwipeCard(
  { restaurant: r, distanceKm, hotelLabel, onDecide, onMore },
  ref,
) {
  const x = useMotionValue(0)
  const rotate = useTransform(x, [-220, 220], [-10, 10])
  const likeOpacity = useTransform(x, [20, 110], [0, 1])
  const skipOpacity = useTransform(x, [-110, -20], [1, 0])

  const [photo, setPhoto] = useState(0)
  const dragged = useRef(false)
  const decided = useRef(false)
  const shown = r.photos[photo]
  // a tap right after a drag is the end of the drag, not a request for the next photo
  const step = (by: number) => {
    if (dragged.current) return
    setPhoto((i) => Math.min(r.photos.length - 1, Math.max(0, i + by)))
  }

  const fling = (liked: boolean) => {
    // decide exactly once, even if the browser pauses the animation (background tab, reduced motion)
    if (decided.current) return
    decided.current = true
    let done = false
    const finish = () => { if (!done) { done = true; onDecide(liked) } }
    animate(x, liked ? 480 : -480, { duration: 0.22, ease: 'easeOut' }).then(finish)
    setTimeout(finish, 450)
  }
  useImperativeHandle(ref, () => ({ fling }))

  return (
    <motion.div
      className="swipe-card"
      style={{ x, rotate }}
      drag="x"
      dragSnapToOrigin
      dragElastic={0.9}
      onDragStart={() => { dragged.current = true }}
      onDragEnd={(_, info) => {
        setTimeout(() => { dragged.current = false }, 50)
        if (info.offset.x > 110 || info.velocity.x > 600) fling(true)
        else if (info.offset.x < -110 || info.velocity.x < -600) fling(false)
      }}
      role="group"
      aria-label={cardSummary(r, distanceKm, hotelLabel)}
    >
      <img src={shown.src} draggable={false}
        alt={shown.kind === 'food' ? `${CUISINE_LABEL[r.primaryType]} dish` : 'Dining room of a similar restaurant'} />
      {r.photos.length > 1 && (
        <>
          <div className="segments" aria-hidden="true">
            {r.photos.map((p, i) => <i key={p.src} className={i === photo ? 'on' : ''} />)}
          </div>
          <span className="kind" aria-live="polite">{kindLabel(shown.kind)} · {photo + 1} of {r.photos.length}</span>
          <button className="tap prev" aria-label="Previous photo" disabled={photo === 0} onClick={() => step(-1)} />
          <button className="tap next" aria-label="Next photo" disabled={photo === r.photos.length - 1} onClick={() => step(1)} />
        </>
      )}
      <motion.span className="stamp like" style={{ opacity: likeOpacity }} aria-hidden="true">LIKE</motion.span>
      <motion.span className="stamp skip" style={{ opacity: skipOpacity }} aria-hidden="true">SKIP</motion.span>
      {/* photo credits are in the details sheet behind the info button */}
      <div className="info" aria-hidden="true">
        <div className="cuisine">{CUISINE_LABEL[r.primaryType]}</div>
        <div className="name">{r.displayName}</div>
        <div className="facts">
          <span className="fact"><PinIcon size={16} />{r.neighbourhood}</span>
          <span className="fact">{price(r.priceLevel)}<span style={{ opacity: 0.45 }}>{price(4 - r.priceLevel)}</span></span>
          <span className="fact"><WalkIcon size={16} />{walk(distanceKm)}</span>
          <span className="fact"><StarIcon size={15} />{r.rating.toFixed(1)} ({count(r.userRatingCount)})</span>
        </div>
      </div>
      <button className="more-btn" aria-label={`More about ${r.displayName}`} onClick={() => { if (!dragged.current) onMore() }}>
        <InfoIcon size={24} />
      </button>
    </motion.div>
  )
})
