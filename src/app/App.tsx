import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { queryKeys } from '../api/query/queryKeys'
import { useAuth } from '../auth/useAuth'
import { createGame, joinGame, leaveGame, startGame } from '../feature/game/mutations'
import { gamesQuery, territoriesQuery } from '../feature/game/queries'
import CreateGamePanel from '../feature/lobby/CreateGamePanel'
import InProgressGamesPanel from '../feature/lobby/InProgressGamesPanel'
import MapBackdrop from '../feature/lobby/MapBackdrop'
import OpenGamesPanel from '../feature/lobby/OpenGamesPanel'

const LOBBY_POLL_INTERVAL_MS = 5000

/** The lobby: the board blurred in the background, with panels to create, join and start games. */
function App() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { user } = useAuth()
  // Poll so games others create, join or start show up without pressing "Opdater".
  // TanStack Query pauses the polling while the tab is in the background.
  const games = useQuery({ ...gamesQuery(), refetchInterval: LOBBY_POLL_INTERVAL_MS })

  const openGames = games.data?.filter((game) => game.state === 'Lobby') ?? []
  // Only started games the user plays in, so "Fortsæt" always leads somewhere they belong.
  const myInProgressGames =
    games.data?.filter(
      (game) =>
        game.state === 'InProgress' && game.players.some((player) => player.userId === user?.id),
    ) ?? []

  const joinMutation = useMutation({
    mutationFn: ({ gameId, color }: { gameId: string; color: string }) =>
      joinGame(gameId, { color }),
    onSuccess: async (_, variables) => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.games.all() })
      void navigate({ to: '/games/$gameId', params: { gameId: variables.gameId } })
    },
  })

  // One request: the backend creates the game and joins the host with their color together.
  const createMutation = useMutation({
    mutationFn: createGame,
    onSuccess: async (game) => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.games.all() })
      void navigate({ to: '/games/$gameId', params: { gameId: game.id } })
    },
  })

  const leaveMutation = useMutation({
    mutationFn: ({ gameId, playerId }: { gameId: string; playerId: string }) =>
      leaveGame(gameId, playerId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.games.all() }),
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

        <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,26rem)_minmax(0,1fr)]">
          <CreateGamePanel
            onCreate={(request) => createMutation.mutate(request)}
            isPending={createMutation.isPending}
            error={createMutation.error}
          />
          <div className="flex flex-col gap-6">
            <OpenGamesPanel
              games={openGames}
              isLoading={games.isLoading}
              isRefreshing={games.isFetching && !games.isLoading}
              loadError={games.error}
              actionError={joinMutation.error ?? leaveMutation.error ?? startMutation.error}
              currentUserId={user?.id}
              onRefresh={() => void games.refetch()}
              onJoin={(game, color) => joinMutation.mutate({ gameId: game.id, color })}
              onLeave={(game, playerId) => leaveMutation.mutate({ gameId: game.id, playerId })}
              onStart={(game) => startMutation.mutate(game.id)}
              isJoining={joinMutation.isPending}
              isLeaving={leaveMutation.isPending}
              isStarting={startMutation.isPending}
            />
            {!games.isLoading && !games.error && <InProgressGamesPanel games={myInProgressGames} />}
          </div>
        </div>
      </main>
    </div>
  )
}

export default App
