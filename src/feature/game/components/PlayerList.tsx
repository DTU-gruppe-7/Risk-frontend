import type { TerritoryState } from '../../map/types'
import { playerName } from '../playerName'
import type { GameDto, PlayerDto } from '../types'
import { CountBadge, Panel, PlayerDot } from './ui'

interface PlayerListProps {
  game: GameDto
  me: PlayerDto | undefined
  territories: TerritoryState[]
}

/** Every player in turn order, with whose turn it is and how much of the board they hold. */
export default function PlayerList({ game, me, territories }: PlayerListProps) {
  // Under fog of war we only know the territories we can see, so totals would be misleading.
  const showTotals = game.state !== 'Lobby' && !game.settings?.hasFogOfWar

  return (
    <Panel title="Spillere" badge={<CountBadge>{game.players.length}</CountBadge>}>
      <ul className="flex flex-col gap-1.5 text-sm">
        {game.players.map((player) => {
          const owned = territories.filter((territory) => territory.ownerId === player.id)
          const troops = owned.reduce((sum, territory) => sum + territory.units, 0)
          const isCurrent = player.id === game.currentPlayerId

          return (
            <li
              key={player.id}
              aria-current={isCurrent ? 'true' : undefined}
              className={`flex items-center gap-2.5 rounded-xl border px-3 py-2 transition ${
                isCurrent ? 'border-amber-300/40 bg-amber-300/10' : 'border-white/5 bg-black/20'
              } ${player.isEliminated ? 'opacity-50' : ''}`}
              // The player's colour along the left edge.
              style={{ boxShadow: `inset 3px 0 0 ${player.color}` }}
            >
              <PlayerDot color={player.color} />
              <span className="flex min-w-0 flex-1 items-center gap-1.5">
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
              {showTotals && (
                <span className="flex gap-2 text-xs text-stone-300 tabular-nums">
                  <span title="Territorier">
                    <span className="text-stone-500">▣</span> {owned.length}
                  </span>
                  <span title="Tropper">
                    <span className="text-stone-500">⚔</span> {troops}
                  </span>
                </span>
              )}
            </li>
          )
        })}
      </ul>
    </Panel>
  )
}
