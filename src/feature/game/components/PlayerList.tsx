import type { ReactNode } from 'react'
import type { TerritoryInfo, TerritoryState } from '../../map/types'
import { playerName } from '../playerName'
import { playerStatsOf, type PlayerStats } from '../playerStats'
import type { GameDto, PlayerDto } from '../types'
import { FlagIcon, SoldierIcon } from './icons'
import { CountBadge, Panel, PlayerDot } from './ui'

interface PlayerListProps {
  game: GameDto
  me: PlayerDto | undefined
  territories: TerritoryState[]
  infos: TerritoryInfo[]
}

/** One total with its symbol, or "?" when fog of war hides it. */
function Stat({ icon, value }: { icon: ReactNode; value: number | undefined }) {
  return (
    <span className="flex items-center gap-1">
      {icon}
      <span className="min-w-4 font-semibold text-amber-50 tabular-nums">{value ?? '?'}</span>
    </span>
  )
}

/** The player's territories and troops, after their name. */
function PlayerTotals({ stats }: { stats: PlayerStats | null }) {
  return (
    <span
      className="ml-auto flex shrink-0 items-center gap-2.5 text-xs text-stone-400"
      title={stats ? undefined : 'Skjult af fog of war'}
    >
      <Stat icon={<FlagIcon className="h-3.5 w-3.5" />} value={stats?.territories} />
      <Stat icon={<SoldierIcon className="h-3.5 w-3.5" />} value={stats?.troops} />
    </span>
  )
}

/** Every player in turn order, with whose turn it is and how much of the board they hold. */
export default function PlayerList({ game, me, territories, infos }: PlayerListProps) {
  // Nobody holds anything before the game has started.
  const showStats = game.state !== 'Lobby'
  const view = {
    territories,
    infos,
    hasFogOfWar: game.settings?.hasFogOfWar ?? false,
    meId: me?.id,
  }
  // The server draws the turn order at random, so it is not the order the players come in.
  const playersInTurnOrder = [...game.players].sort((a, b) => a.turnOrder - b.turnOrder)

  return (
    <Panel title="Spillere" badge={<CountBadge>{game.players.length}</CountBadge>}>
      <ul className="flex flex-col gap-1.5 text-sm">
        {playersInTurnOrder.map((player) => {
          const isCurrent = player.id === game.currentPlayerId

          return (
            <li
              key={player.id}
              aria-current={isCurrent ? 'true' : undefined}
              className={`flex items-center gap-2 rounded-xl border px-3 py-2 transition ${
                isCurrent ? 'border-amber-300/40 bg-amber-300/10' : 'border-white/5 bg-black/20'
              } ${player.isEliminated ? 'opacity-50' : ''}`}
              // The player's colour along the left edge.
              style={{ boxShadow: `inset 3px 0 0 ${player.color}` }}
            >
              <span className="flex min-w-0 items-center gap-2">
                <PlayerDot color={player.color} />
                <span className={`truncate ${player.isEliminated ? 'line-through' : ''}`}>
                  {playerName(player)}
                </span>
                {player.id === me?.id && (
                  <span className="rounded bg-white/10 px-1.5 text-[0.65rem] text-stone-300 uppercase">
                    dig
                  </span>
                )}
                {isCurrent && (
                  <span className="rounded bg-amber-400/90 px-1.5 text-[0.65rem] font-bold text-stone-950 uppercase">
                    tur
                  </span>
                )}
              </span>
              {showStats && <PlayerTotals stats={playerStatsOf(player, view)} />}
            </li>
          )
        })}
      </ul>
    </Panel>
  )
}
