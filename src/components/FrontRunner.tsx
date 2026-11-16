import type { Member } from '../types'
import { CUISINE_LABEL } from '../model/features'
import { confidence } from '../model/learn'
import { matchLevel } from '../model/explain'
import { swipeOn, type Ranked } from '../model/rank'
import type { Booking } from '../store'
import { count, price, swipes } from './Bits'
import { BookingLine, MineLine } from './RankRow'
import { CrownIcon, HeartIcon, StarIcon } from './Icons'

interface Props {
  item: Ranked
  members: Member[]
  /** The member who looks at the screen. */
  viewerId: string
  booking: Booking
  pinnedBy?: Member
  /** The viewer's own matched must-have, only ever for the viewer. */
  mine?: string
  onOpen: () => void
}

const weekday = (iso: string) => (iso ? new Date(iso + 'T12:00:00').toLocaleDateString('en-GB', { weekday: 'long' }) : '')

/** For whom the front-runner is: tonight, tomorrow, or the planned night of the trip. */
function forWhen(b: Booking): string {
  if (b.when === 'now') return 'Front-runner for tonight'
  if (b.when === 'tomorrow') return 'Front-runner for tomorrow'
  return b.night ? `Front-runner for ${weekday(b.night)}` : 'Front-runner'
}

/** Number one, as a big photo card with a gold border. */
export function FrontRunner({ item, members, viewerId, booking, pinnedBy, mine, onOpen }: Props) {
  const r = item.restaurant
  const viewer = members.find((m) => m.id === viewerId)
  // a heart is a real like, never a guess
  const viewerLiked = viewer ? swipeOn(viewer, r.id) === true : false
  let happy = 0
  let likes = 0
  let skips = 0
  for (const m of members) {
    const swiped = swipeOn(m, r.id)
    if (swiped === true) likes++
    if (swiped === false) skips++
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
    <div className="stack" style={{ gap: 6 }}>
      <button className={item.pinned ? 'fr-card pinned' : 'fr-card'} onClick={onOpen}>
        <span className="fr-photo">
          <img src={r.photos[0].src} alt="" />
          {/* @hcai DM-04 The card names a front-runner and how many it suits, not a decision: choosing stays with the group */}
          <span className="fr-badge">
            {item.pinned ? <><CrownIcon size={16} />Pinned by {pinnedBy?.name ?? 'someone'}</> : <><CrownIcon size={16} />{forWhen(booking)}</>}
          </span>
          {viewerLiked && <span className="fr-liked" role="img" aria-label="You liked this"><HeartIcon size={18} /></span>}
        </span>
        <span className="fr-body">
          <span className="front-name">{r.displayName}</span>
          <span className="meta">
            <span>{CUISINE_LABEL[r.primaryType]}</span>
            <span>{r.neighbourhood}</span>
            <span aria-label={`Price level ${r.priceLevel} of 4`}>{price(r.priceLevel)}</span>
            <span className="fact"><StarIcon size={13} />{r.rating.toFixed(1)} ({count(r.userRatingCount)})</span>
          </span>
          <BookingLine status={item.booking} />
          <span className="strong">
            {members.length === 1 ? matchLevel(item.groupScore).label : `Likely a good fit for ${happy} of ${members.length}`}
          </span>
          {members.length > 1 && <span className="small muted">{facts}</span>}
          <MineLine text={mine} />
          <span className="front-cta">See the bill</span>
        </span>
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
export function TooEarly({ waiting, left }: {
  waiting: Member[]
  /** How many places a member can still swipe. */
  left: (m: Member) => number
}) {
  // never ask for more swipes than there are places left
  const needs = (m: Member) => Math.min(SWIPES_NEEDED - m.swipes.length, left(m))
  const me = waiting.find((m) => m.id === 'me')
  const others = waiting.filter((m) => m.id !== 'me')
  return (
    <div className="card stack" role="status" style={{ gap: 6, textAlign: 'center', alignItems: 'center' }}>
      <span className="eyebrow">No front-runner yet</span>
      <span className="front-name" style={{ fontSize: '1.625rem' }}>Too early to call</span>
      <span>
        {me && `Swipe ${needs(me)} more ${needs(me) === 1 ? 'place' : 'places'} and the table gets a front-runner.`}
        {me && others.length > 0 && ' '}
        {others.length > 0 && `Still waiting for ${others.map((m) => m.name).join(' and ')}.`}
      </span>
    </div>
  )
}
