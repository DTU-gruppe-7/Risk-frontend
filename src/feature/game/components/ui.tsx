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

const BUTTON_STYLES = {
  primary: 'bg-emerald-700 hover:bg-emerald-600',
  secondary: 'bg-stone-600 hover:bg-stone-500',
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: keyof typeof BUTTON_STYLES
}

export function Button({ variant = 'primary', type = 'button', ...props }: ButtonProps) {
  return (
    <button
      type={type}
      className={`rounded px-3 py-2 disabled:opacity-50 ${BUTTON_STYLES[variant]}`}
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
    <label className="flex flex-col gap-1 text-sm">
      <span className="flex justify-between">
        {label}
        <span className="font-semibold">{value}</span>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        disabled={min >= max}
        onChange={(event) => onChange(Number(event.target.value))}
      />
    </label>
  )
}
