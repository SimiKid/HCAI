import type { Member } from '../types'
import { CUISINE_LABEL } from '../model/features'
import { confidence } from '../model/learn'
import { matchLevel } from '../model/explain'
import { expectedReservation, swipeOn, type Ranked } from '../model/rank'
import { useNight } from '../store'
import { count, price, swipes } from './Bits'
import { GroupTable, type Reaction } from './GroupTable'
import { reservationText } from './RankRow'
import { ClockIcon, CrownIcon, StarIcon } from './Icons'

interface Props {
  item: Ranked
  members: Member[]
  /** The member who looks at the screen. */
  viewerId: string
  party: number
  pinnedBy?: Member
  onOpen: () => void
}

/** Number one, served in the middle of the group's table. */
export function FrontRunner({ item, members, viewerId, party, pinnedBy, onOpen }: Props) {
  const r = item.restaurant
  const night = useNight()
  const viewer = members.find((m) => m.id === viewerId)
  const viewerSwiped = viewer ? swipeOn(viewer, r.id) !== null : false
  // A heart is a real like, never a guess. As on the Swipe screen, the likes of the others
  // only show after the viewer's own swipe on this place, so nobody swipes to fit in.
  const reactions: Record<string, Reaction> = {}
  let happy = 0
  let likes = 0
  let skips = 0
  for (const m of members) {
    const swiped = swipeOn(m, r.id)
    if (swiped === true) likes++
    if (swiped === false) skips++
    if (swiped === true && (m.id === viewerId || viewerSwiped)) reactions[m.id] = 'liked'
    const level = matchLevel(item.memberScores[m.id]).level
    if (level === 'strong' || level === 'good') happy++
  }
  const unseen = members.length - likes - skips
  // what the group really did with this place, next to what the app expects
  const facts = [
    likes > 0 && `${likes} liked it`,
    skips > 0 && `${skips} skipped it`,
    unseen > 0 && `${unseen} ${unseen === 1 ? 'has' : 'have'} not seen it`,
  ].filter(Boolean).join(' · ')
  const unsure = members.filter((m) => confidence(m.swipes.length).level === 'low')
  return (
    <div className="stack" style={{ gap: 4 }}>
      <button className="front" onClick={onOpen}>
        <GroupTable members={members} size={Math.min(280, 220 + members.length * 12)} seat={52} plate={r.photos[0].src}
          reactions={reactions} animateKey={`${r.id}-${members.length}`} />
        {/* @hcai DM-04 The reveal names a front-runner and how many it suits, not a decision: choosing stays with the group */}
        <span className="eyebrow" style={{ marginTop: 8, color: item.pinned ? 'var(--crimson-text)' : undefined, display: 'inline-flex', gap: 6, alignItems: 'center' }}>
          {item.pinned ? <><CrownIcon size={16} />Pinned by {pinnedBy?.name ?? 'someone'}</> : night.weekday ? `Front-runner for ${night.weekday}` : "Tonight's front-runner"}
        </span>
        <span className="front-name">{r.displayName}</span>
        <span className="meta">
          <span>{CUISINE_LABEL[r.primaryType]}</span>
          <span>{r.neighbourhood}</span>
          <span aria-label={`Price level ${r.priceLevel} of 4`}>{price(r.priceLevel)}</span>
          <span className="fact"><StarIcon size={13} />{r.rating.toFixed(1)} ({count(r.userRatingCount)})</span>
        </span>
        <span className="strong">
          {members.length === 1 ? matchLevel(item.groupScore).label : `Likely a good fit for ${happy} of ${members.length}`}
        </span>
        {members.length > 1 && <span className="small muted">{facts}</span>}
        <span className="meta"><span className="fact"><ClockIcon size={13} />{reservationText(expectedReservation(r, party, night.iso), party)}</span></span>
        <span className="front-cta">See the bill</span>
      </button>
      {unsure.length > 0 && !item.pinned && (
        <p className="tiny muted" style={{ textAlign: 'center' }}>
          Still a rough guess for {unsure.map((m) => (m.id === 'me' ? `you (${swipes(m.swipes.length)})` : `${m.name} (${swipes(m.swipes.length)})`)).join(' and ')}.
        </p>
      )}
    </div>
  )
}

export const SWIPES_NEEDED = 8

/** Shown instead of a front-runner while someone at the table has barely swiped. */
export function TooEarly({ members, waiting, left }: {
  members: Member[]
  waiting: Member[]
  /** How many places a member can still swipe. */
  left: (m: Member) => number
}) {
  // never ask for more swipes than there are places left
  const needs = (m: Member) => Math.min(SWIPES_NEEDED - m.swipes.length, left(m))
  const me = waiting.find((m) => m.id === 'me')
  const others = waiting.filter((m) => m.id !== 'me')
  return (
    <div className="front" role="status">
      <GroupTable members={members} size={Math.min(240, 190 + members.length * 10)} seat={46} />
      <span className="eyebrow" style={{ marginTop: 8 }}>No front-runner yet</span>
      <span className="front-name" style={{ fontSize: '1.625rem' }}>Too early to call</span>
      <span>
        {me && `Swipe ${needs(me)} more ${needs(me) === 1 ? 'place' : 'places'} and the table gets a front-runner.`}
        {me && others.length > 0 && ' '}
        {others.length > 0 && `Still waiting for ${others.map((m) => m.name).join(' and ')}.`}
      </span>
    </div>
  )
}
