import type { Member } from '../types'
import { avatarById } from '../data/avatars'

export function Avatar({ member, small, size }: { member: Pick<Member, 'name' | 'color' | 'avatar'>; small?: boolean; size?: number }) {
  const preset = avatarById(member.avatar)
  const dim = size ? { width: size, height: size, fontSize: size * (preset ? 0.56 : 0.42) } : undefined
  if (preset)
    return (
      <span className={small ? 'avatar sm emoji' : 'avatar emoji'} style={{ background: preset.bg, boxShadow: `0 0 0 2px ${member.color}`, ...dim }} aria-hidden="true">
        {preset.emoji}
      </span>
    )
  return (
    <span className={small ? 'avatar sm' : 'avatar'} style={{ background: member.color, ...dim }} aria-hidden="true">
      {member.name[0]?.toUpperCase()}
    </span>
  )
}

export function ChipToggle<T extends string>({
  options, selected, onChange, label,
}: {
  options: { value: T; label: string }[]
  selected: T[]
  onChange: (next: T[]) => void
  label: string
}) {
  return (
    <div className="chips" role="group" aria-label={label}>
      {options.map((o) => {
        const on = selected.includes(o.value)
        return (
          <button key={o.value} type="button" className="chip" aria-pressed={on}
            onClick={() => onChange(on ? selected.filter((v) => v !== o.value) : [...selected, o.value])}>
            {o.label}
          </button>
        )
      })}
    </div>
  )
}

export function Segmented<T extends string>({
  options, value, onChange, label,
}: {
  options: { value: T; label: string }[]
  value: T
  onChange: (v: T) => void
  label: string
}) {
  return (
    <div className="seg" role="group" aria-label={label}>
      {options.map((o) => (
        <button key={o.value} type="button" aria-pressed={value === o.value} onClick={() => onChange(o.value)}>
          {o.label}
        </button>
      ))}
    </div>
  )
}

export function Switch({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return <button type="button" role="switch" className="switch" aria-checked={checked} aria-label={label} onClick={() => onChange(!checked)} />
}

export const price = (level: number) => '$'.repeat(level)
export const km = (d: number) => (d < 1 ? `${Math.round(d * 100) * 10} m` : `${d.toFixed(1)} km`)
export const count = (n: number) => n.toLocaleString('en-US')
export const swipes = (n: number) => `${n} ${n === 1 ? 'swipe' : 'swipes'}`
