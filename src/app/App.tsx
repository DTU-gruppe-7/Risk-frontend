import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { queryKeys } from '../api/query/queryKeys'
import { useAuth } from '../auth/useAuth'
import { createGame, joinGame, startGame } from '../feature/game/mutations'
import { gamesQuery, territoriesQuery } from '../feature/game/queries'
import CreateGamePanel, { type CreateGameInput } from '../feature/lobby/CreateGamePanel'
import MapBackdrop from '../feature/lobby/MapBackdrop'
import OpenGamesPanel from '../feature/lobby/OpenGamesPanel'

/** The lobby: the board blurred in the background, with panels to create, join and start games. */
function App() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { user } = useAuth()
  const games = useQuery(gamesQuery())

  const openGames = games.data?.filter((game) => game.state === 'Lobby') ?? []

  const joinMutation = useMutation({
    mutationFn: ({ gameId, color }: { gameId: string; color: string }) =>
      joinGame(gameId, { color }),
    onSuccess: async (_, variables) => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.games.all() })
      void navigate({ to: '/games/$gameId', params: { gameId: variables.gameId } })
    },
  })

  const createMutation = useMutation({
    mutationFn: async ({ request, color }: CreateGameInput) => {
      const game = await createGame(request)
      await joinGame(game.id, { color })
      return game
    },
    onSuccess: async (game) => {
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

  return (
    <div className="relative min-h-screen text-stone-100">
      <MapBackdrop />

      <main className="relative mx-auto flex max-w-6xl flex-col gap-8 px-4 py-10 sm:px-6 lg:py-16">
        <header className="text-center">
          <p className="text-xs font-semibold tracking-[0.35em] text-amber-300/80 uppercase">
            Verdensherredømme venter
          </p>
          <h1 className="mt-2 font-serif text-6xl font-bold tracking-[0.15em] text-amber-50 drop-shadow-[0_4px_24px_rgb(0_0_0/0.8)] sm:text-7xl">
            RISK
          </h1>
          {user && (
            <p className="mt-3 text-stone-300">
              Velkommen, <span className="font-medium text-amber-100">{user.userName}</span>
            </p>
          )}
        </header>
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

        <section className="rounded bg-stone-800 p-5">
          <h2 className="mb-3 text-xl">Igangværende spil</h2>
          {games.data?.filter((game) => game.state === 'InProgress').length === 0 && (
            <p className="text-stone-300">Der er ingen igangværende spil.</p>
          )}
          <div className="flex flex-col gap-3">
            {games.data
              ?.filter((game) => game.state === 'InProgress')
              .map((game) => (
                <div
                  key={game.id}
                  className="flex items-center justify-between rounded bg-stone-700 p-3"
                >
                  <p className="font-medium">
                    Spil {game.id.slice(0, 8)} ({game.playerCount} spillere)
                  </p>
                  <Link
                    to="/games/$gameId"
                    params={{ gameId: game.id }}
                    className="rounded bg-stone-600 px-3 py-1 hover:bg-stone-500"
                  >
                    Fortsæt
                  </Link>
                </div>
              ))}
          </div>
        </section>
      </div>
    </main>
  )
}

        <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,26rem)_minmax(0,1fr)]">
          <CreateGamePanel
            onCreate={(input) => createMutation.mutate(input)}
            isPending={createMutation.isPending}
            error={createMutation.error}
          />
          <OpenGamesPanel
            games={openGames}
            isLoading={games.isLoading}
            isRefreshing={games.isFetching && !games.isLoading}
            loadError={games.error}
            actionError={joinMutation.error ?? startMutation.error}
            currentUserId={user?.id}
            onRefresh={() => void games.refetch()}
            onJoin={(game, color) => joinMutation.mutate({ gameId: game.id, color })}
            onStart={(game) => startMutation.mutate(game.id)}
            isJoining={joinMutation.isPending}
            isStarting={startMutation.isPending}
          />
        </div>
      </main>
    </div>
  )
}

export default App
