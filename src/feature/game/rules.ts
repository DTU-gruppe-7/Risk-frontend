import type { PlayerId, TerritoryId, TerritoryInfo, TerritoryState } from '../map/types'
import type { BonusCardDto, GameDto, PlayerDto } from './types'

// Client-side copies of the game rules, used only to guide the player: what can be clicked and
// which buttons are enabled. The backend validates every action and is the authority.

/** What the current user can do right now. 'waiting' covers everything that is not their move. */
export type TurnMode = 'waiting' | 'deploy' | 'attack' | 'conquest' | 'fortify'

export const MAX_ATTACK_DICE = 3
export const MAX_DEFENSE_DICE = 2
export const CARDS_PER_TRADE = 3
/** A player holding this many cards must trade before deploying or moving on. */
export const FORCED_TRADE_HAND_SIZE = 5

export function turnModeOf(
  game: GameDto,
  me: PlayerDto | undefined,
  territories: TerritoryState[],
): TurnMode {
  if (game.state !== 'InProgress' || !me || game.currentPlayerId !== me.id) return 'waiting'

  switch (game.currentPhase) {
    case 'Deployment':
      return 'deploy'
    case 'Attack':
      return findPendingConquest(territories) ? 'conquest' : 'attack'
    case 'Fortify':
      return 'fortify'
  }
}

/** A conquered territory holds no troops until the attacker has moved some in. */
export function findPendingConquest(territories: TerritoryState[]) {
  return territories.find((territory) => !territory.blizzard && territory.units === 0)
}

/** Which territories can be picked in a mode: first a source, then one of its targets. */
export interface Interaction {
  sources: TerritoryId[]
  targetsOf: (sourceId: TerritoryId) => TerritoryId[]
  /** Pick a source or target without a click when there is only one choice. */
  autoSelect: boolean
}

const NO_INTERACTION: Interaction = { sources: [], targetsOf: () => [], autoSelect: false }

export function interactionFor(
  mode: TurnMode,
  territories: TerritoryState[],
  infos: TerritoryInfo[],
  playerId: PlayerId | undefined,
): Interaction {
  if (mode === 'waiting' || !playerId) return NO_INTERACTION

  const stateById = new Map(territories.map((territory) => [territory.territoryId, territory]))
  const adjacentById = new Map(infos.map((info) => [info.id, info.adjacent]))

  // A territory without state is hidden by fog of war, and a blizzard is never part of play.
  const isPlayable = (id: TerritoryId) => stateById.get(id)?.blizzard === false
  const isMine = (id: TerritoryId) => isPlayable(id) && stateById.get(id)?.ownerId === playerId
  // One troop always stays behind, so moving out takes at least two.
  const canMoveFrom = (id: TerritoryId) => isMine(id) && (stateById.get(id)?.units ?? 0) >= 2
  const neighborsOf = (id: TerritoryId) => (adjacentById.get(id) ?? []).filter(isPlayable)
  const mine = territories.map((territory) => territory.territoryId).filter(isMine)

  function withTargets(targetsOf: Interaction['targetsOf'], autoSelect = false): Interaction {
    const sources = mine.filter((id) => canMoveFrom(id) && targetsOf(id).length > 0)
    return { sources, targetsOf, autoSelect }
  }

  /** Every territory connected to sourceId through the player's own territories. */
  function reachableFrom(sourceId: TerritoryId) {
    const reached = new Set([sourceId])
    const queue = [sourceId]
    for (let id = queue.shift(); id !== undefined; id = queue.shift()) {
      for (const neighbor of neighborsOf(id)) {
        if (isMine(neighbor) && !reached.has(neighbor)) {
          reached.add(neighbor)
          queue.push(neighbor)
        }
      }
    }
    reached.delete(sourceId)
    return [...reached]
  }

  switch (mode) {
    case 'deploy':
      return { sources: mine, targetsOf: () => [], autoSelect: false }
    case 'attack':
      return withTargets((sourceId) => neighborsOf(sourceId).filter((id) => !isMine(id)))
    case 'conquest': {
      // Troops move in from a territory next to the conquered one. After a reload we no longer
      // know which one attacked, so every candidate can be picked.
      const conquered = findPendingConquest(territories)?.territoryId
      return withTargets(
        (sourceId) => (conquered && neighborsOf(sourceId).includes(conquered) ? [conquered] : []),
        true,
      )
    }
    case 'fortify':
      return withTargets(reachableFrom)
  }
}

export interface Selection {
  sourceId: TerritoryId | null
  targetId: TerritoryId | null
}

export const NO_SELECTION: Selection = { sourceId: null, targetId: null }

/** Drops the parts of a selection that are no longer valid, e.g. after the board changed. */
export function resolveSelection(selection: Selection, interaction: Interaction): Selection {
  const sourceId = pick(selection.sourceId, interaction.sources, interaction.autoSelect)
  const targets = sourceId ? interaction.targetsOf(sourceId) : []
  return { sourceId, targetId: pick(selection.targetId, targets, interaction.autoSelect) }
}

function pick(wanted: TerritoryId | null, allowed: TerritoryId[], autoSelect: boolean) {
  if (wanted && allowed.includes(wanted)) return wanted
  return autoSelect && allowed.length === 1 ? allowed[0] : null
}

/** The selection after a click on a territory. */
export function selectTerritory(
  selection: Selection,
  clickedId: TerritoryId,
  interaction: Interaction,
): Selection {
  const { sourceId } = selection
  if (clickedId === sourceId) return NO_SELECTION
  if (sourceId && interaction.targetsOf(sourceId).includes(clickedId)) {
    return { sourceId, targetId: clickedId }
  }
  return interaction.sources.includes(clickedId)
    ? { sourceId: clickedId, targetId: null }
    : NO_SELECTION
}

/** Three cards can be traded when they are alike, all different, or include a wild card. */
export function isValidCardSet(cards: BonusCardDto[]) {
  if (cards.length !== CARDS_PER_TRADE) return false
  if (cards.some((card) => card.type === 'Wild')) return true
  const types = new Set(cards.map((card) => card.type)).size
  return types === 1 || types === CARDS_PER_TRADE
}
