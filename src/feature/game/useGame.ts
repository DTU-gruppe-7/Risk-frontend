import { useMemo } from 'react'
import { useSuspenseQuery } from '@tanstack/react-query'
import { useAuth } from '../../auth/useAuth'
import { gameQuery, territoriesQuery } from './queries'
import { playerName } from './playerName'
import { useGameHub } from './useGameHub'
import type { Player, TerritoryState } from '../map/types'

const POLL_INTERVAL_MS = 2_000

/**
 * Everything a game page needs: the game, the board in UI shape, the current user's
 * player and the live connection status. The router loader has already fetched the game,
 * so data is always defined here.
 */
export function useGame(gameId: string) {
  const { user } = useAuth()
  const connectionStatus = useGameHub(gameId)
  // Without a live connection nothing is pushed to us, so poll to see the other players' moves.
  const refetchInterval = connectionStatus === 'connected' ? false : POLL_INTERVAL_MS

  const { data: game } = useSuspenseQuery({ ...gameQuery(gameId), refetchInterval })
  const { data: territories } = useSuspenseQuery({ ...territoriesQuery(gameId), refetchInterval })

  const board = useMemo(() => {
    const players: Player[] = game.players.map((player) => ({
      id: player.id,
      name: playerName(player),
      color: player.color,
    }))
    const territoryStates: TerritoryState[] = territories.map((territory) => ({
      stateId: territory.id,
      territoryId: territory.identifier,
      ownerId: territory.ownerId,
      units: territory.troopCount,
      visible: true,
      blizzard: territory.isBlizzard,
    }))
    return { territories: territoryStates, players }
  }, [game.players, territories])

  return {
    game,
    board,
    /** The current user's player. Undefined for a host who is not playing. */
    me: game.players.find((player) => player.userId === user?.id),
    connectionStatus,
  }
}
