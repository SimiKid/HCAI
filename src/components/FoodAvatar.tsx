import type { ReactNode } from 'react'

/**
 * Avatars are little food characters with a face, plus one optional accessory.
 * An avatar id is "character" or "character+accessory", for example "olive+shades".
 */
interface Character {
  id: string
  label: string
  bg: string
  /** Eye line, half the distance between the eyes, top of the head, half head width at the eyes. */
  y: number
  gap: number
  top: number
  hw: number
  body: ReactNode
}

const INK = '#1b1a20'

export const CHARACTERS: Character[] = [
  {
    id: 'tomato', label: 'Tomato', bg: '#FFE1DA', y: 38, gap: 7, top: 19, hw: 19,
    body: (
      <>
        <circle cx="32" cy="37" r="19" fill="#E8452F" />
        <path d="M45 26a16 16 0 0 1 4 9" stroke="#FF8D7A" strokeWidth="2.5" strokeLinecap="round" fill="none" />
        <path d="M32 22c-4-1-7-3-8-6 3 0 5 1 6 2 0-2 1-4 2-5 1 1 2 3 2 5 1-1 3-2 6-2-1 3-4 5-8 6z" fill="#3E9B4F" />
      </>
    ),
  },
  {
    id: 'avocado', label: 'Avocado', bg: '#E6F2D5', y: 25, gap: 5, top: 9, hw: 12,
    body: (
      <>
        <path d="M32 8c-7 0-11 7-12 15-1 6-6 10-6 18 0 9 8 15 18 15s18-6 18-15c0-8-5-12-6-18-1-8-5-15-12-15z" fill="#4F7F33" />
        <path d="M32 12c-5 0-8 6-9 12-1 6-5 9-5 16 0 7 6 12 14 12s14-5 14-12c0-7-4-10-5-16-1-6-4-12-9-12z" fill="#D5E8A6" />
        <circle cx="32" cy="42" r="8" fill="#8A5A33" />
        <circle cx="29.5" cy="39.5" r="2" fill="#A97445" />
      </>
    ),
  },
  {
    id: 'olive', label: 'Olive', bg: '#F1EFD2', y: 40, gap: 6.5, top: 20, hw: 17,
    body: (
      <>
        <path d="M49 6 37 23" stroke="#C9A66B" strokeWidth="2.5" strokeLinecap="round" />
        <circle cx="49.5" cy="5.5" r="3" fill="#E0144C" />
        <ellipse cx="32" cy="39" rx="17" ry="19" fill="#7E9F3B" />
        <path d="M20 30a13 14 0 0 1 6-7" stroke="#A9C766" strokeWidth="2.5" strokeLinecap="round" fill="none" />
        <circle cx="35" cy="23" r="3.5" fill="#D8432E" />
      </>
    ),
  },
  {
    id: 'pizza', label: 'Pizza', bg: '#FFE9C9', y: 30, gap: 6, top: 12, hw: 17,
    body: (
      <>
        <path d="M12 20Q32 10 52 20L35 55Q32 60 29 55Z" fill="#F8CB5B" />
        <path d="M9 19Q32 5 55 19Q56 24 51 24Q32 14 13 24Q8 24 9 19Z" fill="#C98A3C" />
        <circle cx="27" cy="42" r="3.2" fill="#D8432E" />
        <circle cx="37" cy="45" r="2.6" fill="#D8432E" />
        <circle cx="32" cy="51" r="1.8" fill="#4E9B4A" />
      </>
    ),
  },
  {
    id: 'nigiri', label: 'Nigiri', bg: '#DDEBF7', y: 43, gap: 7, top: 15, hw: 20,
    body: (
      <>
        <rect x="11" y="30" width="42" height="25" rx="12" fill="#FDFDF8" stroke="#E0DDD0" strokeWidth="1.5" />
        <path d="M9 31Q32 9 55 31Q55 37 49 36Q32 27 15 36Q9 37 9 31Z" fill="#FF8A5C" />
        <path d="M20 24l4 7M30 19l3 8M41 21l-2 8" stroke="#FFC3A6" strokeWidth="2" strokeLinecap="round" />
      </>
    ),
  },
  {
    id: 'taco', label: 'Taco', bg: '#FFF0C7', y: 36, gap: 7, top: 17, hw: 20,
    body: (
      <>
        <path d="M9 44A23 23 0 0 1 55 44" fill="none" stroke="#5DAA4A" strokeWidth="7" strokeDasharray="2.5 5" strokeLinecap="round" />
        <path d="M9 44A23 23 0 0 1 55 44" fill="none" stroke="#E8452F" strokeWidth="4" strokeDasharray="1 14" strokeLinecap="round" />
        <path d="M10 45A22 22 0 0 1 54 45Z" fill="#F2B544" />
        <rect x="8" y="42" width="48" height="7" rx="3.5" fill="#E09F2E" />
      </>
    ),
  },
  {
    id: 'lemon', label: 'Lemon', bg: '#E4F3E6', y: 37, gap: 7, top: 16, hw: 19,
    body: (
      <>
        <path d="M9 36Q9 30 14 28Q20 16 32 16Q44 16 50 28Q55 30 55 36Q55 42 50 44Q44 56 32 56Q20 56 14 44Q9 42 9 36Z" fill="#FFD93B" />
        <path d="M19 28q4-6 10-7" stroke="#FFF0A0" strokeWidth="2.5" strokeLinecap="round" fill="none" />
        <path d="M33 16q5-9 13-6q-3 8-13 6z" fill="#4FA35A" />
      </>
    ),
  },
  {
    id: 'ramen', label: 'Ramen', bg: '#FCE3EA', y: 41, gap: 7, top: 19, hw: 21,
    body: (
      <>
        <path d="M19 6l8 23M25 5l5 24" stroke="#7A5230" strokeWidth="2.2" strokeLinecap="round" />
        <path d="M15 29q2-9 6 0q2-9 6 0q2-9 6 0q2-9 6 0q2-9 6 0" stroke="#F3D58A" strokeWidth="3.5" fill="none" strokeLinecap="round" />
        <circle cx="44" cy="24" r="5" fill="#fff" />
        <circle cx="44" cy="24" r="2.4" fill="#F6B03A" />
        <path d="M10 31H54Q54 55 32 55Q10 55 10 31Z" fill="#E0144C" />
        <rect x="8" y="28" width="48" height="5.5" rx="2.75" fill="#B80F3E" />
      </>
    ),
  },
  {
    id: 'egg', label: 'Fried egg', bg: '#D9ECF5', y: 36, gap: 5, top: 15, hw: 14,
    body: (
      <>
        <path d="M31 11c9-2 15 3 19 9 5 6 8 13 5 21-3 9-13 14-23 14-9 0-19-3-23-11-4-8 0-16 4-21 5-6 11-10 18-12z" fill="#fff" stroke="#E4E1D6" strokeWidth="1.5" />
        <circle cx="32" cy="36" r="13.5" fill="#FFC531" />
        <path d="M23 30a10 10 0 0 1 6-5" stroke="#FFE28A" strokeWidth="2.5" strokeLinecap="round" fill="none" />
      </>
    ),
  },
  {
    id: 'paella', label: 'Paella', bg: '#FFE8D2', y: 39, gap: 6.5, top: 15, hw: 21,
    body: (
      <>
        <rect x="2" y="31" width="12" height="9" rx="4.5" fill="none" stroke="#3A3A44" strokeWidth="3" />
        <rect x="50" y="31" width="12" height="9" rx="4.5" fill="none" stroke="#3A3A44" strokeWidth="3" />
        <circle cx="32" cy="36" r="21" fill="#3A3A44" />
        <circle cx="32" cy="36" r="17.5" fill="#F4B63A" />
        <path d="M23 25q9-7 18 0" stroke="#FF7A59" strokeWidth="4" fill="none" strokeLinecap="round" />
        <circle cx="21" cy="46" r="1.8" fill="#4E9B4A" />
        <circle cx="43" cy="47" r="1.8" fill="#4E9B4A" />
        <circle cx="32" cy="50" r="1.8" fill="#D8432E" />
      </>
    ),
  },
  {
    id: 'strawberry', label: 'Strawberry', bg: '#FFE0E6', y: 34, gap: 6.5, top: 16, hw: 17,
    body: (
      <>
        <path d="M32 57C20 51 12 39 14 29C15 22 22 19 32 21C42 19 49 22 50 29C52 39 44 51 32 57Z" fill="#E5344A" />
        <rect x="30.75" y="11" width="2.5" height="8" rx="1.25" fill="#3E9B4F" />
        <path d="M19 22q6-7 13-2q7-5 13 2q-6 5-13 2q-7 3-13-2z" fill="#3E9B4F" />
        <g fill="#FFE08A">
          <ellipse cx="20" cy="42" rx="1" ry="1.6" />
          <ellipse cx="44" cy="42" rx="1" ry="1.6" />
          <ellipse cx="27" cy="49" rx="1" ry="1.6" />
          <ellipse cx="37" cy="49" rx="1" ry="1.6" />
        </g>
      </>
    ),
  },
  {
    id: 'onigiri', label: 'Rice ball', bg: '#E8E4F7', y: 31, gap: 5.5, top: 12, hw: 12,
    body: (
      <>
        <path d="M32 11Q38 11 42 19L55 44Q58 55 46 55H18Q6 55 9 44L22 19Q26 11 32 11Z" fill="#FDFDF8" stroke="#E0DDD0" strokeWidth="1.5" />
        <path d="M22 55V45Q22 42 25 42H39Q42 42 42 45V55Z" fill="#2B2B33" />
      </>
    ),
  },
]

