import type { Member } from '../types'

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
