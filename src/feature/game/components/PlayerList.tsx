import type { TerritoryState } from '../../map/types'
import { playerName } from '../playerName'
import type { GameDto, PlayerDto } from '../types'
import { Panel } from './ui'

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
    <Panel title="Spillere">
      <ul className="flex flex-col gap-1 text-sm">
        {game.players.map((player) => {
          const owned = territories.filter((territory) => territory.ownerId === player.id)
          const troops = owned.reduce((sum, territory) => sum + territory.units, 0)
          const isCurrent = player.id === game.currentPlayerId

          return (
            <li
              key={player.id}
              className={`flex items-center gap-2 rounded px-2 py-1 ${isCurrent ? 'bg-stone-600' : ''}`}
            >
              <span
                className="h-3 w-3 shrink-0 rounded-full border border-stone-300"
                style={{ backgroundColor: player.color }}
              />
              <span className={`flex-1 ${player.isEliminated ? 'line-through opacity-60' : ''}`}>
                {playerName(player)}
                {player.id === me?.id && ' (dig)'}
              </span>
              {showTotals && (
                <span className="text-stone-300" title="Territorier / tropper">
                  {owned.length} / {troops}
                </span>
              )}
            </li>
          )
        })}
      </ul>
    </Panel>
  )
}
