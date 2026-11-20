import { useState } from 'react'
import { Link } from '@tanstack/react-router'
import type { GameSummaryDto } from '../game/types'
import { type PlayerColor } from './playerColors'
import { ColorPicker, ErrorText, Panel } from './ui'

export default function OpenGamesPanel({
  games,
  isLoading,
  isRefreshing,
  loadError,
  actionError,
  currentUserId,
  onRefresh,
  onJoin,
  onStart,
  isJoining,
  isStarting,
}: {
  games: GameSummaryDto[]
  isLoading: boolean
  isRefreshing: boolean
  loadError: Error | null
  actionError: Error | null
  currentUserId: string | undefined
  onRefresh: () => void
  onJoin: (game: GameSummaryDto, color: PlayerColor) => void
  onStart: (game: GameSummaryDto) => void
  isJoining: boolean
  isStarting: boolean
}) {
  const [colors, setColors] = useState<Record<string, PlayerColor>>({})

  return (
    <Panel
      eyebrow="Lobby"
      title="Åbne spil"
      action={
        <button
          type="button"
          onClick={onRefresh}
          disabled={isRefreshing}
          className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-stone-200 transition hover:bg-white/10 disabled:opacity-50"
        >
          {isRefreshing ? 'Opdaterer…' : 'Opdater'}
        </button>
      }
    >
      {isLoading && <p className="text-stone-400">Henter spil…</p>}
      {loadError && <ErrorText error={loadError} />}

      {!isLoading && !loadError && games.length === 0 && (
        <div className="rounded-xl border border-dashed border-white/15 px-4 py-10 text-center">
          <p className="font-serif text-lg text-stone-200">Ingen åbne spil lige nu</p>
          <p className="mt-1 text-sm text-stone-400">Opret et nyt spil og inviter de andre.</p>
        </div>
      )}

      <ul className="flex flex-col gap-3">
        {games.map((game) => {
          const isHost = game.hostId === currentUserId
          const isFull = game.playerCount >= game.maxPlayers
          const color = colors[game.id] ?? 'red'
          return (
            <li
              key={game.id}
              className="rounded-xl border border-white/10 bg-black/25 p-4 transition hover:border-amber-200/25"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-serif text-lg text-stone-50">
                    Spil <span className="font-mono text-base">{game.id.slice(0, 8)}</span>
                    {isHost && (
                      <span className="ml-2 rounded-full bg-amber-300/15 px-2 py-0.5 align-middle font-sans text-xs text-amber-200">
                        Du er vært
                      </span>
                    )}
                  </p>
                  <div className="mt-1 flex items-center gap-2 text-sm text-stone-400">
                    <SeatDots taken={game.playerCount} total={game.maxPlayers} />
                    {game.playerCount}/{game.maxPlayers} spillere
                  </div>
                </div>
                <Link
                  to="/games/$gameId"
                  params={{ gameId: game.id }}
                  className="rounded-lg px-3 py-1.5 text-sm text-stone-300 transition hover:bg-white/10 hover:text-stone-100"
                >
                  Åbn →
                </Link>
              </div>

              <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-white/5 pt-3">
                <ColorPicker
                  size="sm"
                  value={color}
                  onChange={(value) => setColors((prev) => ({ ...prev, [game.id]: value }))}
                />
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => onJoin(game, color)}
                    disabled={isJoining || isFull}
                    className="rounded-lg bg-sky-700 px-4 py-1.5 text-sm font-medium text-white transition hover:bg-sky-600 disabled:opacity-40"
                  >
                    {isFull ? 'Fuldt' : 'Deltag'}
                  </button>
                  {isHost && (
                    <button
                      type="button"
                      onClick={() => onStart(game)}
                      disabled={isStarting || game.playerCount < 2}
                      title={game.playerCount < 2 ? 'Der skal være mindst 2 spillere' : undefined}
                      className="rounded-lg bg-amber-500 px-4 py-1.5 text-sm font-semibold text-stone-950 transition hover:bg-amber-400 disabled:opacity-40"
                    >
                      Start
                    </button>
                  )}
                </div>
              </div>
            </li>
          )
        })}
      </ul>

      {actionError && <ErrorText error={actionError} />}
    </Panel>
  )
}

function SeatDots({ taken, total }: { taken: number; total: number }) {
  return (
    <span aria-hidden className="flex gap-1">
      {Array.from({ length: total }, (_, i) => (
        <span
          key={i}
          className={`h-2 w-2 rounded-full ${i < taken ? 'bg-amber-300' : 'bg-stone-600'}`}
        />
      ))}
    </span>
  )
}
