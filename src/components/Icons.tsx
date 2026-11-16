import type { ReactNode, SVGProps } from 'react'

type P = SVGProps<SVGSVGElement> & { size?: number }

function Svg({ size = 24, children, ...rest }: P & { children: ReactNode }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.9}
      strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...rest}>
      {children}
    </svg>
  )
}

export const HeartIcon = (p: P) => <Svg {...p}><path d="M12 20.5s-7.5-4.6-7.5-10.2A4.3 4.3 0 0 1 12 7.6a4.3 4.3 0 0 1 7.5 2.7c0 5.6-7.5 10.2-7.5 10.2Z" fill="currentColor" /></Svg>
export const XIcon = (p: P) => <Svg {...p}><path d="M6 6l12 12M18 6 6 18" /></Svg>
export const UndoIcon = (p: P) => <Svg {...p}><path d="M9 14 4 9l5-5" /><path d="M4 9h10a6 6 0 0 1 0 12h-3" /></Svg>
export const CardsIcon = (p: P) => <Svg {...p}><rect x="7" y="3.5" width="12" height="16" rx="3" /><path d="M4.5 7.5v10a3 3 0 0 0 3 3h7" /></Svg>
export const ListIcon = (p: P) => <Svg {...p}><path d="M9 6h11M9 12h11M9 18h11" /><path d="M4 6h.01M4 12h.01M4 18h.01" strokeWidth={2.6} /></Svg>
export const GroupIcon = (p: P) => <Svg {...p}><circle cx="9" cy="8.5" r="3.2" /><path d="M3 19.5c.4-3.3 2.9-5 6-5s5.6 1.7 6 5" /><path d="M16 5.6a3 3 0 0 1 0 5.8M18 14.9c1.7.6 2.8 2.1 3 4.6" /></Svg>
export const UserIcon = (p: P) => <Svg {...p}><circle cx="12" cy="8" r="3.6" /><path d="M5 20c.5-3.8 3.4-5.8 7-5.8s6.5 2 7 5.8" /></Svg>
export const StarIcon = (p: P) => <Svg {...p} fill="currentColor" stroke="none"><path d="m12 3 2.7 5.6 6.1.8-4.5 4.3 1.1 6.1L12 16.9 6.6 19.8l1.1-6.1L3.2 9.4l6.1-.8L12 3Z" /></Svg>
export const PinIcon = (p: P) => <Svg {...p}><path d="M12 21s6.5-5.4 6.5-10.5a6.5 6.5 0 0 0-13 0C5.5 15.6 12 21 12 21Z" /><circle cx="12" cy="10.5" r="2.3" /></Svg>
export const CrownIcon = (p: P) => <Svg {...p}><path d="M4 18h16M4.5 15 3 7l5 3.5L12 5l4 5.5L21 7l-1.5 8h-15Z" /></Svg>
export const ClockIcon = (p: P) => <Svg {...p}><circle cx="12" cy="12" r="8.5" /><path d="M12 7.5V12l3 2" /></Svg>
export const WalkIcon = (p: P) => <Svg {...p}><circle cx="13" cy="4.5" r="1.6" /><path d="m9 21 2.5-6-2-2.5 1-5 3.5 3 3 1M6.5 12l2-4.5 2-.5M13.5 16l2 5" /></Svg>
export const InfoIcon = (p: P) => <Svg {...p}><circle cx="12" cy="12" r="8.5" /><path d="M12 11v5M12 8h.01" /></Svg>
export const ChevronIcon = (p: P) => <Svg {...p}><path d="m9 6 6 6-6 6" /></Svg>
export const ForkIcon = (p: P) => <Svg {...p}><path d="M7 3v7a2.5 2.5 0 0 0 5 0V3M9.5 3v18M17 3c-1.7 1.5-2.5 3.8-2.5 6.5 0 2 1 3 2.5 3.2V21" /></Svg>
export const CheckIcon = (p: P) => <Svg {...p}><path d="m5 12.5 4.5 4.5L19 7.5" /></Svg>
