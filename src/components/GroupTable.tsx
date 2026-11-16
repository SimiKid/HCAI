import type { ReactNode } from 'react'
import { motion } from 'framer-motion'
import type { Member } from '../types'
import type { MatchLevel } from '../model/explain'
import { Avatar } from './Bits'
import { CheckIcon, ForkIcon, HeartIcon, XIcon } from './Icons'

export type Reaction = MatchLevel | 'liked'

interface Props {
  members: Member[]
  /** Outer size in px. Seats sit on the edge, the table in the middle. */
  size: number
  seat?: number
  /** Photo on the plate in the middle of the table. */
  plate?: string
  reactions?: Record<string, Reaction>
  /** Changes when the avatars should pop in again. */
  animateKey?: string
  /** Changes when only the plate should pop in again. */
  plateKey?: string
  /** Makes every seat a button. Used on Ranking to switch a member on or off. */
  onSeat?: (memberId: string) => void
  /** Members shown as left out: greyed, dashed seat and a cross badge. With onSeat, everyone else gets a check badge. */
  off?: string[]
  /** A short name tag under each seat, by member id. */
  tags?: Record<string, string>
  /** Accessible name for a seat button. */
  seatLabel?: (m: Member) => string
  /** Content in the middle of the table instead of a plate. */
  center?: ReactNode
  /** Accessible name of the whole table when seats are buttons. */
  label?: string
}

/** The group seen from above: everyone around one table, the dish in question in the middle. */
export function GroupTable({
  members, size, seat = 32, plate, reactions = {}, animateKey = '', plateKey, onSeat, off = [], tags, seatLabel, center, label,
}: Props) {
  const radius = size / 2 - seat / 2 - 2
  const table = size - seat * 2 + seat * 0.5
  const interactive = !!onSeat
  return (
    <div className={interactive ? 'gtable interactive' : 'gtable'} style={{ width: size, height: size }}
      {...(interactive ? { role: 'group', 'aria-label': label } : { 'aria-hidden': true })}>
      <div className="gtable-cloth" style={{ width: table, height: table }}>
        {center ?? (
          <motion.div className="gtable-plate" key={`plate-${plateKey ?? animateKey}`}
            initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', stiffness: 220, damping: 18 }}>
            {plate ? <img src={plate} alt="" /> : <ForkIcon size={Math.max(16, table * 0.26)} />}
          </motion.div>
        )}
      </div>
      {members.map((m, i) => {
        const angle = (-90 + (360 / members.length) * i) * (Math.PI / 180)
        const x = size / 2 + radius * Math.cos(angle) - seat / 2
        const y = size / 2 + radius * Math.sin(angle) - seat / 2
        const r = reactions[m.id]
        const warm = r === 'liked' || r === 'strong' || r === 'good'
        const isOff = off.includes(m.id)
        const body = (
          <>
            <Avatar member={m} size={seat} />
            {/* a tappable seat always shows its state: a check when the person counts, a cross when left out */}
            {isOff ? (
              <span className="gtable-badge out" style={{ width: seat * 0.5, height: seat * 0.5 }}><XIcon size={seat * 0.3} strokeWidth={2.6} /></span>
            ) : interactive ? (
              <span className="gtable-badge in" style={{ width: seat * 0.5, height: seat * 0.5 }}><CheckIcon size={seat * 0.32} strokeWidth={2.8} /></span>
            ) : r && (
              <span className={warm ? 'gtable-badge warm' : 'gtable-badge'} style={{ width: seat * 0.5, height: seat * 0.5 }}>
                {warm ? <HeartIcon size={seat * 0.32} /> : <span style={{ fontSize: seat * 0.34, lineHeight: 1 }}>{r === 'mixed' ? '~' : '–'}</span>}
              </span>
            )}
            {tags?.[m.id] && <span className="gtable-tag">{tags[m.id]}</span>}
          </>
        )
        return (
          <motion.div key={`${m.id}-${animateKey}-${r ?? ''}`} className={isOff ? 'gtable-seat off' : 'gtable-seat'}
            style={{ left: x, top: y, width: seat, height: seat }}
            initial={{ scale: animateKey || r ? 0.5 : 1 }} animate={{ scale: r === 'liked' ? [0.5, 1.3, 1] : 1 }}
            transition={{ delay: animateKey ? 0.15 + i * 0.08 : 0, type: r === 'liked' ? 'tween' : 'spring', stiffness: 300, damping: 16, duration: 0.45 }}>
            {interactive ? (
              <button type="button" className="gtable-seat-btn" aria-pressed={!isOff} aria-label={seatLabel?.(m) ?? m.name}
                onClick={() => onSeat(m.id)}>
                {body}
              </button>
            ) : body}
          </motion.div>
        )
      })}
    </div>
  )
}
