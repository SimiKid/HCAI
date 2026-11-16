import { useEffect, useRef, useState } from 'react'
import type { Member } from '../types'
import { useStore } from '../store'
import { GroupTable, type Reaction } from '../components/GroupTable'
import { CardsIcon, ForkIcon, HeartIcon, ListIcon } from '../components/Icons'
import '../styles/setup.css'

// the cast on the welcome screen: five characters around one table
const CAST: Member[] = ['tomato+crown', 'avocado+headphones', 'pizza+shades', 'egg+beret', 'olive+moustache'].map((avatar, i) => ({
  id: `cast-${i}`, name: avatar, color: '#ffffff', avatar,
  diets: [], allergies: [], tripPrefs: [], customPrefs: [], mustHaves: [], budget: null, swipes: [], muted: [], sharesReasons: false, simulated: true,
}))

// who "likes" each dish as it lands on the table, so the hearts change with the plate
const FANS = [[0, 1, 3], [0, 2, 3, 4], [1, 2], [0, 1, 2, 3, 4], [0, 3, 4]]

export function Welcome() {
  const { set, restaurants } = useStore()
  const dishes = ['seafood', 'pizza', 'vegan', 'tapas', 'japanese', 'mexican', 'italian', 'indian']
    .map((t) => restaurants.find((r) => r.primaryType === t)?.photos[0].src)
    .filter((src): src is string => Boolean(src))
  const plates = dishes.slice(0, 5)
  const floats = dishes.slice(5)
  const [i, setI] = useState(0)
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || plates.length < 2) return
    const t = setInterval(() => setI((n) => (n + 1) % plates.length), 2600)
    return () => clearInterval(t)
  }, [plates.length])
  // the table fits the space left above the text, so "Get started" stays on screen on a short phone
  const hero = useRef<HTMLDivElement>(null)
  const [size, setSize] = useState(292)
  useEffect(() => {
    const el = hero.current
    if (!el) return
    const fit = () => setSize(Math.max(140, Math.min(292, Math.floor(el.clientHeight) - 12)))
    fit()
    const ro = new ResizeObserver(fit)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])
  const reactions: Record<string, Reaction> = Object.fromEntries(FANS[i % FANS.length].map((n) => [CAST[n].id, 'liked' as Reaction]))

  return (
    <div className="welcome">
      <div className="welcome-hero" ref={hero} aria-hidden="true">
        <div className="welcome-rings" />
        {floats[0] && <img className="welcome-float" src={floats[0]} alt="" style={{ width: 108, height: 108, left: -46, top: '5%' }} />}
        {floats[1] && <img className="welcome-float" src={floats[1]} alt="" style={{ width: 92, height: 92, right: -36, top: '12%', animationDelay: '-2s' }} />}
        {floats[2] && <img className="welcome-float" src={floats[2]} alt="" style={{ width: 84, height: 84, right: -14, bottom: '-3%', animationDelay: '-4s' }} />}
        <GroupTable members={CAST} size={size} seat={Math.round(size * 0.21)} plate={plates[i]} plateKey={String(i)} reactions={reactions} />
      </div>
      <div className="stack welcome-text">
        <p className="welcome-brand"><ForkIcon size={18} />Forkcast</p>
        <h1 className="welcome-title">Dinner,<br />decided <em>together.</em></h1>
        {/* @hcai AMR-01 The first screen says what the app does (learns each taste, ranks one list for the group) and that it guides the group rather than deciding, before any data is asked for */}
        <p className="welcome-tagline">Learns your taste. Guides your group.</p>
        <ol className="welcome-steps" aria-label="How it works">
          <li><CardsIcon size={22} />Everyone swipes</li>
          <li><HeartIcon size={22} />Tastes add up</li>
          <li><ListIcon size={22} />One ranked list for the whole group</li>
        </ol>
        <p className="welcome-sub">No more group-chat chaos or last-minute booking stress.</p>
        <button className="btn on-crimson" onClick={() => set({ stage: 'profile' })}>Get started</button>
      </div>
    </div>
  )
}
