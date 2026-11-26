import { useEffect, useMemo, useState } from 'react'
import type { TerritoryState } from '../map/types'
import type { BattleRoundDto, PendingConquestDto } from './types'
import { useAttackRoll, type AttackRoll } from './useAttackRoll'

// How long each step of an attack roll lasts, in milliseconds. AttackDice draws the steps, and its
// animations (see index.css) are timed to match.
/** The dice tumble at least this long, also when the server answers at once. */
const MIN_ROLL_MS = 900
/** The dice lie still on their values before the pairs fight. */
const LANDED_MS = 700
/** The first pair fights; each further pair starts PAIR_DELAY_MS later. */
const CLASH_MS = 1300
export const PAIR_DELAY_MS = 350
/** The moment in a strike the winning die hits the losing one (see dice-strike in index.css). */
export const IMPACT_MS = 250
/** The dice fade away. */
export const LEAVE_MS = 500

/**
 * Where an attack roll is: the dice tumble, land, the pairs fight, and the dice fade away. 'done'
 * also covers having no roll to show.
 */
export type RollStep = 'rolling' | 'landed' | 'clash' | 'leaving' | 'done'

interface Progress {
  rollId: number | undefined
  hasRolledLongEnough: boolean
  /** The step once the dice have landed. */
  step: Exclude<RollStep, 'rolling'>
  /** How many pairs have fought so far; the losing die of each is broken. */
  struckPairs: number
}

const startOf = (rollId: number | undefined): Progress => ({
  rollId,
  hasRolledLongEnough: false,
  step: 'landed',
  struckPairs: 0,
})

/** Moves a roll on, ignoring a timer that is left over from an earlier roll. */
const advance = (progress: Progress, rollId: number, change: Partial<Progress>): Progress => ({
  ...(progress.rollId === rollId ? progress : startOf(rollId)),
  ...change,
})

/** Runs the steps of a roll on timers. A new roll starts from the beginning. */
function useRollProgress(roll: AttackRoll | undefined) {
  const rollId = roll && !roll.failed ? roll.id : undefined
  const [stored, setStored] = useState<Progress>(() => startOf(rollId))
  const progress = stored.rollId === rollId ? stored : startOf(rollId)

  useEffect(() => {
    if (rollId === undefined) return
    const timer = setTimeout(
      () => setStored((current) => advance(current, rollId, { hasRolledLongEnough: true })),
      MIN_ROLL_MS,
    )
    return () => clearTimeout(timer)
  }, [rollId])

  const round = roll?.round
  const isRolling = !progress.hasRolledLongEnough || round === undefined
  const pairs = round?.comparisons.length ?? 0

  useEffect(() => {
    if (rollId === undefined || isRolling) return
    const at = (ms: number, change: Partial<Progress>) =>
      setTimeout(() => setStored((current) => advance(current, rollId, change)), ms)
    const clashEnd = LANDED_MS + CLASH_MS + Math.max(0, pairs - 1) * PAIR_DELAY_MS
    const timers = [
      at(LANDED_MS, { step: 'clash' }),
      // The map follows each pair the moment the winning die hits.
      ...Array.from({ length: pairs }, (_, pair) =>
        at(LANDED_MS + pair * PAIR_DELAY_MS + IMPACT_MS, { struckPairs: pair + 1 }),
      ),
      at(clashEnd, { step: 'leaving' }),
      at(clashEnd + LEAVE_MS, { step: 'done' }),
    ]
    return () => timers.forEach(clearTimeout)
  }, [rollId, isRolling, pairs])

  const step: RollStep = rollId === undefined ? 'done' : isRolling ? 'rolling' : progress.step
  return { step, struckPairs: progress.struckPairs }
}

/** How a die did in a roll: it beat the die it was paired with, lost to it, or had no pair. */
export type DieOutcome = 'won' | 'lost' | 'unpaired'

export interface DuelDie {
  value: number
  outcome: DieOutcome
}

/** The dice that were not paired: every die, less one of each value the pairs used. */
function unpairedDice(dice: number[], paired: number[]) {
  const left = [...paired]
  return dice
    .filter((value) => {
      const index = left.indexOf(value)
      if (index === -1) return true
      left.splice(index, 1)
      return false
    })
    .sort((a, b) => b - a)
}

/**
 * Each side's dice as the server paired them, highest first, with who won each pair. The dice
 * without a pair come last.
 */
function duelOf(round: BattleRoundDto): { attacker: DuelDie[]; defender: DuelDie[] } {
  const { comparisons } = round
  const side = (dice: number[], paired: number[], winner: 'Attacker' | 'Defender'): DuelDie[] => [
    ...comparisons.map((pair, index) => ({
      value: paired[index],
      outcome: pair.winner === winner ? ('won' as const) : ('lost' as const),
    })),
    ...unpairedDice(dice, paired).map((value) => ({ value, outcome: 'unpaired' as const })),
  ]
  return {
    attacker: side(
      round.attackerDice,
      comparisons.map((pair) => pair.attackerDie),
      'Attacker',
    ),
    defender: side(
      round.defenderDice,
      comparisons.map((pair) => pair.defenderDie),
      'Defender',
    ),
  }
}

/** The dice that have been broken so far: each side loses a troop per broken die. */
const brokenDice = (dice: DuelDie[], struckPairs: number) =>
  dice.slice(0, struckPairs).filter((die) => die.outcome === 'lost').length

/**
 * The player's latest attack roll, and the board as it should look while the roll is shown.
 *
 * The server answers an attack at once, but its result must not show before the dice do. So until
 * the pairs have fought, the attacking and the attacked territory are shown as they were when the
 * player rolled, and lose a troop each time one of their dice is broken, and a conquest is held
 * back. The rest of the board is shown as the server sends it.
 */
export function useAttackReveal(
  gameId: string,
  territories: TerritoryState[],
  pendingConquest: PendingConquestDto | null,
) {
  const roll = useAttackRoll(gameId)
  const { step, struckPairs } = useRollProgress(roll)
  const duel = roll?.round && duelOf(roll.round)
  /** True until the dice have fought, so nothing may show the result yet. */
  const isHidingResult = step === 'rolling' || step === 'landed' || step === 'clash'

  const attackerLosses = duel ? brokenDice(duel.attacker, struckPairs) : 0
  const defenderLosses = duel ? brokenDice(duel.defender, struckPairs) : 0
  const from = roll?.from
  const to = roll?.to
  const shownTerritories = useMemo(() => {
    if (!isHidingResult || !from || !to) return territories
    const lose = (territory: TerritoryState, losses: number) => ({
      ...territory,
      units: Math.max(0, territory.units - losses),
    })
    return territories.map((territory) => {
      if (territory.stateId === from.stateId) return lose(from, attackerLosses)
      if (territory.stateId === to.stateId) return lose(to, defenderLosses)
      return territory
    })
  }, [territories, isHidingResult, from, to, attackerLosses, defenderLosses])

  return {
    roll,
    duel,
    step,
    isHidingResult,
    territories: shownTerritories,
    // A conquest is part of the result too, so the player is not asked to move in before the
    // dice have shown the territory fall.
    pendingConquest: isHidingResult ? null : pendingConquest,
  }
}

export type AttackReveal = ReturnType<typeof useAttackReveal>
