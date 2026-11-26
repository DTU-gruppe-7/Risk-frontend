import { useMutation, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '../../api/query/queryKeys'
import {
  attack,
  blitz,
  completeConquest,
  deployTroops,
  endPhase,
  fortify,
  startGame,
  tradeCards,
} from './mutations'
import type { BattleRoundDto, GamePhase } from './types'
import type { TerritoryState } from '../map/types'

/** The outcome of an attack, in the same shape for a single roll and a blitz. */
export interface BattleReport {
  rounds: BattleRoundDto[]
  conquered: boolean
}

interface Move {
  from: TerritoryState
  to: TerritoryState
}

/** An attack: one roll with the given number of dice, or a blitz when dice is left out. */
export type BattleVariables = Move & { dice?: number }

/**
 * Refetches everything an action in the game can change. Run after every action, also a
 * failed one: a rejected action usually means our copy of the game is out of date.
 */
function useRefreshGame(gameId: string) {
  const queryClient = useQueryClient()
  return () =>
    Promise.all(
      [
        queryKeys.games.detail(gameId),
        queryKeys.games.territories(gameId),
        queryKeys.games.hand(gameId),
      ].map((queryKey) => queryClient.invalidateQueries({ queryKey })),
    )
}

/** The moves a player can make during their turn. */
export function useGameActions(gameId: string) {
  const onSettled = useRefreshGame(gameId)

  return {
    deploy: useMutation({
      mutationFn: ({ territory, troops }: { territory: TerritoryState; troops: number }) =>
        deployTroops(gameId, territory.stateId, { troops }),
      onSettled,
    }),

    /** One roll with the given number of dice, or a blitz when dice is left out. */
    battle: useMutation({
      mutationKey: queryKeys.games.battle(gameId),
      mutationFn: async ({ from, to, dice }: BattleVariables): Promise<BattleReport> => {
        const territories = { fromTerritoryId: from.stateId, toTerritoryId: to.stateId }
        if (dice === undefined) {
          const result = await blitz(gameId, territories)
          return { rounds: result.rounds, conquered: result.territoryConquered }
        }
        // The server decides how many dice the defender rolls.
        const result = await attack(gameId, { ...territories, attackingTroopsCount: dice })
        return { rounds: [result], conquered: result.territoryConquered }
      },
      onSettled,
    }),

    completeConquest: useMutation({
      mutationFn: ({ from, to, troops }: Move & { troops: number }) =>
        completeConquest(gameId, {
          fromTerritoryId: from.stateId,
          toTerritoryId: to.stateId,
          movingTroopsCount: troops,
        }),
      onSettled,
    }),

    fortify: useMutation({
      mutationFn: ({ from, to, troops }: Move & { troops: number }) =>
        fortify(gameId, { fromTerritoryId: from.stateId, toTerritoryId: to.stateId, troops }),
      onSettled,
    }),

    endPhase: useMutation({
      mutationFn: (nextPhase: GamePhase) => endPhase(gameId, nextPhase),
      onSettled,
    }),
  }
}

export type GameActions = ReturnType<typeof useGameActions>

export function useTradeCards(gameId: string) {
  return useMutation({
    mutationFn: (cardIds: string[]) => tradeCards(gameId, { cardIds }),
    onSettled: useRefreshGame(gameId),
  })
}

export function useStartGame(gameId: string) {
  return useMutation({
    mutationFn: () => startGame(gameId),
    onSettled: useRefreshGame(gameId),
  })
}
