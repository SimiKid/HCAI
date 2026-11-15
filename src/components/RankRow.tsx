import type { Member } from '../types'
import { CUISINE_LABEL } from '../model/features'
import { matchLevel } from '../model/explain'
import type { Ranked, Reservation } from '../model/rank'
import { price } from './Bits'
import { CrownIcon, HeartIcon } from './Icons'

export function reservationText(res: Reservation, party: number): string {
  if (res.kind === 'walk-in') return `Walk-in usually fine for ${party}`
  if (res.kind === 'slot') return `Table for ${party} from ${res.time}`
  return `No table for ${party} on this night`
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
  onOpen: () => void
}

/**
 * One place in the list. The row only answers "what is it, how well does it fit, and why".
 * Area, rating and table times are one tap away in the bill.
 */
export function RankRow({ rank, item, whyLine, pinnedBy, unranked, barPercent, liked, onOpen }: Props) {
  const r = item.restaurant
  const match = matchLevel(item.groupScore)
  return (
    <li>
      <button className={item.pinned ? 'rank-row pinned' : 'rank-row'} onClick={onOpen}>
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
          {!item.pinned && whyLine && <span className="why-line">{whyLine}</span>}
        </span>
      </button>
    </li>
  )
}
