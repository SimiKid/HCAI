import type { Member } from '../types'
import { CUISINE_LABEL } from '../model/features'
import { matchLevel } from '../model/explain'
import { expectedReservation, type Ranked, type Reservation } from '../model/rank'
import { count, price } from './Bits'
import { ClockIcon, CrownIcon, StarIcon } from './Icons'

export function reservationText(res: Reservation, party: number): string {
  if (res.kind === 'walk-in') return `Walk-in usually fine for ${party}`
  if (res.kind === 'slot') return `Table for ${party} from ${res.time}`
  return `No table for ${party} tonight`
}

interface Props {
  rank: number
  item: Ranked
  party: number
  whyLine: string
  pinnedBy?: Member
  /** Shortlist entry: no rank number and no match bar. */
  unranked?: boolean
  onOpen: () => void
}

export function RankRow({ rank, item, party, whyLine, pinnedBy, unranked, onOpen }: Props) {
  const r = item.restaurant
  const match = matchLevel(item.groupScore)
  return (
    <li>
      <button className={item.pinned ? 'rank-row pinned' : 'rank-row'} onClick={onOpen}>
        {!unranked && <span className={rank === 1 ? 'rank-num top' : 'rank-num'} aria-label={`Rank ${rank}`}>{rank}</span>}
        <img className="thumb" src={r.photos[0].src} alt="" loading="lazy" />
        <span className="grow stack" style={{ gap: 4 }}>
          <span className="rank-name">{r.displayName}</span>
          <span className="meta">
            <span>{CUISINE_LABEL[r.primaryType]}</span>
            <span>{r.neighbourhood}</span>
            <span aria-label={`Price level ${r.priceLevel} of 4`}>{price(r.priceLevel)}</span>
            <span className="fact"><StarIcon size={13} />{r.rating.toFixed(1)} ({count(r.userRatingCount)})</span>
          </span>
          {item.pinned ? (
            <span className="match row" style={{ gap: 6, color: 'var(--crimson-text)' }}>
              <CrownIcon size={16} />Pinned by {pinnedBy?.name ?? 'someone'}
            </span>
          ) : unranked ? null : (
            <span className="row" style={{ gap: 8 }}>
              <span className="match">{match.label}</span>
              <span className={match.level === 'strong' ? 'bar strong' : 'bar'} aria-hidden="true">
                <i style={{ width: `${Math.round(item.groupScore * 100)}%` }} />
              </span>
            </span>
          )}
          <span className="meta"><span className="fact"><ClockIcon size={13} />{reservationText(expectedReservation(r, party), party)}</span></span>
          {!item.pinned && whyLine && <span className="why-line">{whyLine}</span>}
        </span>
      </button>
    </li>
  )
}
