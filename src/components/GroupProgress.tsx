import { useState } from 'react'
import type { Features, Member } from '../types'
import { useStore } from '../store'
import { moreSwipes } from '../data/members'
import { confidence } from '../model/learn'
import { Avatar, Fold, swipes } from './Bits'

/** How many places a simulated friend swipes after a nudge. */
const NUDGE_SWIPES = 12

interface Props {
  members: Member[]
  features: Record<string, Features>
  /** The member who uses the app right now. */
  actorId: string
  /** How many places a member can still swipe. */
  left: (m: Member) => number
  onSwipeMore: () => void
  /** Open from the start, for when the list of people is the next thing to do. */
  defaultOpen?: boolean
}

/** Who the app has a clear picture of, in one line. A tap shows who is left and a way to get them to swipe more. */
export function GroupProgress({ members, features, actorId, left, onSwipeMore, defaultOpen }: Props) {
  const { set, restaurants } = useStore()
  const [status, setStatus] = useState('')
  const [nudged, setNudged] = useState<string[]>([])
  // someone who has seen every place they can eat at is done, however few places that was
  const open = members.filter((m) => confidence(m.swipes.length).level !== 'high' && left(m) > 0)

  if (open.length === 0)
    return <p className="tiny muted" style={{ textAlign: 'center' }} role="status">{status || `The app has a clear picture of all ${members.length} people.`}</p>

  const nudge = (m: Member) => {
    setNudged((list) => [...list, m.id])
    setStatus(`Nudge sent to ${m.name}.`)
    // prototype: there is no backend, so the simulated friend answers after a moment and swipes more places
    setTimeout(() => {
      const seen = m.swipes.map((s) => s.restaurantId)
      const more = moreSwipes(m.id, restaurants, features, seen, NUDGE_SWIPES)
      set((s) => ({ swipes: { ...s.swipes, [m.id]: [...(s.swipes[m.id] ?? []), ...more] } }))
      setNudged((list) => list.filter((id) => id !== m.id))
      setStatus(`${m.name} swiped ${more.length} more places. The ranking is up to date.`)
    }, 1400)
  }

  const title = (
    <span className="stack" style={{ gap: 8 }}>
      <span>Clear picture of {members.length - open.length} of {members.length} people</span>
      <span className="progress-track" aria-hidden="true">
        {members.map((m) => <i key={m.id} className={open.includes(m) ? '' : 'on'} />)}
      </span>
    </span>
  )

  return (
    <Fold title={title} defaultOpen={defaultOpen}>
      <div className="stack" style={{ gap: 12 }}>
        <p className="small muted">More swipes make the ranking more reliable. Nobody gets a bigger vote.</p>
        {open.map((m) => (
          <div key={m.id} className="row">
            <Avatar member={m} />
            <div className="grow">
              <p className="strong">{m.id === 'me' ? 'You' : m.name}</p>
              <p className="small muted">{swipes(m.swipes.length)} · {confidence(m.swipes.length).label}</p>
            </div>
            {m.id === actorId ? (
              <button className="btn slim" onClick={onSwipeMore}>Swipe more</button>
            ) : m.simulated ? (
              <button className="btn slim" disabled={nudged.includes(m.id)} onClick={() => nudge(m)}>
                {nudged.includes(m.id) ? 'Nudged' : 'Nudge'}
              </button>
            ) : null}
          </div>
        ))}
        <p className="tiny muted" role="status">
          {status ||
            (open.some((m) => m.simulated)
              ? `In this prototype the friends are simulated. A nudge makes them swipe ${NUDGE_SWIPES} more places.`
              : '')}
        </p>
      </div>
    </Fold>
  )
}
