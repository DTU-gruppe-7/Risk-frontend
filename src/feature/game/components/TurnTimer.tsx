import { useEffect, useState } from 'react'

/** Below this many seconds the timer turns amber, and below the last it turns red and pulses. */
const WARNING_SECONDS = 30
const DANGER_SECONDS = 10

function toneOf(secondsLeft: number) {
  if (secondsLeft <= DANGER_SECONDS)
    return { text: 'text-red-300 animate-pulse', bar: 'bg-red-500' }
  if (secondsLeft <= WARNING_SECONDS) return { text: 'text-amber-300', bar: 'bg-amber-400' }
  return { text: 'text-stone-100', bar: 'bg-emerald-400' }
}

/** Counts down to when the backend ends the turn by itself, with a bar for the time left. */
export default function TurnTimer({
  startedAt,
  limitSeconds,
}: {
  startedAt: string
  limitSeconds: number
}) {
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(timer)
  }, [])

  const endsAt = new Date(startedAt).getTime() + limitSeconds * 1000
  const secondsLeft = Math.max(0, Math.ceil((endsAt - now) / 1000))
  const minutes = Math.floor(secondsLeft / 60)
  const seconds = String(secondsLeft % 60).padStart(2, '0')
  const tone = toneOf(secondsLeft)

  return (
    <div
      className="flex w-20 flex-col gap-1 rounded-xl border border-white/10 bg-black/30 px-2.5 py-1"
      title="Tid tilbage af turen"
    >
      <span className={`flex items-center gap-1.5 text-sm font-semibold tabular-nums ${tone.text}`}>
        <svg viewBox="0 0 24 24" aria-hidden className="h-3.5 w-3.5 fill-none stroke-current">
          <circle cx="12" cy="13" r="8" strokeWidth="2" />
          <path d="M12 9v4l2.5 2.5M9 2h6" strokeWidth="2" strokeLinecap="round" />
        </svg>
        {minutes}:{seconds}
      </span>
      <span className="h-1 overflow-hidden rounded-full bg-white/10">
        <span
          className={`block h-full rounded-full transition-[width] duration-1000 ease-linear ${tone.bar}`}
          style={{ width: `${(secondsLeft / limitSeconds) * 100}%` }}
        />
      </span>
    </div>
  )
}
