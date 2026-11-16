import { useId, useState, type ReactNode } from 'react'
import type { Member } from '../types'
import { FoodAvatar, avatarParts } from './FoodAvatar'
import { ChevronIcon, InfoIcon } from './Icons'

/** A row that shows its content on a tap. Keeps long or secondary content one step away. */
export function Fold({ title, children, defaultOpen = false }: { title: ReactNode; children: ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen)
  const id = useId()
  return (
    <div className="fold">
      <button type="button" className="fold-head" aria-expanded={open} aria-controls={id} onClick={() => setOpen(!open)}>
        <span className="grow">{title}</span>
        <ChevronIcon size={18} style={{ flex: 'none', transform: open ? 'rotate(90deg)' : undefined }} />
      </button>
      {open && <div className="fold-body" id={id}>{children}</div>}
    </div>
  )
}

/** A heading with a small info button. The explanation shows on a tap, so the screen stays quiet. */
export function InfoHeading({ title, info, level = 'h2' }: { title: string; info: string; level?: 'h2' | 'label' }) {
  const [open, setOpen] = useState(false)
  return (
    <div>
      <div className="row" style={{ gap: 2 }}>
        {level === 'h2' ? <h2 className="h2">{title}</h2> : <p className="label">{title}</p>}
        <button type="button" className="info-btn" aria-expanded={open} aria-label={`About: ${title}`} onClick={() => setOpen(!open)}>
          <InfoIcon size={18} />
        </button>
      </div>
      {open && <p className="tiny muted" role="note">{info}</p>}
    </div>
  )
}

export function Avatar({ member, small, size }: { member: Pick<Member, 'name' | 'color' | 'avatar'>; small?: boolean; size?: number }) {
  const preset = avatarParts(member.avatar).character
  const dim = size ? { width: size, height: size, fontSize: size * 0.42 } : undefined
  if (preset)
    return (
      <span className={small ? 'avatar sm art' : 'avatar art'} style={{ background: preset.bg, boxShadow: `0 0 0 2px ${member.color}`, ...dim }} aria-hidden="true">
        <FoodAvatar id={member.avatar} />
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

/** Progress through the onboarding steps. The eyebrow text next to it says the same in words. */
export function StepBar({ step, of = 4 }: { step: number; of?: number }) {
  return (
    <div className="steps" aria-hidden="true">
      {Array.from({ length: of }, (_, i) => <i key={i} className={i < step ? 'on' : ''} />)}
    </div>
  )
}

export function Switch({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return <button type="button" role="switch" className="switch" aria-checked={checked} aria-label={label} onClick={() => onChange(!checked)} />
}

/** "Mia", "Mia and Noah", "Mia, Jonas and Noah". */
export const listNames = (names: string[]) =>
  names.length <= 1 ? names.join('') : `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`

export const price = (level: number) => '$'.repeat(level)
export const km = (d: number) => (d < 1 ? `${Math.round(d * 100) * 10} m` : `${d.toFixed(1)} km`)
/** Walking time for a distance in km, at about 4.5 km per hour. */
export const walk = (d: number) => `${Math.max(1, Math.round(d * 13))} min walk`
export const count = (n: number) => n.toLocaleString('en-US')
export const swipes = (n: number) => `${n} ${n === 1 ? 'swipe' : 'swipes'}`

const shortDate = (iso: string, month: boolean) =>
  new Date(iso + 'T12:00:00').toLocaleDateString('en-GB', month ? { day: 'numeric', month: 'short' } : { day: 'numeric' })

/** "20 to 23 Nov", or "30 Nov to 2 Dec" across a month. Empty for a date that does not parse. */
export function tripDates(from: string, to: string): string {
  if (Number.isNaN(new Date(from + 'T12:00:00').getTime()) || Number.isNaN(new Date(to + 'T12:00:00').getTime())) return ''
  const sameMonth = from.slice(0, 7) === to.slice(0, 7)
  return `${shortDate(from, !sameMonth)} to ${shortDate(to, true)}`
}
