import { useEffect, useState } from 'react'
import type { HubStatus } from '../../../realtime/typedHub'
import { playerName } from '../playerName'
import type { GameDto, GamePhase, PlayerDto } from '../types'

const PHASE_NAMES: Record<GamePhase, string> = {
  Deployment: 'Forstærkning',
  Attack: 'Angreb',
  Fortify: 'Befæstning',
}

const PHASES = Object.keys(PHASE_NAMES) as GamePhase[]

interface TurnStatusProps {
  game: GameDto
  me: PlayerDto | undefined
  connectionStatus: HubStatus
}

/** One line for the top bar: whose turn it is, the phase, and how much time is left. */
export default function TurnStatus({ game, me, connectionStatus }: TurnStatusProps) {
  const current = game.players.find((player) => player.id === game.currentPlayerId)
  const turnTimeLimit = game.settings?.turnTimeLimit ?? 0

  return (
    <div className="flex min-w-0 flex-wrap items-center gap-x-4 gap-y-1 text-sm">
      <span className="flex items-center gap-2 font-semibold">
        {current && (
          <span
            className="h-3 w-3 shrink-0 rounded-full border border-stone-300"
            style={{ backgroundColor: current.color }}
          />
        )}
        {current?.id === me?.id ? 'Din tur' : `${current ? playerName(current) : '–'}s tur`}
      </span>
      <ol className="flex items-center gap-1" aria-label="Fase">
        {PHASES.map((phase) => {
          const isCurrent = phase === game.currentPhase
          return (
            <li
              key={phase}
              aria-current={isCurrent ? 'step' : undefined}
              className={`rounded px-2 py-0.5 ${
                isCurrent ? 'bg-emerald-700 font-semibold' : 'text-stone-400'
              }`}
            >
              {PHASE_NAMES[phase]}
            </li>
          )
        })}
      </ol>
      {game.turnStartedAt && turnTimeLimit > 0 && (
        <TurnTimer startedAt={game.turnStartedAt} limitSeconds={turnTimeLimit} />
      )}
      {me?.isEliminated && <span className="text-stone-300">Du er slået ud af spillet.</span>}
      {connectionStatus !== 'connected' && (
        <span
          className="text-amber-300"
          title="Ingen live-forbindelse. Spillet opdateres hvert par sekunder."
        >
          Ingen live-forbindelse
        </span>
      )}
    </div>
  )
}

/** Counts down to when the backend ends the turn by itself. */
function TurnTimer({ startedAt, limitSeconds }: { startedAt: string; limitSeconds: number }) {
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(timer)
  }, [])

  const endsAt = new Date(startedAt).getTime() + limitSeconds * 1000
  const secondsLeft = Math.max(0, Math.ceil((endsAt - now) / 1000))
  const minutes = Math.floor(secondsLeft / 60)
  const seconds = String(secondsLeft % 60).padStart(2, '0')

  return (
    <span className="text-stone-300 tabular-nums" title="Tid tilbage af turen">
      {minutes}:{seconds}
    </span>
  )
}
