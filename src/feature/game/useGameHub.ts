import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../../auth/useAuth'
import { gameHub } from '../../realtime/gameHub'
import { useHubGroup } from '../../realtime/useHubGroup'
import { gameQuery, territoriesQuery } from './queries'

/**
 * Connects to the game hub, watches the game and writes pushed updates into
 * the TanStack cache. Returns the connection status.
 *
 * The server sends the current state on every join (also after a reconnect), and
 * after that the new state on every change, already filtered for fog of war.
 */
export function useGameHub(gameId: string) {
  const queryClient = useQueryClient()
  const { isAuthenticated } = useAuth()

  // Every component using gameQuery(gameId) or territoriesQuery(gameId) re-renders automatically.
  useEffect(() => {
    return gameHub.on('GameUpdated', ({ game, territories }) => {
      // Ignore updates older than what we already have. Game and territories come from
      // the same snapshot, so the game's version covers both.
      const current = queryClient.getQueryData(gameQuery(game.id).queryKey)
      if (current && current.version >= game.version) return

      queryClient.setQueryData(gameQuery(game.id).queryKey, game)
      queryClient.setQueryData(territoriesQuery(game.id).queryKey, territories)
    })
  }, [queryClient])

  return useHubGroup(gameHub, {
    key: gameId,
    enabled: isAuthenticated,
    join: () => gameHub.invoke('JoinGame', gameId),
    leave: () => gameHub.invoke('LeaveGame', gameId),
  })
}
