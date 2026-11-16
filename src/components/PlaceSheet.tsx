import { useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import type { Restaurant } from '../types'
import { CUISINE_LABEL } from '../model/features'
import { BOOKING_MODES, bookingStatus } from '../model/booking'
import { useBooking } from '../store'
import { count, km, price } from './Bits'
import { DataNote, Gallery } from './Gallery'
import { BookingLine } from './RankRow'
import { HeartIcon, StarIcon, XIcon } from './Icons'

const cap = (s: string) => s[0].toUpperCase() + s.slice(1)

interface Props {
  restaurant: Restaurant
  distanceKm: number
  hotelLabel: string
  party: number
  onClose: () => void
  onDecide: (liked: boolean) => void
}

/** A closer look at one place from the swipe deck, before deciding. */
export function PlaceSheet({ restaurant: r, distanceKm, hotelLabel, party, onClose, onDecide }: Props) {
  const closeRef = useRef<HTMLButtonElement>(null)
  const booking = useBooking()
  const table = bookingStatus(r, booking.when, party, booking.night)
  const modeLabel = BOOKING_MODES.find((m) => m.value === booking.when)?.label ?? ''
  useEffect(() => {
    closeRef.current?.focus()
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])
  return (
    <>
      <motion.div className="backdrop" onClick={onClose} initial={{ opacity: 0 }} animate={{ opacity: 1 }} />
      <motion.div className="sheet" role="dialog" aria-modal="true" aria-label={r.displayName}
        initial={{ y: '100%' }} animate={{ y: 0 }} transition={{ type: 'tween', duration: 0.25, ease: 'easeOut' }}>
        <div className="sheet-top">
          <button ref={closeRef} className="icon-btn" onClick={onClose} aria-label="Close"><XIcon size={20} /></button>
        </div>
        <div className="stack">
          <Gallery restaurant={r} />
          <div className="stack" style={{ gap: 4 }}>
            <h2 className="title" style={{ fontSize: '1.5rem' }}>{r.displayName}</h2>
            <div className="meta">
              <span>{CUISINE_LABEL[r.primaryType]}</span>
              <span>{price(r.priceLevel)}</span>
              <span className="fact"><StarIcon size={13} />{r.rating.toFixed(1)} ({count(r.userRatingCount)} reviews)</span>
              <span>{km(distanceKm)} from {hotelLabel}</span>
            </div>
            <p className="small muted">{r.formattedAddress}</p>
          </div>
          <div className="stack" style={{ gap: 8 }}>
            <p className="label">The vibe</p>
            <div className="chips">{r.sample.vibes.map((v) => <span key={v} className="chip static lav">{cap(v)}</span>)}</div>
          </div>
          <div className="stack" style={{ gap: 8 }}>
            <p className="label">Works for</p>
            <div className="chips">
              {r.sample.dietOptions.length
                ? r.sample.dietOptions.map((d) => <span key={d} className="chip static">{cap(d)}</span>)
                : <span className="small muted">No special diets listed</span>}
            </div>
            {r.sample.allergens.length > 0 && <p className="small muted">Hard to avoid here: {r.sample.allergens.join(', ')}.</p>}
          </div>
          <div className="stack" style={{ gap: 4 }}>
            <p className="label">Table for {party} · {modeLabel}{booking.nightLabel && `, ${booking.nightLabel}`}</p>
            <BookingLine status={table} />
          </div>
          <div className="row">
            <button className="btn" onClick={() => onDecide(false)}><XIcon size={20} />Skip</button>
            <button className="btn primary" onClick={() => onDecide(true)}><HeartIcon size={20} />Like</button>
          </div>
          <DataNote restaurant={r} />
        </div>
      </motion.div>
    </>
  )
}
