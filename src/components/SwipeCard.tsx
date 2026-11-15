import { forwardRef, useImperativeHandle } from 'react'
import { animate, motion, useMotionValue, useTransform } from 'framer-motion'
import type { Restaurant } from '../types'
import { CUISINE_LABEL } from '../model/features'
import { count, km, price } from './Bits'
import { PinIcon, StarIcon, WalkIcon } from './Icons'

export interface SwipeCardHandle {
  fling: (liked: boolean) => void
}

interface Props {
  restaurant: Restaurant
  distanceKm: number
  hotelLabel: string
  onDecide: (liked: boolean) => void
}

/** The facts on the card, also used as its spoken description. */
export function cardSummary(r: Restaurant, distance: number, hotelLabel: string): string {
  return `${r.displayName}. ${CUISINE_LABEL[r.primaryType]} in ${r.neighbourhood}. Price level ${r.priceLevel} of 4. ${km(distance)} from ${hotelLabel}. Rated ${r.rating} from ${count(r.userRatingCount)} reviews.`
}

export const SwipeCard = forwardRef<SwipeCardHandle, Props>(function SwipeCard(
  { restaurant: r, distanceKm, hotelLabel, onDecide },
  ref,
) {
  const x = useMotionValue(0)
  const rotate = useTransform(x, [-220, 220], [-10, 10])
  const likeOpacity = useTransform(x, [20, 110], [0, 1])
  const skipOpacity = useTransform(x, [-110, -20], [1, 0])

  const fling = (liked: boolean) => {
    animate(x, liked ? 480 : -480, { duration: 0.22, ease: 'easeOut' }).then(() => onDecide(liked))
  }
  useImperativeHandle(ref, () => ({ fling }))

  return (
    <motion.div
      className="swipe-card"
      style={{ x, rotate }}
      drag="x"
      dragSnapToOrigin
      dragElastic={0.9}
      onDragEnd={(_, info) => {
        if (info.offset.x > 110 || info.velocity.x > 600) fling(true)
        else if (info.offset.x < -110 || info.velocity.x < -600) fling(false)
      }}
      role="group"
      aria-label={cardSummary(r, distanceKm, hotelLabel)}
    >
      <img src={r.photos[0].src} alt={`${CUISINE_LABEL[r.primaryType]} dish`} draggable={false} />
      <motion.span className="stamp like" style={{ opacity: likeOpacity }} aria-hidden="true">LIKE</motion.span>
      <motion.span className="stamp skip" style={{ opacity: skipOpacity }} aria-hidden="true">SKIP</motion.span>
      <div className="info" aria-hidden="true">
        <div className="name">{r.displayName}</div>
        <div className="facts">
          <span className="fact"><PinIcon size={16} />{r.neighbourhood}</span>
          <span className="fact">{price(r.priceLevel)}<span style={{ opacity: 0.45 }}>{price(4 - r.priceLevel)}</span></span>
          <span className="fact"><WalkIcon size={16} />{km(distanceKm)}</span>
          <span className="fact"><StarIcon size={15} />{r.rating.toFixed(1)} ({count(r.userRatingCount)})</span>
        </div>
        <div className="credit">{CUISINE_LABEL[r.primaryType]} · sample photo: {r.photos[0].attribution}</div>
      </div>
    </motion.div>
  )
})
