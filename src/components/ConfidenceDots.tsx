import type { ConfidenceLevel } from '../model/learn'

export function ConfidenceDots({ level }: { level: ConfidenceLevel }) {
  const n = level === 'low' ? 1 : level === 'medium' ? 2 : 3
  return (
    <span className="dots" aria-hidden="true">
      {[1, 2, 3].map((i) => <i key={i} className={i <= n ? 'on' : ''} />)}
    </span>
  )
}
