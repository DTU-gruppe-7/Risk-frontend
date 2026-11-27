import { useState } from 'react'
import { Link } from '@tanstack/react-router'
import type { GameSummaryDto, LobbyPlayerDto } from '../game/types'
import { firstFreeColor, PLAYER_COLORS, type PlayerColor } from './playerColors'
import { ColorPicker, ErrorText, Panel, RuleBadge } from './ui'

export default function OpenGamesPanel({
  games,
  isLoading,
  isRefreshing,
  loadError,
  actionError,
  currentUserId,
  onRefresh,
  onJoin,
  onLeave,
  onStart,
  isJoining,
  isLeaving,
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
  onLeave: (game: GameSummaryDto, playerId: string) => void
  onStart: (game: GameSummaryDto) => void
  isJoining: boolean
  isLeaving: boolean
  isStarting: boolean
}) {
  // The colour the user has clicked per game. Ignored if someone else has taken it since.
  const [picked, setPicked] = useState<Record<string, PlayerColor>>({})

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
          const me = game.players.find((p) => p.userId === currentUserId)
          const isHost = game.hostId === currentUserId
          const isFull = game.playerCount >= game.maxPlayers
          const takenColors = game.players.map((p) => p.color)
          const pickedColor = picked[game.id]
          const color =
            pickedColor && !takenColors.includes(pickedColor)
              ? pickedColor
              : firstFreeColor(takenColors)

          return (
            <li
              key={game.id}
              className={`rounded-xl border bg-black/25 p-4 transition ${
                me ? 'border-amber-200/30' : 'border-white/10 hover:border-amber-200/25'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="flex flex-wrap items-center gap-2 font-serif text-lg text-stone-50">
                    <span>
                      Spil <span className="font-mono text-base">{game.id.slice(0, 8)}</span>
                    </span>
                    {isHost ? (
                      <StatusBadge>Du er vært</StatusBadge>
                    ) : (
                      me && <StatusBadge>Du er med</StatusBadge>
                    )}
                  </p>
                  <div className="mt-1 flex items-center gap-2 text-sm text-stone-400">
                    <Seats players={game.players} total={game.maxPlayers} />
                    {game.playerCount}/{game.maxPlayers} spillere
                  </div>
                </div>
                <Link
                  to="/games/$gameId"
                  params={{ gameId: game.id }}
                  className="shrink-0 rounded-lg px-3 py-1.5 text-sm text-stone-300 transition hover:bg-white/10 hover:text-stone-100"
                >
                  Åbn →
                </Link>
              </div>

              <RuleBadges game={game} />

              <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-white/5 pt-3">
                {me ? (
                  <p className="flex items-center gap-2 text-sm text-stone-300">
                    Din farve
                    <span
                      className="h-5 w-5 rounded-full border-2 border-black/40"
                      style={{ backgroundColor: me.color }}
                      title={colorLabel(me.color)}
                    />
                  </p>
                ) : (
                  <ColorPicker
                    size="sm"
                    value={color ?? ''}
                    disabledColors={takenColors}
                    onChange={(value) => setPicked((prev) => ({ ...prev, [game.id]: value }))}
                  />
                )}

                <div className="flex gap-2">
                  {!me && (
                    <button
                      type="button"
                      onClick={() => color && onJoin(game, color)}
                      disabled={isJoining || isFull || !color}
                      className="rounded-lg bg-sky-700 px-4 py-1.5 text-sm font-medium text-white transition hover:bg-sky-600 disabled:opacity-40"
                    >
                      {isFull ? 'Fuldt' : 'Deltag'}
                    </button>
                  )}
                  {me && !isHost && (
                    <button
                      type="button"
                      onClick={() => onLeave(game, me.id)}
                      disabled={isLeaving}
                      className="rounded-lg border border-red-300/30 px-4 py-1.5 text-sm text-red-200 transition hover:bg-red-950/50 disabled:opacity-40"
                    >
                      Forlad
                    </button>
                  )}
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

function StatusBadge({ children }: { children: string }) {
  return (
    <span className="rounded-full bg-amber-300/15 px-2 py-0.5 font-sans text-xs text-amber-200">
      {children}
    </span>
  )
}

/** One dot per seat, filled with the colour of the player sitting there. */
function Seats({ players, total }: { players: LobbyPlayerDto[]; total: number }) {
  return (
    <span aria-hidden className="flex gap-1">
      {Array.from({ length: total }, (_, i) => {
        const player = players[i]
        return (
          <span
            key={i}
            className={`h-2.5 w-2.5 rounded-full border border-black/40 ${player ? '' : 'bg-stone-700'}`}
            style={player ? { backgroundColor: player.color } : undefined}
          />
        )
      })}
    </span>
  )
}

/** The rules that differ from a classic game. */
function RuleBadges({ game }: { game: GameSummaryDto }) {
  const badges: { label: string; title: string }[] = []
  if (game.victoryMode === 'Mission')
    badges.push({ label: 'Missioner', title: 'Hver spiller har en hemmelig mission' })
  if (game.hasFogOfWar)
    badges.push({ label: 'Fog of war', title: 'Man ser kun lande op til sine egne' })
  if (game.blizzardCount > 0)
    badges.push({
      label: `❄ ${game.blizzardCount}`,
      title: `${game.blizzardCount} lande er ufremkommelige`,
    })
  if (game.turnTimeLimit > 0)
    badges.push({ label: `⏱ ${formatTurnTime(game.turnTimeLimit)}`, title: 'Tidsgrænse pr. tur' })

  return (
    <div className="mt-2 flex flex-wrap gap-1.5">
      {badges.length === 0 ? (
        <RuleBadge>Klassiske regler</RuleBadge>
      ) : (
        badges.map((badge) => (
          <RuleBadge key={badge.label} title={badge.title}>
            {badge.label}
          </RuleBadge>
        ))
      )}
    </div>
  )
}

function formatTurnTime(seconds: number) {
  return seconds % 60 === 0 ? `${seconds / 60} min` : `${seconds} sek`
}

function colorLabel(color: string) {
  return PLAYER_COLORS.find((c) => c.value === color)?.label ?? color
}