export const ACCESSORIES: { id: string; label: string }[] = [
  { id: '', label: 'Nothing' },
  { id: 'shades', label: 'Sunglasses' },
  { id: 'beret', label: 'Beret' },
  { id: 'crown', label: 'Crown' },
  { id: 'headphones', label: 'Headphones' },
  { id: 'moustache', label: 'Moustache' },
  { id: 'party', label: 'Party hat' },
]

export function avatarParts(id?: string): { character?: Character; accessory: string } {
  const [c, a = ''] = (id ?? '').split('+')
  return { character: CHARACTERS.find((ch) => ch.id === c), accessory: a }
}

export const avatarId = (character: string, accessory: string) => (accessory ? `${character}+${accessory}` : character)

function Accessory({ kind, c }: { kind: string; c: Character }) {
  const { y, gap, top, hw } = c
  switch (kind) {
    case 'shades':
      return (
        <g>
          <path d={`M${32 - gap + 4} ${y - 0.5}h${gap * 2 - 8}`} stroke="#15141a" strokeWidth="1.8" />
          <rect x={32 - gap - 5} y={y - 4} width="10" height="7.5" rx="3" fill="#15141a" />
          <rect x={32 + gap - 5} y={y - 4} width="10" height="7.5" rx="3" fill="#15141a" />
          <path d={`M${32 - gap - 3} ${y - 2}l2.5-1M${32 + gap - 3} ${y - 2}l2.5-1`} stroke="#fff" strokeWidth="1.2" strokeLinecap="round" opacity="0.7" />
        </g>
      )
    case 'beret':
      return (
        <g transform={`rotate(-14 32 ${top})`}>
          <ellipse cx="30" cy={top + 1} rx={Math.min(15, hw * 0.85)} ry="6" fill="#B80F3E" />
          <rect x="29" y={top - 8} width="2.2" height="4" rx="1.1" fill="#B80F3E" />
        </g>
      )
    case 'crown':
      return (
        <g>
          <path d={`M22 ${top + 3}L21 ${top - 7}L27 ${top - 2}L32 ${top - 10}L37 ${top - 2}L43 ${top - 7}L42 ${top + 3}Z`} fill="#FFC531" stroke="#E0A100" strokeWidth="1.2" strokeLinejoin="round" />
          <circle cx="32" cy={top - 1} r="1.6" fill="#E0144C" />
        </g>
      )
    case 'headphones':
      return (
        <g>
          <path d={`M${32 - hw} ${y}C${32 - hw} ${top - 12} ${32 + hw} ${top - 12} ${32 + hw} ${y}`} stroke="#2B2B33" strokeWidth="3" fill="none" strokeLinecap="round" />
          <rect x={32 - hw - 4} y={y - 6} width="7" height="12" rx="3.5" fill="#7C5CE0" />
          <rect x={32 + hw - 3} y={y - 6} width="7" height="12" rx="3.5" fill="#7C5CE0" />
        </g>
      )
    case 'moustache':
      return (
        <path transform={`translate(32 ${y + 4.5})`} fill="#2B1B12"
          d="M0 0c-1.5-2-4.5-2-6 0-1.5 1.6-3.8 1.3-5-.800.3 3.6 4.2 5 7.2 3.3 1.4-.800 2.3-1.7 3.8-1.7s2.4.90 3.8 1.7c3 1.7 6.9.30 7.2-3.3-1.2 2.1-3.5 2.4-5 .800-1.5-2-4.5-2-6 0z" />
      )
    case 'party':
      return (
        <g>
          <path d={`M23 ${top + 4}L32 ${top - 13}L41 ${top + 4}Z`} fill="#7C5CE0" />
          <path d={`M26.5 ${top - 2.5}L37.8 ${top - 1.8}M29.3 ${top - 8}L35 ${top - 7.5}`} stroke="#FFC531" strokeWidth="2" strokeLinecap="round" />
          <circle cx="32" cy={top - 13} r="2.6" fill="#FFC531" />
        </g>
      )
    default:
      return null
  }
}

