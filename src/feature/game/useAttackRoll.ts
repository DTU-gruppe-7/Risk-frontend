import { useMutationState } from '@tanstack/react-query'
import { useState } from 'react'
import { queryKeys } from '../../api/query/queryKeys'
import type { TerritoryState } from '../map/types'
import type { BattleRoundDto } from './types'
import type { BattleReport, BattleVariables } from './useGameActions'

/** A single attack roll (not a blitz), from the moment the player rolls until the server answers. */
export interface AttackRoll {
  id: number
  /** The attacking and the attacked territory as they were when the player rolled. */
  from: TerritoryState
  to: TerritoryState
  attackerDiceCount: number
  /** The server decides the defender's dice, so their number is only known once it has answered. */
  defenderDiceCount: number | undefined
  /** The dice the server rolled; undefined while the roll is on its way. */
  round: BattleRoundDto | undefined
  failed: boolean
}

/**
 * The player's latest attack roll in this game, so it can be shown on the map while the attack
 * itself is made from the side bar (see useGameActions). Undefined when the latest attack was a
 * blitz, and for attacks made before the page was opened, so an old roll is not shown again.
 */
export function useAttackRoll(gameId: string): AttackRoll | undefined {
  const [openedAt] = useState(() => Date.now())
  const attacks = useMutationState({
    filters: { mutationKey: queryKeys.games.battle(gameId), exact: true },
    select: (mutation) => ({
      id: mutation.mutationId,
      submittedAt: mutation.state.submittedAt,
      status: mutation.state.status,
      variables: mutation.state.variables as BattleVariables | undefined,
      report: mutation.state.data as BattleReport | undefined,
    }),
  })

  const latest = attacks.at(-1)
  const dice = latest?.variables?.dice
  if (!latest?.variables || dice === undefined || latest.submittedAt < openedAt) return undefined

  const round = latest.report?.rounds[0]
  return {
    id: latest.id,
    from: latest.variables.from,
    to: latest.variables.to,
    attackerDiceCount: dice,
    defenderDiceCount: round?.defenderDice.length,
    round,
    failed: latest.status === 'error',
  }
}
