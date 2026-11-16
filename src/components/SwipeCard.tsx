import { forwardRef, useImperativeHandle, useLayoutEffect, useRef, useState } from 'react'
import { animate, motion, useMotionValue, useTransform } from 'framer-motion'
import type { LatLng, Place, Restaurant } from '../types'
import { LEAD_LABEL, leadOf } from '../model/booking'
import { CUISINE_LABEL, VIBE_LABEL } from '../model/features'
import { count, price, walk } from './Bits'
import { kindLabel } from './Gallery'
import { MiniMap } from './MiniMap'
import { ClockIcon, InfoIcon, PinIcon, StarIcon, WalkIcon } from './Icons'

export interface SwipeCardHandle {
  fling: (liked: boolean) => void
}

interface Props {
  restaurant: Restaurant
  distanceKm: number
  /** Where the group stays. The second slide is a map from there. */
  stay: Place
  /** The other places in the deck, drawn faintly on the map slide. */
  others?: LatLng[]
  onDecide: (liked: boolean) => void
  onMore: () => void
}

type Slide = { kind: 'photo'; photo: Restaurant['photos'][number] } | { kind: 'map' }

/** The first photo, then the map, then the other photos. */
function slidesOf(r: Restaurant): Slide[] {
  const [first, ...rest] = r.photos.map((photo): Slide => ({ kind: 'photo', photo }))
  return first ? [first, { kind: 'map' }, ...rest] : [{ kind: 'map' }]
}

/** The facts on the card, also used as its spoken description. */
export function cardSummary(r: Restaurant, distance: number, hotelLabel: string): string {
  const vibes = r.sample.vibes.map((v) => VIBE_LABEL[v]).join(', ')
  const review = r.sample.topReview
  return [
    `${r.displayName}. ${CUISINE_LABEL[r.primaryType]} in ${r.neighbourhood}.`,
    vibes && `${vibes}.`,
    `Price level ${r.priceLevel} of 4. ${walk(distance)} from ${hotelLabel}. Rated ${r.rating} from ${count(r.userRatingCount)} reviews.`,
    `${LEAD_LABEL[leadOf(r)]}.`,
    review && `Sample review, ${review.rating} stars: ${review.text}`,
  ].filter(Boolean).join(' ')
}

function Stars({ rating }: { rating: number }) {
  return (
    <span className="stars" aria-hidden="true">
      {[1, 2, 3, 4, 5].map((i) => <StarIcon key={i} size={11} className={i <= rating ? '' : 'off'} />)}
    </span>
  )
}

export const SwipeCard = forwardRef<SwipeCardHandle, Props>(function SwipeCard(
  { restaurant: r, distanceKm, stay, others = [], onDecide, onMore },
  ref,
) {
  const x = useMotionValue(0)
  const rotate = useTransform(x, [-220, 220], [-10, 10])
  const likeOpacity = useTransform(x, [20, 110], [0, 1])
  const skipOpacity = useTransform(x, [-110, -20], [1, 0])

  const slides = slidesOf(r)
  const [index, setIndex] = useState(0)
  const dragged = useRef(false)
  const decided = useRef(false)
  const shown = slides[index]
  // a tap right after a drag is the end of the drag, not a request for the next slide
  const step = (by: number) => {
    if (dragged.current) return
    setIndex((i) => Math.min(slides.length - 1, Math.max(0, i + by)))
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

  // on the map slide the pins stay above the text at the bottom of the card
  const info = useRef<HTMLDivElement>(null)
  const [inset, setInset] = useState(230)
  useLayoutEffect(() => {
    if (shown.kind === 'map' && info.current) setInset(Math.max(80, info.current.offsetHeight - 30))
  }, [shown.kind])
  // the map slide is about where the place is, so the review gives it room
  const review = shown.kind === 'map' ? undefined : r.sample.topReview

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
      aria-label={cardSummary(r, distanceKm, stay.label)}
    >
      {shown.kind === 'map' ? (
        <MiniMap stay={stay} focus={r.location} others={others} faint bottomInset={inset} credit="topright"
          label={`Map: ${r.displayName}, ${walk(distanceKm)} from ${stay.label}`} />
      ) : (
        <img src={shown.photo.src} draggable={false}
          alt={shown.photo.kind === 'food' ? `${CUISINE_LABEL[r.primaryType]} dish` : 'Dining room of a similar restaurant'} />
      )}
      {slides.length > 1 && (
        <>
          <div className="segments" aria-hidden="true">
            {slides.map((s, i) => <i key={s.kind === 'map' ? 'map' : s.photo.src} className={i === index ? 'on' : ''} />)}
          </div>
          <span className="kind" aria-live="polite">
            {shown.kind === 'map' ? `Map from ${stay.label}` : kindLabel(shown.photo.kind)} · {index + 1} of {slides.length}
          </span>
          <button className="tap prev" aria-label="Previous slide" disabled={index === 0} onClick={() => step(-1)} />
          <button className="tap next" aria-label="Next slide" disabled={index === slides.length - 1} onClick={() => step(1)} />
        </>
      )}
      <motion.span className="stamp like" style={{ opacity: likeOpacity }} aria-hidden="true">LIKE</motion.span>
      <motion.span className="stamp skip" style={{ opacity: skipOpacity }} aria-hidden="true">SKIP</motion.span>
      {/* photo credits are in the details sheet behind the info button */}
      <div className="info" ref={info} aria-hidden="true">
        <div className="cuisine">{CUISINE_LABEL[r.primaryType]}</div>
        <div className="name">{r.displayName}</div>
        {r.sample.vibes.length > 0 && (
          <div className="vibes">{r.sample.vibes.map((v) => <span key={v}>{VIBE_LABEL[v]}</span>)}</div>
        )}
        <div className="facts">
          <span className="fact"><PinIcon size={16} />{r.neighbourhood}</span>
          <span className="fact">{price(r.priceLevel)}<span style={{ opacity: 0.45 }}>{price(4 - r.priceLevel)}</span></span>
          <span className="fact"><WalkIcon size={16} />{walk(distanceKm)}</span>
          <span className="fact"><StarIcon size={15} />{r.rating.toFixed(1)} ({count(r.userRatingCount)})</span>
          <span className="fact booking"><ClockIcon size={15} />{LEAD_LABEL[leadOf(r)]}</span>
        </div>
        {review && (
          <figure className="card-review">
            <blockquote>“{review.text}”</blockquote>
            <figcaption><Stars rating={review.rating} /><span className="sample-tag">Sample review</span></figcaption>
          </figure>
        )}
      </div>
      <button className="more-btn" aria-label={`More about ${r.displayName}`} onClick={() => { if (!dragged.current) onMore() }}>
        <InfoIcon size={24} />
      </button>
    </motion.div>
  )
})
