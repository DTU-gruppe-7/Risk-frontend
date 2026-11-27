import type { ReactNode } from 'react'

// Small symbols drawn on a 24x24 grid in the current text colour.

/** A soldier with a rifle. Also the symbol of the infantry bonus card (see CardIcon). */
export function SoldierShape() {
  return (
    <>
      <circle cx="10" cy="5" r="3" />
      <path d="M5 22v-8a5 5 0 0 1 10 0v8z" />
      <path d="M17.5 2h1.5v20h-1.5z" />
    </>
  )
}

/** A flag planted in the ground, for land a player holds. */
const FLAG_SHAPE = (
  <>
    <path d="M5 2h1.8v20H5z" />
    <path d="M6.8 3.5c3-1.6 5.6 1.4 8.6 0s3.9-.6 4.6-.2v9.4c-.7-.4-1.6-1.2-4.6.2s-5.6-1.6-8.6 0z" />
    <path d="M2 21h8v1.5H2z" />
  </>
)

/** A symbol on its own, with a name for screen readers and on hover. */
export function Icon({
  label,
  className = 'h-4 w-4',
  children,
}: {
  label: string
  className?: string
  children: ReactNode
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      role="img"
      aria-label={label}
      fill="currentColor"
      className={className}
    >
      <title>{label}</title>
      {children}
    </svg>
  )
}

export function SoldierIcon({ className }: { className?: string }) {
  return (
    <Icon label="Tropper" className={className}>
      <SoldierShape />
    </Icon>
  )
}

export function FlagIcon({ className }: { className?: string }) {
  return (
    <Icon label="Felter" className={className}>
      {FLAG_SHAPE}
    </Icon>
  )
}
