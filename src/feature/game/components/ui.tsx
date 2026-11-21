import type { ButtonHTMLAttributes, ReactNode } from 'react'

// Small building blocks shared by the game panels, so they look and behave alike.

/** Frosted glass with a thin gold line along the top edge, shared by every box in the game. */
const GLASS =
  'relative rounded-2xl border border-amber-100/15 bg-stone-950/75 text-stone-100 shadow-2xl ring-1 shadow-black/50 ring-white/5 backdrop-blur-md ring-inset'

function GoldEdge() {
  return (
    <div className="pointer-events-none absolute inset-x-5 top-0 h-px bg-linear-to-r from-transparent via-amber-300/50 to-transparent" />
  )
}

/** The small, spaced-out heading used above a box or a part of one. */
export function SectionHeading({
  children,
  className = '',
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <h3
      className={`text-[0.7rem] font-semibold tracking-[0.18em] text-amber-300/80 uppercase ${className}`}
    >
      {children}
    </h3>
  )
}

export function Panel(props: { title: string; badge?: ReactNode; children: ReactNode }) {
  return (
    <section className={`${GLASS} flex flex-col gap-2.5 p-3`}>
      <GoldEdge />
      <header className="flex items-center justify-between gap-2">
        <h2 className="font-serif text-lg text-amber-50">{props.title}</h2>
        {props.badge}
      </header>
      {props.children}
    </section>
  )
}

/** The box with the controls for the current phase, at the top of the side bar. */
export function ActionBox(props: { title?: string; badge?: ReactNode; children: ReactNode }) {
  return (
    <section className={`${GLASS} flex flex-col gap-2.5 p-3 text-sm`}>
      <GoldEdge />
      {/* A box without a title brings its own heading. */}
      {props.title && (
        <header className="flex items-baseline justify-between gap-2">
          <SectionHeading>{props.title}</SectionHeading>
          {props.badge}
        </header>
      )}
      {props.children}
    </section>
  )
}

const BUTTON_STYLES = {
  primary:
    'bg-linear-to-b from-amber-300 to-amber-600 font-semibold text-stone-950 shadow-md shadow-amber-900/40 hover:brightness-110',
  secondary: 'border border-white/10 bg-white/5 text-stone-200 hover:bg-white/10',
}

const BUTTON_SIZES = {
  md: 'px-4 py-2',
  sm: 'px-3 py-1.5 text-sm',
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: keyof typeof BUTTON_STYLES
  size?: keyof typeof BUTTON_SIZES
}

export function Button({
  variant = 'primary',
  size = 'md',
  type = 'button',
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={`rounded-xl transition active:translate-y-px disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:brightness-100 ${BUTTON_SIZES[size]} ${BUTTON_STYLES[variant]}`}
      {...props}
    />
  )
}

export function Hint({ children }: { children: ReactNode }) {
  return <p className="text-sm leading-snug text-stone-300">{children}</p>
}

/** Shows why the backend rejected an action. Renders nothing without an error. */
export function ErrorText({ error }: { error: Error | null }) {
  return (
    error && (
      <p role="alert" className="rounded-lg bg-red-950/60 px-2.5 py-1.5 text-sm text-red-200">
        {error.message}
      </p>
    )
  )
}

/** A small round swatch in a player's colour. */
export function PlayerDot({ color, size = 'sm' }: { color: string; size?: 'sm' | 'md' }) {
  return (
    <span
      className={`shrink-0 rounded-full border border-white/40 ${size === 'md' ? 'h-4 w-4' : 'h-3 w-3'}`}
      // A soft glow in the same colour, so dark colours still stand out on the dark boxes.
      style={{ backgroundColor: color, boxShadow: `0 0 6px ${color}` }}
    />
  )
}

/** A small number in a pill, e.g. how many cards a button opens. */
export function CountBadge({ children }: { children: ReactNode }) {
  return (
    // The dark ring keeps the badge visible on an amber background too, e.g. an open tab.
    <span className="min-w-5 rounded-full bg-amber-400/90 px-1.5 text-center text-xs leading-5 font-bold text-stone-950 tabular-nums ring-1 ring-stone-950/40">
      {children}
    </span>
  )
}

const STEP_BUTTON =
  'grid h-7 w-7 shrink-0 place-items-center rounded-full border border-white/10 bg-white/5 text-base leading-none transition hover:bg-white/15 disabled:opacity-30 disabled:hover:bg-white/5'

interface TroopPickerProps {
  label: string
  min?: number
  max: number
  value: number
  onChange: (value: number) => void
}

/** Picks a number with a slider, and − and + for a single step. */
export function TroopPicker({ label, min = 1, max, value, onChange }: TroopPickerProps) {
  return (
    <div className="flex flex-col gap-1">
      <span className="flex items-baseline justify-between text-xs text-stone-400">
        {label}
        <span className="text-base font-bold text-amber-100 tabular-nums">{value}</span>
      </span>
      <div className="flex items-center gap-2">
        <button
          type="button"
          aria-label={`${label}: færre`}
          className={STEP_BUTTON}
          disabled={value <= min}
          onClick={() => onChange(value - 1)}
        >
          −
        </button>
        <input
          type="range"
          aria-label={label}
          className="min-w-0 flex-1 accent-amber-400"
          min={min}
          max={max}
          value={value}
          disabled={min >= max}
          onChange={(event) => onChange(Number(event.target.value))}
        />
        <button
          type="button"
          aria-label={`${label}: flere`}
          className={STEP_BUTTON}
          disabled={value >= max}
          onClick={() => onChange(value + 1)}
        >
          +
        </button>
      </div>
    </div>
  )
}
