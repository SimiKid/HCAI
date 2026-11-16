import { CardsIcon, GroupIcon, ListIcon, UserIcon } from './Icons'

export type Tab = 'swipe' | 'ranking' | 'trip' | 'profile'

const TABS: { id: Tab; label: string; Icon: typeof CardsIcon }[] = [
  { id: 'swipe', label: 'Swipe', Icon: CardsIcon },
  { id: 'ranking', label: 'Ranking', Icon: ListIcon },
  { id: 'trip', label: 'Our trip', Icon: GroupIcon },
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
