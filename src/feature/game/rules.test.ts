import { describe, expect, it } from 'vitest'
import type { TerritoryInfo, TerritoryState } from '../map/types'
import {
  interactionFor,
  isValidCardSet,
  NO_SELECTION,
  progressiveTradeValue,
  resolveSelection,
  selectTerritory,
  tradeValueOf,
  turnModeOf,
} from './rules'
import type { BonusCardDto, BonusCardType, GameDto, PlayerDto } from './types'

const ME = 'me'
const ENEMY = 'enemy'
const me = { id: ME } as PlayerDto

// A small board: a - b - c - d in a row, and e next to a.
const INFOS: TerritoryInfo[] = [
  { id: 'a', continent: 'europe', adjacent: ['b', 'e'] },
  { id: 'b', continent: 'europe', adjacent: ['a', 'c'] },
  { id: 'c', continent: 'europe', adjacent: ['b', 'd'] },
  { id: 'd', continent: 'europe', adjacent: ['c'] },
  { id: 'e', continent: 'europe', adjacent: ['a'] },
]

function territory(
  territoryId: string,
  ownerId: string,
  units: number,
  blizzard = false,
): TerritoryState {
  return { stateId: territoryId, territoryId, ownerId, units, visible: true, blizzard }
}

function game(overrides: Partial<GameDto> = {}): GameDto {
  return {
    state: 'InProgress',
    currentPlayerId: ME,
    currentPhase: 'Attack',
    ...overrides,
  } as GameDto
}

function cards(...types: BonusCardType[]): BonusCardDto[] {
  return types.map((type, index) => ({
    id: String(index),
    playerId: ME,
    type,
    territoryIdentifier: null,
    used: false,
  }))
}

describe('turnModeOf', () => {
  const board = [territory('a', ME, 3), territory('b', ENEMY, 2)]

  it('is waiting when it is not my turn, the game is not running, or I am not playing', () => {
    expect(turnModeOf(game({ currentPlayerId: ENEMY }), me, board)).toBe('waiting')
    expect(turnModeOf(game({ state: 'Lobby' }), me, board)).toBe('waiting')
    expect(turnModeOf(game(), undefined, board)).toBe('waiting')
  })

  it('follows the phase when it is my turn', () => {
    expect(turnModeOf(game({ currentPhase: 'Deployment' }), me, board)).toBe('deploy')
    expect(turnModeOf(game({ currentPhase: 'Attack' }), me, board)).toBe('attack')
    expect(turnModeOf(game({ currentPhase: 'Fortify' }), me, board)).toBe('fortify')
  })

  it('is conquest while a conquered territory has no troops yet', () => {
    expect(turnModeOf(game(), me, [...board, territory('c', ME, 0)])).toBe('conquest')
  })

  it('does not count a blizzard as a conquered territory', () => {
    expect(turnModeOf(game(), me, [...board, territory('c', ENEMY, 0, true)])).toBe('attack')
  })
})

describe('interactionFor', () => {
  it('offers nothing while waiting', () => {
    const interaction = interactionFor('waiting', [territory('a', ME, 5)], INFOS, ME)
    expect(interaction.sources).toEqual([])
  })

  it('attacks from my territories with at least two troops into enemy neighbours', () => {
    const board = [
      territory('a', ME, 3),
      territory('b', ENEMY, 2),
      territory('c', ME, 1), // one troop must stay behind, so it cannot attack
      territory('d', ENEMY, 1),
      territory('e', ME, 2), // only borders my own territory
    ]
    const interaction = interactionFor('attack', board, INFOS, ME)

    expect(interaction.sources).toEqual(['a'])
    expect(interaction.targetsOf('a')).toEqual(['b'])
  })

  it('never attacks into a blizzard', () => {
    const board = [territory('a', ME, 3), territory('b', ENEMY, 2, true), territory('e', ENEMY, 1)]
    const interaction = interactionFor('attack', board, INFOS, ME)

    expect(interaction.targetsOf('a')).toEqual(['e'])
  })

  it('fortifies to every territory connected through my own territories', () => {
    const board = [
      territory('a', ME, 3),
      territory('b', ME, 1),
      territory('c', ME, 1),
      territory('d', ENEMY, 1),
      territory('e', ME, 1),
    ]
    const interaction = interactionFor('fortify', board, INFOS, ME)

    expect(interaction.targetsOf('a').sort()).toEqual(['b', 'c', 'e'])
  })

  it('does not fortify through an enemy territory', () => {
    const board = [territory('a', ME, 3), territory('b', ENEMY, 1), territory('c', ME, 1)]
    const interaction = interactionFor('fortify', board, INFOS, ME)

    expect(interaction.sources).toEqual([])
  })

  it('moves into a conquered territory and picks the only choice by itself', () => {
    const board = [territory('a', ME, 3), territory('b', ME, 0), territory('c', ENEMY, 2)]
    const interaction = interactionFor('conquest', board, INFOS, ME)

    expect(interaction.autoSelect).toBe(true)
    expect(resolveSelection(NO_SELECTION, interaction)).toEqual({ sourceId: 'a', targetId: 'b' })
  })
})

