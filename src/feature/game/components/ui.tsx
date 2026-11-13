import type { ButtonHTMLAttributes, ReactNode } from 'react'

// Small building blocks shared by the game panels, so they look and behave alike.

export function Panel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-2 rounded bg-stone-800 p-4 text-stone-100 shadow-lg">
      <h2 className="font-semibold">{title}</h2>
      {children}
    </section>
  )
}

/**
 * The small box with the controls for the current phase. It floats over an empty corner of the
 * map, so it is kept compact and slightly see-through.
 */
export function ActionBox(props: { title?: string; badge?: ReactNode; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-2 rounded-xl border border-stone-600/60 bg-stone-800/90 p-3 text-sm text-stone-100 shadow-xl backdrop-blur-sm">
      {/* A box without a title brings its own heading. */}
      {props.title && (
        <header className="flex items-baseline justify-between gap-2">
          <h2 className="text-xs font-semibold tracking-wide text-stone-400 uppercase">
            {props.title}
          </h2>
          {props.badge}
        </header>
      )}
      {props.children}
    </section>
  )
}

const BUTTON_STYLES = {
  primary: 'bg-emerald-700 hover:bg-emerald-600',
  secondary: 'bg-stone-600 hover:bg-stone-500',
}

const BUTTON_SIZES = {
  md: 'px-3 py-2',
  sm: 'px-2 py-1 text-sm',
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
      className={`rounded disabled:opacity-50 ${BUTTON_SIZES[size]} ${BUTTON_STYLES[variant]}`}
      {...props}
    />
  )
}

export function Hint({ children }: { children: ReactNode }) {
  return <p className="text-sm text-stone-300">{children}</p>
}

/** Shows why the backend rejected an action. Renders nothing without an error. */
export function ErrorText({ error }: { error: Error | null }) {
  return error && <p className="text-sm text-red-300">{error.message}</p>
}

interface TroopPickerProps {
  label: string
  min?: number
  max: number
  value: number
  onChange: (value: number) => void
}

export function TroopPicker({ label, min = 1, max, value, onChange }: TroopPickerProps) {
  return (
    <label className="flex flex-col text-sm">
      <span className="flex justify-between">
        {label}
        <span className="font-semibold tabular-nums">{value}</span>
      </span>
      <input
        type="range"
        className="accent-emerald-500"
        min={min}
        max={max}
        value={value}
        disabled={min >= max}
        onChange={(event) => onChange(Number(event.target.value))}
      />
    </label>
  )
}
