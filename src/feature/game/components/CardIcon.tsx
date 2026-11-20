import type { ReactNode } from 'react'
import { CARD_TYPE_NAMES } from '../rules'
import type { BonusCardType } from '../types'

const COLORS: Record<BonusCardType, string> = {
  Infantry: 'text-sky-300',
  Cavalry: 'text-amber-300',
  Artillery: 'text-rose-300',
  Wild: 'text-yellow-300',
}

// Drawn on a 24x24 grid: a soldier, a horse's head, a cannon and a star.
const SHAPES: Record<BonusCardType, ReactNode> = {
  Infantry: (
    <>
      <circle cx="10" cy="5" r="3" />
      <path d="M5 22v-8a5 5 0 0 1 10 0v8z" />
      <path d="M17.5 2h1.5v20h-1.5z" />
    </>
  ),
  Cavalry: (
    <path d="M19,22H5V20H19V22M13,2V2C11.75,2 10.58,2.62 9.89,3.66L7,8L9,10L11.06,8.63C11.5,8.32 12.14,8.44 12.45,8.9C12.47,8.93 12.5,8.96 12.5,9V9C12.8,9.59 12.69,10.3 12.22,10.77L7.42,15.57C6.87,16.13 6.87,17.03 7.43,17.58C7.69,17.84 8.05,18 8.42,18H17V6A4,4 0 0,0 13,2Z" />
  ),
  Artillery: (
    <>
      <path d="M3 11.5 19.5 4 22 9.5 5.5 17z" />
      <circle cx="9" cy="17" r="4.5" stroke="#292524" strokeWidth="1.5" />
      <circle cx="9" cy="17" r="1.2" fill="#292524" />
    </>
  ),
  Wild: (
    <path d="M12,17.27L18.18,21L16.54,13.97L22,9.24L14.81,8.62L12,2L9.19,8.62L2,9.24L7.46,13.97L5.82,21L12,17.27Z" />
  ),
}

/** The symbol of a bonus card type. Says the type's name to screen readers and on hover. */
export default function CardIcon({ type, className }: { type: BonusCardType; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      role="img"
      aria-label={CARD_TYPE_NAMES[type]}
      fill="currentColor"
      className={`${COLORS[type]} ${className ?? 'h-6 w-6'}`}
    >
      <title>{CARD_TYPE_NAMES[type]}</title>
      {SHAPES[type]}
    </svg>
  )
}
