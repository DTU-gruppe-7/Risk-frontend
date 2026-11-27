import { describe, expect, it } from 'vitest'
import type { TerritoryInfo, TerritoryState } from '../map/types'
import {
  interactionFor,
  NO_SELECTION,
  resolveSelection,
  selectTerritory,
  turnModeOf,
} from './rules'
import type { GameDto, PendingConquestDto, PlayerDto } from './types'

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

/** The server's conquest that waits for troops to be moved in. The test board's state ids are the map ids. */
function conquest(fromTerritoryId: string, toTerritoryId: string): PendingConquestDto {
  return { fromTerritoryId, toTerritoryId, minTroops: 1, maxTroops: 2 }
}

describe('turnModeOf', () => {
  it('is waiting when it is not my turn, the game is not running, or I am not playing', () => {
    expect(turnModeOf(game({ currentPlayerId: ENEMY }), me, null)).toBe('waiting')
    expect(turnModeOf(game({ state: 'Lobby' }), me, null)).toBe('waiting')
    expect(turnModeOf(game(), undefined, null)).toBe('waiting')
  })

  it('follows the phase when it is my turn', () => {
    expect(turnModeOf(game({ currentPhase: 'Deployment' }), me, null)).toBe('deploy')
    expect(turnModeOf(game({ currentPhase: 'Attack' }), me, null)).toBe('attack')
    expect(turnModeOf(game({ currentPhase: 'Fortify' }), me, null)).toBe('fortify')
  })

  it('is conquest while the server waits for troops to be moved in', () => {
    expect(turnModeOf(game(), me, conquest('a', 'b'))).toBe('conquest')
  })

  it('is waiting during a conquest that is not mine', () => {
    expect(turnModeOf(game({ currentPlayerId: ENEMY }), me, conquest('a', 'b'))).toBe('waiting')
  })
})

describe('interactionFor', () => {
  it('offers nothing while waiting', () => {
    const interaction = interactionFor('waiting', [territory('a', ME, 5)], INFOS, ME, null)
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
    const interaction = interactionFor('attack', board, INFOS, ME, null)

    expect(interaction.sources).toEqual(['a'])
    expect(interaction.targetsOf('a')).toEqual(['b'])
  })

  it('never attacks into a blizzard', () => {
    const board = [territory('a', ME, 3), territory('b', ENEMY, 2, true), territory('e', ENEMY, 1)]
    const interaction = interactionFor('attack', board, INFOS, ME, null)

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
    const interaction = interactionFor('fortify', board, INFOS, ME, null)

    expect(interaction.targetsOf('a').sort()).toEqual(['b', 'c', 'e'])
  })

  it('does not fortify through an enemy territory', () => {
    const board = [territory('a', ME, 3), territory('b', ENEMY, 1), territory('c', ME, 1)]
    const interaction = interactionFor('fortify', board, INFOS, ME, null)

    expect(interaction.sources).toEqual([])
  })

  it('moves into the conquered territory the server names and picks it by itself', () => {
    const board = [territory('a', ME, 3), territory('b', ME, 0), territory('c', ENEMY, 2)]
    const interaction = interactionFor('conquest', board, INFOS, ME, conquest('a', 'b'))

    expect(interaction.autoSelect).toBe(true)
    expect(resolveSelection(NO_SELECTION, interaction)).toEqual({ sourceId: 'a', targetId: 'b' })
  })

  it('offers nothing for a conquest of territories that are not on the board', () => {
    const interaction = interactionFor(
      'conquest',
      [territory('a', ME, 3)],
      INFOS,
      ME,
      conquest('a', 'x'),
    )

    expect(interaction.sources).toEqual([])
  })
})

describe('selecting territories', () => {
  const board = [territory('a', ME, 3), territory('b', ENEMY, 2), territory('e', ME, 4)]
  const interaction = interactionFor('attack', board, INFOS, ME, null)

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
      null,
    )
    expect(resolveSelection({ sourceId: 'a', targetId: 'b' }, after)).toEqual(NO_SELECTION)
  })
})
