import { useEffect, useRef } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../../auth/useAuth'
import { gameHub } from '../../realtime/gameHub'
import { acquireHub } from '../../realtime/hubLease'
import { useHubStatus } from '../../realtime/useHubStatus'
import { gameQuery } from './queries'

/**
 * Connects to the game hub, joins the game's group and writes pushed
 * updates into the TanStack cache. Returns the connection status.
 */
export function useGameHub(gameId: string) {
  const queryClient = useQueryClient()
  const { isAuthenticated } = useAuth()
  const status = useHubStatus(gameHub)
  const hasJoined = useRef(false)

  // Keep the connection open while this component is mounted and the user is logged in.
  useEffect(() => {
    if (!isAuthenticated) return
    return acquireHub(gameHub)
  }, [isAuthenticated])

  // Write pushed game state into the cache. Every component using
  // gameQuery(gameId) re-renders automatically
  useEffect(() => {
    return gameHub.on('GameUpdated', (game) => {
      queryClient.setQueryData(gameQuery(game.id).queryKey, (current) =>
        // Ignore updates older than what we already have.
        current && current.version >= game.version ? current : game,
      )
    })
  }, [queryClient])

  // Join the game's group whenever we are connected. A reconnect creates a new
  // connection on the server, which is not in any groups, so we must join again.
  useEffect(() => {
    if (status !== 'connected') return

    gameHub
      .invoke('JoinGame', gameId)
      .then(() => {
        // After a reconnect we may have missed updates while offline: refetch.
        if (hasJoined.current) {
          void queryClient.invalidateQueries({ queryKey: gameQuery(gameId).queryKey })
        }
        hasJoined.current = true
      })
      .catch((error: unknown) => console.error(`Failed to join game ${gameId}`, error))

    return () => {
      gameHub.invoke('LeaveGame', gameId).catch(() => {
        // Ignored: the connection may already be closed, which also leaves the group
      })
    }
  }, [status, gameId, queryClient])

  return status
}
