import { useState, type FormEvent } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, useNavigate } from '@tanstack/react-router'
import { queryKeys } from '../api/query/queryKeys'
import { useAuth } from '../auth/useAuth'
import { createGame, joinGame, startGame } from '../feature/game/mutations'
import { gamesQuery, territoriesQuery } from '../feature/game/queries'
import type { GameSummaryDto } from '../feature/game/types'

const colors = ['red', 'blue', 'green', 'yellow', 'purple', 'orange']

function App() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { user } = useAuth()
  const games = useQuery(gamesQuery())
  const [color, setColor] = useState(colors[0])
  const [maxPlayers, setMaxPlayers] = useState(4)
  const [selectedColors, setSelectedColors] = useState<Record<string, string>>({})

  const joinMutation = useMutation({
    mutationFn: ({ gameId, color }: { gameId: string; color: string }) =>
      joinGame(gameId, { color }),
    onSuccess: async (_, variables) => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.games.all() })
      void navigate({ to: '/games/$gameId', params: { gameId: variables.gameId } })
    },
  })

  const createMutation = useMutation({
    mutationFn: createGame,
    onSuccess: async (game) => {
      await joinGame(game.id, { color })
      await queryClient.invalidateQueries({ queryKey: queryKeys.games.all() })
      void navigate({ to: '/games/$gameId', params: { gameId: game.id } })
    },
  })

  const startMutation = useMutation({
    mutationFn: startGame,
    onSuccess: async (game) => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.games.all() })
      await queryClient.invalidateQueries({ queryKey: queryKeys.games.detail(game.id) })
      await queryClient.fetchQuery(territoriesQuery(game.id))
      void navigate({ to: '/games/$gameId', params: { gameId: game.id } })
    },
  })

  function submitCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    createMutation.mutate({ maxPlayers })
  }

  function handleJoin(game: GameSummaryDto) {
    joinMutation.mutate({ gameId: game.id, color: selectedColors[game.id] ?? colors[0] })
  }

  return (
    <main className="min-h-screen bg-stone-900 p-6 text-stone-100">
      <div className="mx-auto flex max-w-4xl flex-col gap-6">
        <h1 className="text-3xl font-semibold">Risk lobby</h1>

        <section className="rounded bg-stone-800 p-5">
          <h2 className="mb-3 text-xl">Opret et spil</h2>
          <form onSubmit={submitCreate} className="flex flex-wrap items-end gap-3">
            <label className="flex flex-col gap-1">
              <span className="text-sm text-stone-300">Antal spillere</span>
              <input
                type="number"
                min={2}
                max={6}
                value={maxPlayers}
                onChange={(event) => setMaxPlayers(Number(event.target.value))}
                className="w-24 rounded bg-stone-700 px-2 py-1"
              />
            </label>
            <ColorSelect value={color} onChange={setColor} />
            <button
              type="submit"
              disabled={createMutation.isPending}
              className="rounded bg-emerald-700 px-4 py-2 hover:bg-emerald-600 disabled:opacity-50"
            >
              Opret spil
            </button>
          </form>
          {createMutation.error && <ErrorText error={createMutation.error} />}
        </section>

        <section className="rounded bg-stone-800 p-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-xl">Tilgængelige spil</h2>
            <button
              type="button"
              onClick={() => void games.refetch()}
              className="rounded bg-stone-700 px-3 py-1 hover:bg-stone-600"
            >
              Opdater
            </button>
          </div>
          {games.isLoading && <p className="text-stone-300">Henter spil...</p>}
          {games.error && <ErrorText error={games.error} />}
          {games.data?.filter((game) => game.state === 'Lobby').length === 0 && (
            <p className="text-stone-300">Der er ingen åbne spil.</p>
          )}
          <div className="flex flex-col gap-3">
            {games.data
              ?.filter((game) => game.state === 'Lobby')
              .map((game) => (
                <GameRow
                  key={game.id}
                  game={game}
                  color={selectedColors[game.id] ?? colors[0]}
                  onColorChange={(value) =>
                    setSelectedColors((previous) => ({ ...previous, [game.id]: value }))
                  }
                  onJoin={() => handleJoin(game)}
                  onStart={
                    user?.id === game.hostId ? () => startMutation.mutate(game.id) : undefined
                  }
                  isJoining={joinMutation.isPending}
                  isStarting={startMutation.isPending}
                />
              ))}
          </div>
          {joinMutation.error && <ErrorText error={joinMutation.error} />}
          {startMutation.error && <ErrorText error={startMutation.error} />}
        </section>
      </div>
    </main>
  )
}

function GameRow({
  game,
  color,
  onColorChange,
  onJoin,
  onStart,
  isJoining,
  isStarting,
}: {
  game: GameSummaryDto
  color: string
  onColorChange: (value: string) => void
  onJoin: () => void
  onStart: (() => void) | undefined
  isJoining: boolean
  isStarting: boolean
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded bg-stone-700 p-3">
      <div>
        <p className="font-medium">Spil {game.id.slice(0, 8)}</p>
        <p className="text-sm text-stone-300">
          {game.playerCount}/{game.maxPlayers} spillere
        </p>
      </div>
      <div className="flex items-center gap-2">
        <ColorSelect value={color} onChange={onColorChange} />
        <button
          type="button"
          onClick={onJoin}
          disabled={isJoining || game.playerCount >= game.maxPlayers}
          className="rounded bg-blue-700 px-3 py-1 hover:bg-blue-600 disabled:opacity-50"
        >
          Join
        </button>
        {onStart && (
          <button
            type="button"
            onClick={onStart}
            disabled={isStarting}
            className="rounded bg-amber-700 px-3 py-1 hover:bg-amber-600 disabled:opacity-50"
          >
            Start
          </button>
        )}
        <Link
          to="/games/$gameId"
          params={{ gameId: game.id }}
          className="rounded bg-stone-600 px-3 py-1 hover:bg-stone-500"
        >
          Åbn
        </Link>
      </div>
    </div>
  )
}

function ColorSelect({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return (
    <label className="flex items-center gap-2">
      <span className="text-sm text-stone-300">Farve</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="rounded bg-stone-600 px-2 py-1"
      >
        {colors.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  )
}

function ErrorText({ error }: { error: Error }) {
  return <p className="mt-3 text-red-300">{error.message}</p>
}

export default App
