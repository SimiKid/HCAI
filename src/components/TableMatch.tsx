import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import type { Member, Restaurant } from '../types'
import type { TableMatch } from '../model/match'
import { listNames } from './Bits'
import { GroupTable, type Reaction } from './GroupTable'

/** Taps in the first moments are ignored: they are meant for the Like button that was just there. */
const ARM_AFTER_MS = 600

interface Props {
  restaurant: Restaurant
  /** The member who just liked the place. */
  viewer: Member
  members: Member[]
  match: TableMatch
  onClose: () => void
  onRanking: () => void
}

/** Full-screen moment after a like: several people at the table want the same place. */
export function TableMatchOverlay({ restaurant: r, viewer, members, match, onClose, onRanking }: Props) {
  const keepRef = useRef<HTMLButtonElement>(null)
  const [armed, setArmed] = useState(false)
  useEffect(() => {
    keepRef.current?.focus()
    const timer = setTimeout(() => setArmed(true), ARM_AFTER_MS)
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => {
      clearTimeout(timer)
      window.removeEventListener('keydown', onKey)
    }
  }, [onClose])

  const everyone = match.unseen.length === 0
  const reactions = Object.fromEntries([viewer, ...match.fans].map((m) => [m.id, 'liked' as Reaction]))
  const fans = listNames([viewer.id === 'me' ? 'You' : viewer.name, ...match.fans.map((m) => m.name)])
  const waiting = listNames(match.unseen.map((m) => m.name))

  return (
    <motion.div className="match-overlay" role="dialog" aria-modal="true" aria-labelledby="match-h"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
      <div className="welcome-rings" aria-hidden="true" />
      <div className="match-body">
        <GroupTable members={members} size={264} seat={56} plate={r.photos[0].src} reactions={reactions} animateKey={r.id} />
        <p className="welcome-brand">Table match</p>
        <h2 className="match-title" id="match-h">{everyone ? 'The whole table is in' : `${match.fans.length + 1} of ${members.length} like this`}</h2>
        <p>
          {fans} all like <span className="strong">{r.displayName}</span>, and nobody skipped it.
          {!everyone && ` ${waiting} ${match.unseen.length === 1 ? 'has' : 'have'} not seen it yet.`}
        </p>
      </div>
      {/* "Keep swiping" sits at the bottom, near where Like was, so a quick second tap never leaves the deck */}
      <div className="match-actions">
        <button ref={keepRef} className="btn on-crimson" onClick={() => armed && onClose()}>Keep swiping</button>
        <button className="link on-crimson" onClick={() => armed && onRanking()}>See the group ranking</button>
      </div>
    </motion.div>
  )
}
