import { apiQuery } from '../../api/query/apiQuery'
import { queryKeys } from '../../api/query/queryKeys'
import type { BonusCardDto, GameDto, GameSummaryDto, MissionCardDto, TerritoryDto } from './types'

export const gameQuery = (gameId: string) =>
  apiQuery<GameDto>(queryKeys.games.detail(gameId), `/api/games/${gameId}`)

export const gamesQuery = () => apiQuery<GameSummaryDto[]>(queryKeys.games.list(), '/api/games')

export const territoriesQuery = (gameId: string) =>
  apiQuery<TerritoryDto[]>(queryKeys.games.territories(gameId), `/api/games/${gameId}/territories`)

/** Cards that have been traded in are still sent by the backend, but are no longer in the hand. */
const withoutUsedCards = (cards: BonusCardDto[]) => cards.filter((card) => !card.used)

/** The bonus cards a player holds. Cards that have been traded in are left out. */
export const handQuery = (gameId: string, playerId: string) => ({
  ...apiQuery<BonusCardDto[]>(queryKeys.games.hand(gameId), `/api/games/${gameId}/bonus-cards`, {
    query: { playerId },
  }),
  // A function that stays the same, so TanStack only filters again when the hand changes.
  select: withoutUsedCards,
})

/** The current user's own secret missions. The backend never returns other players' missions. */
export const missionsQuery = (gameId: string) =>
  apiQuery<MissionCardDto[]>(queryKeys.games.missions(gameId), `/api/games/${gameId}/mission-cards`)
