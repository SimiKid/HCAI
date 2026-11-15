import type { Member } from '../types'
import { swipeOn } from './rank'

export interface TableMatch {
  /** The other members who liked the place. */
  fans: Member[]
  /** The other members who have not swiped on it yet. */
  unseen: Member[]
}

/** How many other members must like a place before it counts as a table match. */
export const MATCH_FANS = 2

/**
 * A table match: the viewer likes a place, at least two others liked it too,
 * and nobody skipped it. Only real swipes count, never a predicted score.
 * Call it after the viewer's own like, so nobody swipes to fit in.
 */
export function tableMatch(restaurantId: string, viewerId: string, members: Member[]): TableMatch | null {
  const fans: Member[] = []
  const unseen: Member[] = []
  for (const m of members) {
    if (m.id === viewerId) continue
    const liked = swipeOn(m, restaurantId)
    if (liked === false) return null
    if (liked === true) fans.push(m)
    else unseen.push(m)
  }
  return fans.length >= MATCH_FANS ? { fans, unseen } : null
}
