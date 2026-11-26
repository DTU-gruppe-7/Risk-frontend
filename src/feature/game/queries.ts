import { queryOptions } from '@tanstack/react-query'
import { api } from '../../api/client'
import { apiQuery } from '../../api/query/apiQuery'
import { queryKeys } from '../../api/query/queryKeys'
import type {
  BonusCardDto,
  CardTradeRulesResponse,
  GameDto,
  GameSummaryDto,
  MissionCardDto,
  TerritoryDto,
  TradeCardsRequest,
  TradePreviewResponse,
} from './types'

export const gameQuery = (gameId: string) =>
  apiQuery<GameDto>(queryKeys.games.detail(gameId), `/api/games/${gameId}`)

export const gamesQuery = () => apiQuery<GameSummaryDto[]>(queryKeys.games.list(), '/api/games')

export const territoriesQuery = (gameId: string) =>
  apiQuery<TerritoryDto[]>(queryKeys.games.territories(gameId), `/api/games/${gameId}/territories`)

/** The current user's own bonus cards, as the server has them. A host who is not playing has none. */
export const handQuery = (gameId: string) =>
  apiQuery<BonusCardDto[]>(queryKeys.games.hand(gameId), `/api/games/${gameId}/bonus-cards`)

/**
 * What trading the cards would give, without trading them. The order of the cards decides which
 * of them gives the bonus for a territory the player holds, as in a real trade.
 */
export const tradePreviewQuery = (gameId: string, cardIds: string[]) =>
  queryOptions({
    queryKey: queryKeys.games.tradePreview(gameId, cardIds),
    queryFn: ({ signal }) =>
      api.post<TradePreviewResponse, TradeCardsRequest>(
        `/api/games/${gameId}/bonus-cards/trade-in/preview`,
        { cardIds },
        { signal },
      ),
  })

/** The card trade rules, the same for every game. They never change while the server runs. */
export const cardTradeRulesQuery = () => ({
  ...apiQuery<CardTradeRulesResponse>(queryKeys.rules.cardTrades(), '/api/rules/card-trades'),
  staleTime: Infinity,
})

/** The current user's own secret missions. The backend never returns other players' missions. */
export const missionsQuery = (gameId: string) =>
  apiQuery<MissionCardDto[]>(queryKeys.games.missions(gameId), `/api/games/${gameId}/mission-cards`)
