import { apiQuery } from '../../api/query/apiQuery'
import { queryKeys } from '../../api/query/queryKeys'
import type { BonusCardDto, GameDto, GameSummaryDto, MissionCardDto, TerritoryDto } from './types'

export const gameQuery = (gameId: string) =>
  apiQuery<GameDto>(queryKeys.games.detail(gameId), `/api/games/${gameId}`)

export const gamesQuery = () => apiQuery<GameSummaryDto[]>(queryKeys.games.list(), '/api/games')

export const territoriesQuery = (gameId: string) =>
  apiQuery<TerritoryDto[]>(queryKeys.games.territories(gameId), `/api/games/${gameId}/territories`)

/** The bonus cards a player holds. Cards that have been traded in are not included. */
export const handQuery = (gameId: string, playerId: string) =>
  apiQuery<BonusCardDto[]>(queryKeys.games.hand(gameId), `/api/games/${gameId}/bonus-cards`, {
    query: { playerId },
  })

/** The current user's own secret missions. The backend never returns other players' missions. */
export const missionsQuery = (gameId: string) =>
  apiQuery<MissionCardDto[]>(queryKeys.games.missions(gameId), `/api/games/${gameId}/mission-cards`)
