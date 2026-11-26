import type { HubStatus } from '../../../realtime/typedHub'
import { playerName } from '../playerName'
import { currentPlayerOf } from '../rules'
import type { GameDto, PlayerDto } from '../types'
import PhaseTracker from './PhaseTracker'
import TurnTimer from './TurnTimer'
import { PlayerDot } from './ui'

interface TurnStatusProps {
  game: GameDto
  me: PlayerDto | undefined
  connectionStatus: HubStatus
}

/**
 * The top bar's view of the turn: the round, whose turn it is, the phase, and how much time is left.
 */
export default function TurnStatus({ game, me, connectionStatus }: TurnStatusProps) {
  const current = currentPlayerOf(game)
  const isMyTurn = current !== undefined && current.id === me?.id
  const turnTimeLimit = game.settings?.turnTimeLimit ?? 0

  return (
    <div className="flex min-w-0 flex-wrap items-center gap-2">
      {/* The round is 0 until the game has started. */}
      {game.round > 0 && (
        <span className="rounded-xl border border-white/10 bg-black/30 px-3 py-1.5 text-sm">
          Runde <span className="font-semibold tabular-nums">{game.round}</span>
        </span>
      )}
      <span
        className={`flex items-center gap-2 rounded-xl border px-3 py-1.5 text-sm font-semibold ${
          isMyTurn
            ? 'border-amber-300/50 bg-amber-300/15 text-amber-50'
            : 'border-white/10 bg-black/30'
        }`}
        // The player's own colour along the left edge, so the turn is seen at a glance.
        style={current && { boxShadow: `inset 3px 0 0 ${current.color}` }}
      >
        {current && <PlayerDot color={current.color} />}
        {isMyTurn ? 'Din tur' : `${current ? playerName(current) : '–'}s tur`}
      </span>
      <PhaseTracker phase={game.currentPhase} />
      {game.turnStartedAt && turnTimeLimit > 0 && (
        <TurnTimer startedAt={game.turnStartedAt} limitSeconds={turnTimeLimit} />
      )}
      {me?.isEliminated && (
        <span className="rounded-xl bg-red-950/60 px-3 py-1.5 text-sm text-red-200">
          Du er slået ud af spillet.
        </span>
      )}
      {connectionStatus !== 'connected' && (
        <span
          className="flex items-center gap-1.5 rounded-xl bg-amber-950/60 px-3 py-1.5 text-xs text-amber-200"
          title="Ingen live-forbindelse. Spillet opdateres hvert par sekunder."
        >
          <span className="h-2 w-2 animate-pulse rounded-full bg-amber-400" />
          Ingen live-forbindelse
        </span>
      )}
    </div>
  )
}
