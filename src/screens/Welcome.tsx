import { useEffect, useState } from 'react'
import type { Member } from '../types'
import { useStore } from '../store'
import { GroupTable, type Reaction } from '../components/GroupTable'
import { CardsIcon, ForkIcon, HeartIcon, ListIcon } from '../components/Icons'

// the cast on the welcome screen: five characters around one table
const CAST: Member[] = ['tomato+crown', 'avocado+headphones', 'pizza+shades', 'egg+beret', 'olive+moustache'].map((avatar, i) => ({
  id: `cast-${i}`, name: avatar, color: '#ffffff', avatar,
  diets: [], allergies: [], tripPrefs: [], swipes: [], muted: [], simulated: true,
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
  const reactions: Record<string, Reaction> = Object.fromEntries(FANS[i % FANS.length].map((n) => [CAST[n].id, 'liked' as Reaction]))

  return (
    <div className="welcome">
      <div className="welcome-hero" aria-hidden="true">
        <div className="welcome-rings" />
        {floats[0] && <img className="welcome-float" src={floats[0]} alt="" style={{ width: 108, height: 108, left: -46, top: '5%' }} />}
        {floats[1] && <img className="welcome-float" src={floats[1]} alt="" style={{ width: 92, height: 92, right: -36, top: '12%', animationDelay: '-2s' }} />}
        {floats[2] && <img className="welcome-float" src={floats[2]} alt="" style={{ width: 84, height: 84, right: -14, bottom: '-3%', animationDelay: '-4s' }} />}
        <GroupTable members={CAST} size={292} seat={62} plate={plates[i]} plateKey={String(i)} reactions={reactions} />
      </div>
      <div className="stack" style={{ gap: 14 }}>
        <p className="welcome-brand"><ForkIcon size={18} />Restaurant Tinder</p>
        <h1 className="welcome-title">Dinner,<br />decided <em>together.</em></h1>
        <ol className="welcome-steps" aria-label="How it works">
          <li><CardsIcon size={22} />Everyone swipes</li>
          <li><HeartIcon size={22} />Tastes add up</li>
          <li><ListIcon size={22} />One table wins</li>
        </ol>
        {/* @hcai AMR-01 The first screen says what the app does and that it only guesses, before any data is asked for */}
        <p>
          The app learns what each of you likes and ranks restaurants for the whole group. It only
          guesses, and your group always has the last word.
        </p>
        <button className="btn on-crimson" onClick={() => set({ stage: 'profile' })}>Get started</button>
      </div>
    </div>
  )
}
