import { useMemo } from 'react'
import { useSuspenseQuery } from '@tanstack/react-query'
import { gameQuery, territoriesQuery } from './queries'
import { useGameHub } from './useGameHub'
import type { Player, TerritoryState } from '../map/types'

/**
 * Everything a game page needs: the game, the voard in UI shape and the live
 * connection status. The router loader has already fetched the game, so data
 * is always defined here.
 */
export function useGame(gameId: string) {
  const connectionStatus = useGameHub(gameId)
  const { data: game } = useSuspenseQuery(gameQuery(gameId))
  const { data: territories } = useSuspenseQuery(territoriesQuery(gameId))

  const board = useMemo(() => {
    const players: Player[] = game.players.map((player) => ({
      id: player.id,
      name: player.userId,
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
    connectionStatus,
  }
}
