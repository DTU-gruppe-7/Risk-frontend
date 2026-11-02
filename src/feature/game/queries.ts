import { apiQuery } from '../../api/query/apiQuery'
import { queryKeys } from '../../api/query/queryKeys'
import type { GameDto, GameSummaryDto, TerritoryDto } from './types'

export const gameQuery = (gameId: string) =>
  apiQuery<GameDto>(queryKeys.games.detail(gameId), `/api/games/${gameId}`)

export const gamesQuery = () => apiQuery<GameSummaryDto[]>(queryKeys.games.list(), '/api/games')

export const territoriesQuery = (gameId: string) =>
  apiQuery<TerritoryDto[]>(queryKeys.games.territories(gameId), `/api/games/${gameId}/territories`)
