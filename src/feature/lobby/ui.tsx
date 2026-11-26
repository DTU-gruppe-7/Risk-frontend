import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { PLAYER_COLORS, type PlayerColor } from './playerColors'

/** A frosted panel floating over the map. */
export function Panel({
  title,
  eyebrow,
  action,
  children,
  className = '',
}: {
  title: string
  eyebrow?: string
  action?: ReactNode
  children: ReactNode
  className?: string
}) {
  return (
    <section
      className={`relative rounded-2xl border border-amber-100/15 bg-stone-950/60 p-6 shadow-2xl ring-1 shadow-black/60 ring-white/5 backdrop-blur-md ring-inset ${className}`}
    >
      {/* thin gold line along the top edge */}
      <div className="absolute inset-x-6 top-0 h-px bg-linear-to-r from-transparent via-amber-300/50 to-transparent" />
      <header className="mb-5 flex items-end justify-between gap-3">
        <div>
          {eyebrow && (
            <p className="text-xs font-semibold tracking-[0.2em] text-amber-300/70 uppercase">
              {eyebrow}
            </p>
          )}
          <h2 className="font-serif text-2xl text-amber-50">{title}</h2>
        </div>
        {action}
      </header>
      {children}
    </section>
  )
}

export function FieldLabel({ children, hint }: { children: ReactNode; hint?: string }) {
  return (
    <div className="mb-2 flex items-baseline justify-between gap-2">
      <span className="text-sm font-medium text-stone-200">{children}</span>
      {hint && <span className="text-xs text-stone-400">{hint}</span>}
    </div>
  )
}

/** A row of buttons where exactly one is chosen. */
export function Segmented<T extends string | number>({
  label,
  options,
  value,
  onChange,
}: {
  label: string
  options: readonly { value: T; label: string }[]
  value: T
  onChange: (value: T) => void
}) {
  return (
    <div role="radiogroup" aria-label={label} className="flex gap-1 rounded-lg bg-black/30 p-1">
      {options.map((option) => {
        const selected = option.value === value
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(option.value)}
            className={`flex-1 rounded-md px-2 py-1.5 text-sm transition ${
              selected
                ? 'bg-amber-400/90 font-semibold text-stone-950 shadow'
                : 'text-stone-300 hover:bg-white/10 hover:text-stone-100'
            }`}
          >
            {option.label}
          </button>
        )
      })}
    </div>
  )
}

export function ColorPicker({
  value,
  onChange,
  size = 'md',
  disabledColors = [],
}: {
  value: string
  onChange: (value: PlayerColor) => void
  size?: 'sm' | 'md'
  /** Colours other players have taken. Shown faded and cannot be picked. */
  disabledColors?: readonly string[]
}) {
  const dot = size === 'sm' ? 'h-6 w-6' : 'h-8 w-8'
  return (
    <div role="radiogroup" aria-label="Farve" className="flex flex-wrap gap-2">
      {PLAYER_COLORS.map((color) => {
        const taken = disabledColors.includes(color.value)
        const selected = !taken && color.value === value
        return (
          <button
            key={color.value}
            type="button"
            role="radio"
            aria-checked={selected}
            aria-label={taken ? `${color.label} (optaget)` : color.label}
            title={taken ? `${color.label} er optaget` : color.label}
            disabled={taken}
            onClick={() => onChange(color.value)}
            style={{ backgroundColor: color.value }}
            className={`${dot} relative rounded-full border-2 shadow-inner transition ${
              taken
                ? 'cursor-not-allowed border-black/40 opacity-20'
                : selected
                  ? 'scale-110 border-amber-100 ring-2 ring-amber-300/70 ring-offset-2 ring-offset-stone-950'
                  : 'border-black/40 opacity-80 hover:scale-110 hover:opacity-100'
            }`}
          />
        )
      })}
    </div>
  )
}

/** An on/off switch with a title and a one-line explanation. */
export function Toggle({
  title,
  description,
  checked,
  onChange,
}: {
  title: string
  description: string
  checked: boolean
  onChange: (checked: boolean) => void
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`flex w-full items-center justify-between gap-4 rounded-xl border p-3 text-left transition ${
        checked
          ? 'border-amber-300/40 bg-amber-300/10'
          : 'border-white/10 bg-black/20 hover:border-white/20'
      }`}
    >
      <span>
        <span className="block text-sm font-medium text-stone-100">{title}</span>
        <span className="block text-xs text-stone-400">{description}</span>
      </span>
      <span
        className={`relative h-6 w-11 shrink-0 rounded-full transition ${
          checked ? 'bg-amber-400' : 'bg-stone-700'
        }`}
      >
        <span
          className={`absolute top-0.5 h-5 w-5 rounded-full bg-stone-50 shadow transition-all ${
            checked ? 'left-5.5' : 'left-0.5'
          }`}
        />
      </span>
    </button>
  )
}

export function PrimaryButton({
  children,
  className = '',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={`rounded-xl bg-linear-to-b from-amber-300 to-amber-600 px-5 py-3 font-serif text-lg font-semibold text-stone-950 shadow-lg shadow-amber-900/40 transition hover:brightness-110 active:translate-y-px disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:brightness-100 ${className}`}
    >
      {children}
    </button>
  )
}

export function ErrorText({ error }: { error: Error }) {
  return (
    <p role="alert" className="mt-3 rounded-lg bg-red-950/60 px-3 py-2 text-sm text-red-200">
      {error.message}
    </p>
  )
}

/** A small pill naming a rule that is on, e.g. "Fog of war". */
export function RuleBadge({ children, title }: { children: ReactNode; title?: string }) {
  return (
    <span
      title={title}
      className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-xs text-stone-300"
    >
      {children}
    </span>
  )
}
