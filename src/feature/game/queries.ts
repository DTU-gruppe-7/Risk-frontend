import { apiQuery } from '../../api/query/apiQuery'
import { queryKeys } from '../../api/query/queryKeys'
import type { GameDto } from './types'

export const gameQuery = (gameId: string) =>
  apiQuery<GameDto>(queryKeys.games.detail(gameId), `/api/games/${gameId}`)
