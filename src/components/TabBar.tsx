import type { SVGProps } from 'react'
import { CardsIcon, GroupIcon, ListIcon, UserIcon } from './Icons'

export type Tab = 'home' | 'swipe' | 'ranking' | 'trip' | 'profile'

/** A folded map, for the overview. Same stroke style as the other icons. */
const MapIcon = ({ size = 24, ...rest }: SVGProps<SVGSVGElement> & { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.9}
    strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...rest}>
    <path d="M9 4.5 3.5 6.5v13L9 17.5l6 2 5.5-2v-13L15 6.5l-6-2Z" /><path d="M9 4.5v13M15 6.5v13" />
  </svg>
)

const TABS: { id: Tab; label: string; Icon: typeof CardsIcon }[] = [
  { id: 'home', label: 'Overview', Icon: MapIcon },
  { id: 'swipe', label: 'Swipe', Icon: CardsIcon },
  { id: 'ranking', label: 'Ranking', Icon: ListIcon },
  { id: 'trip', label: 'Group', Icon: GroupIcon },
  { id: 'profile', label: 'Profile', Icon: UserIcon },
]

export function TabBar({ tab, onChange }: { tab: Tab; onChange: (t: Tab) => void }) {
  return (
    <nav className="tabbar" aria-label="Main">
      {TABS.map(({ id, label, Icon }) => (
        <button key={id} aria-current={tab === id ? 'page' : undefined} onClick={() => onChange(id)}>
          <Icon />
          {label}
        </button>
      ))}
    </nav>
  )
}