/** The drawing only. `Avatar` in Bits wraps it in the coloured circle. */
export function FoodAvatar({ id, still }: { id: string; still?: boolean }) {
  const { character: c, accessory } = avatarParts(id)
  if (!c) return null
  const { y, gap } = c
  return (
    <svg viewBox="0 0 64 64" className="food-avatar" aria-hidden="true">
      {c.body}
      <circle cx={32 - gap - 3.3} cy={y + 4.5} r="2.3" fill="#FF7E95" opacity="0.55" />
      <circle cx={32 + gap + 3.3} cy={y + 4.5} r="2.3" fill="#FF7E95" opacity="0.55" />
      <g className={still ? undefined : 'eyes'} style={{ animationDelay: `${(c.id.length * 0.7) % 4}s` }}>
        <ellipse cx={32 - gap} cy={y} rx="2.3" ry="2.9" fill={INK} />
        <ellipse cx={32 + gap} cy={y} rx="2.3" ry="2.9" fill={INK} />
        <circle cx={32 - gap + 0.8} cy={y - 1.1} r="0.85" fill="#fff" />
        <circle cx={32 + gap + 0.8} cy={y - 1.1} r="0.85" fill="#fff" />
      </g>
      {accessory !== 'moustache' && (
        <path d={`M${32 - 2.8} ${y + 3.8}q2.8 3.2 5.6 0`} stroke={INK} strokeWidth="1.7" fill="none" strokeLinecap="round" />
      )}
      <Accessory kind={accessory} c={c} />
    </svg>
  )
}
