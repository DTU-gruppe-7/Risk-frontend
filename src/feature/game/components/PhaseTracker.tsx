import type { GamePhase } from '../types'

const PHASE_NAMES: Record<GamePhase, string> = {
  Deployment: 'Forstærkning',
  Attack: 'Angreb',
  Fortify: 'Befæstning',
}

const PHASES = Object.keys(PHASE_NAMES) as GamePhase[]

/** The three phases of a turn as steps, with the current one lit and the ones before it done. */
export default function PhaseTracker({ phase }: { phase: GamePhase }) {
  const currentIndex = PHASES.indexOf(phase)

  return (
    <ol
      className="flex items-center rounded-xl border border-white/10 bg-black/30 p-1"
      aria-label="Fase"
    >
      {PHASES.map((step, index) => {
        const isCurrent = index === currentIndex
        const isDone = index < currentIndex
        return (
          <li key={step} className="flex items-center">
            {index > 0 && (
              <span
                aria-hidden
                className={`mx-1 h-px w-3 ${isDone || isCurrent ? 'bg-amber-300/60' : 'bg-white/15'}`}
              />
            )}
            <span
              aria-current={isCurrent ? 'step' : undefined}
              className={`flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-semibold whitespace-nowrap transition ${
                isCurrent
                  ? 'bg-amber-400/90 text-stone-950 shadow'
                  : isDone
                    ? 'text-amber-200/70'
                    : 'text-stone-500'
              }`}
            >
              <span
                className={`grid h-4 w-4 place-items-center rounded-full text-[0.6rem] ${
                  isCurrent ? 'bg-stone-950/20' : 'border border-current'
                }`}
              >
                {isDone ? '✓' : index + 1}
              </span>
              {PHASE_NAMES[step]}
            </span>
          </li>
        )
      })}
    </ol>
  )
}
