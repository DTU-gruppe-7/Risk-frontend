import { useSuspenseQuery } from '@tanstack/react-query'
import { mockPlayers, mockTerritoryStates } from '../map/mock'
import { gameQuery } from './queries'
import { useGameHub } from './useGameHub'

/**
 * Everything a game page needs: the game, the voard in UI shape and the live
 * connection status. The router loader has already fetched the game, so data
 * is always defined here.
 */
export function useGame(gameId: string) {
  const connectionStatus = useGameHub(gameId)
  const { data: game } = useSuspenseQuery(gameQuery(gameId))

  // TODO: map GameDto til board-format, når API'et returnerer territorier og spillere.
  const board = { territories: mockTerritoryStates, players: mockPlayers }

  return {
    game,
    board,
    connectionStatus,
  }
}