describe('selecting territories', () => {
  const board = [territory('a', ME, 3), territory('b', ENEMY, 2), territory('e', ME, 4)]
  const interaction = interactionFor('attack', board, INFOS, ME)

  it('picks a source, then a target', () => {
    const withSource = selectTerritory(NO_SELECTION, 'a', interaction)
    expect(withSource).toEqual({ sourceId: 'a', targetId: null })
    expect(selectTerritory(withSource, 'b', interaction)).toEqual({ sourceId: 'a', targetId: 'b' })
  })

  it('clears the selection when the source is clicked again or the click is not allowed', () => {
    const withSource = { sourceId: 'a', targetId: null }
    expect(selectTerritory(withSource, 'a', interaction)).toEqual(NO_SELECTION)
    expect(selectTerritory(NO_SELECTION, 'b', interaction)).toEqual(NO_SELECTION)
  })

  it('drops a selection that the board no longer allows', () => {
    // The attacker lost troops, so 'a' can no longer attack.
    const after = interactionFor(
      'attack',
      [territory('a', ME, 1), territory('b', ENEMY, 2)],
      INFOS,
      ME,
    )
    expect(resolveSelection({ sourceId: 'a', targetId: 'b' }, after)).toEqual(NO_SELECTION)
  })
})

describe('card sets', () => {
  it('accepts three alike, three different or a set with a wild card', () => {
    expect(isValidCardSet(cards('Infantry', 'Infantry', 'Infantry'))).toBe(true)
    expect(isValidCardSet(cards('Infantry', 'Cavalry', 'Artillery'))).toBe(true)
    expect(isValidCardSet(cards('Infantry', 'Infantry', 'Wild'))).toBe(true)
  })

  it('rejects two alike and one different, and sets that are not three cards', () => {
    expect(isValidCardSet(cards('Infantry', 'Infantry', 'Cavalry'))).toBe(false)
    expect(isValidCardSet(cards('Infantry', 'Infantry'))).toBe(false)
  })

  it('gives the classic fixed values, whatever the order of the cards', () => {
    expect(tradeValueOf(cards('Infantry', 'Infantry', 'Infantry'))).toBe(4)
    expect(tradeValueOf(cards('Cavalry', 'Cavalry', 'Cavalry'))).toBe(6)
    expect(tradeValueOf(cards('Artillery', 'Artillery', 'Artillery'))).toBe(8)
    expect(tradeValueOf(cards('Artillery', 'Infantry', 'Cavalry'))).toBe(10)
  })

  it('leaves the value to the backend for wild cards and invalid sets', () => {
    expect(tradeValueOf(cards('Infantry', 'Infantry', 'Wild'))).toBeNull()
    expect(tradeValueOf(cards('Infantry', 'Infantry', 'Cavalry'))).toBeNull()
  })

  it('rises 4, 6, 8, 10, 12, 15 and then by 5 under the progressive bonus', () => {
    expect([0, 1, 2, 3, 4, 5, 6, 7].map(progressiveTradeValue)).toEqual([
      4, 6, 8, 10, 12, 15, 20, 25,
    ])
  })
})
