import { useEffect, useState } from 'react'
import type { HubStatus } from '../../../realtime/typedHub'
import { playerName } from '../playerName'
import type { GameDto, GamePhase, PlayerDto } from '../types'
import { Hint, Panel } from './ui'

const PHASE_NAMES: Record<GamePhase, string> = {
  Deployment: 'Forstærkning',
  Attack: 'Angreb',
  Fortify: 'Befæstning',
}

interface TurnStatusProps {
  game: GameDto
  me: PlayerDto | undefined
  connectionStatus: HubStatus
}

/** Whose turn it is, the phase, and how much time is left of the turn. */
export default function TurnStatus({ game, me, connectionStatus }: TurnStatusProps) {
  const current = game.players.find((player) => player.id === game.currentPlayerId)
  const turnTimeLimit = game.settings?.turnTimeLimit ?? 0

  return (
    <Panel
      title={current?.id === me?.id ? 'Din tur' : `${current ? playerName(current) : '–'}s tur`}
    >
      <p>Fase: {PHASE_NAMES[game.currentPhase]}</p>
      {game.turnStartedAt && turnTimeLimit > 0 && (
        <TurnTimer startedAt={game.turnStartedAt} limitSeconds={turnTimeLimit} />
      )}
      {me?.isEliminated && <Hint>Du er slået ud af spillet.</Hint>}
      {connectionStatus !== 'connected' && (
        <Hint>Ingen live-forbindelse. Spillet opdateres hvert par sekunder.</Hint>
      )}
    </Panel>
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
    <p>
      Tid tilbage: {minutes}:{seconds}
    </p>
  )
}
