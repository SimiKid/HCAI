import type { Member } from '../types'
import { CUISINE_LABEL } from '../model/features'
import { matchLevel } from '../model/explain'
import type { BookingStatus } from '../model/booking'
import type { Ranked, Reservation } from '../model/rank'
import { price } from './Bits'
import { ClockIcon, CrownIcon, HeartIcon, StarIcon, WalkIcon, XIcon } from './Icons'

export function reservationText(res: Reservation, party: number): string {
  if (res.kind === 'walk-in') return `Walk-in usually fine for ${party}`
  if (res.kind === 'slot') return `Table for ${party} from ${res.time}`
  return `No table for ${party} on this night`
}

/** How the group gets a table in the chosen mode, with an icon. A place with no table reads as unavailable at a glance. */
export function BookingLine({ status }: { status: BookingStatus | null }) {
  if (!status) return null
  const { availability: a, label } = status
  if (a === 'full')
    return <span className="book full"><b><XIcon size={13} />Unavailable</b>{label}</span>
  return (
    <span className={a === 'maybe' ? 'book maybe' : 'book'}>
      {a === 'walk-in' ? <WalkIcon size={14} /> : <ClockIcon size={14} />}{label}
    </span>
  )
}

/** The viewer's own matched must-have, as a short line. Only ever built for the viewer. */
export function MineLine({ text }: { text?: string }) {
  if (!text) return null
  return <span className="mine-line"><StarIcon size={12} />{text}</span>
}

interface Props {
  rank: number
  item: Ranked
  whyLine: string
  pinnedBy?: Member
  /** Shortlist entry: no rank number and no match bar. */
  unranked?: boolean
  /** Length of the match bar, 0 to 100. Without it the bar shows the group score itself. */
  barPercent?: number
  /** True when the viewer liked this place with a real swipe. */
  liked?: boolean
  /** The viewer's own must-have this place matches, for example 'Matches your must-have "tapas"'. */
  mine?: string
  onOpen: () => void
}

/**
 * One place in the list. The row answers "what is it, can we get a table, how well does it fit, and why".
 * Area, rating and all table times are one tap away in the bill.
 */
export function RankRow({ rank, item, whyLine, pinnedBy, unranked, barPercent, liked, mine, onOpen }: Props) {
  const r = item.restaurant
  const match = matchLevel(item.groupScore)
  const cls = ['rank-row', item.pinned && 'pinned', item.unavailable && 'unavailable'].filter(Boolean).join(' ')
  return (
    <li>
      <button className={cls} onClick={onOpen}>
        {!unranked && <span className={rank === 1 ? 'rank-num top' : 'rank-num'} aria-label={`Rank ${rank}`}>{rank}</span>}
        <img className="thumb" src={r.photos[0].src} alt="" loading="lazy" />
        <span className="grow stack" style={{ gap: 4 }}>
          <span className="rank-name">
            {r.displayName}
            {/* the heart ties the list back to the viewer's own swipes */}
            {liked && <span className="liked-mark" role="img" aria-label="You liked this"><HeartIcon size={14} /></span>}
          </span>
          <span className="meta">
            <span>{CUISINE_LABEL[r.primaryType]}</span>
            <span aria-label={`Price level ${r.priceLevel} of 4`}>{price(r.priceLevel)}</span>
          </span>
          <BookingLine status={item.booking} />
          {item.pinned ? (
            <span className="match row" style={{ gap: 6, color: 'var(--crimson-text)' }}>
              <CrownIcon size={16} />Pinned by {pinnedBy?.name ?? 'someone'}
            </span>
          ) : unranked ? null : (
            <span className="row" style={{ gap: 8 }}>
              <span className="match">{match.label}</span>
              <span className={match.level === 'strong' ? 'bar strong' : 'bar'} aria-hidden="true">
                <i style={{ width: `${barPercent ?? Math.round(item.groupScore * 100)}%` }} />
              </span>
            </span>
          )}
          <MineLine text={mine} />
          {!item.pinned && whyLine && <span className="why-line">{whyLine}</span>}
        </span>
      </button>
    </li>
  )
}
