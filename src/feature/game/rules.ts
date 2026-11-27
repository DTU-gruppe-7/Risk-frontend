import type { PlayerId, TerritoryId, TerritoryInfo, TerritoryState } from '../map/types'
import type { BonusCardType, GameDto, PendingConquestDto, PlayerDto } from './types'

// Client-side copies of the game rules, used only to guide the player: what can be clicked and
// which buttons are enabled. The backend validates every action and is the authority.

/** What the current user can do right now. 'waiting' covers everything that is not their move. */
export type TurnMode = 'waiting' | 'deploy' | 'attack' | 'conquest' | 'fortify'

export const MAX_ATTACK_DICE = 3

/** The player whose turn it is, or undefined when nobody has the turn (e.g. in the lobby). */
export function currentPlayerOf(game: GameDto): PlayerDto | undefined {
  return game.players.find((player) => player.id === game.currentPlayerId)
}

/**
 * Identifies one turn: changes when the turn does, also when the same player gets a new turn.
 * The start is compared as a point in time, not as text: the hub and the REST API may write the
 * same time differently (e.g. more decimals or "+00:00" instead of "Z").
 */
export function turnIdOf(game: GameDto) {
  const startedAt = game.turnStartedAt ? Date.parse(game.turnStartedAt) : null
  return `${game.currentPlayerId}:${startedAt}`
}

export function turnModeOf(
  game: GameDto,
  me: PlayerDto | undefined,
  pendingConquest: PendingConquestDto | null,
): TurnMode {
  if (game.state !== 'InProgress' || !me || game.currentPlayerId !== me.id) return 'waiting'

  switch (game.currentPhase) {
    case 'Deployment':
      return 'deploy'
    case 'Attack':
      return pendingConquest ? 'conquest' : 'attack'
    case 'Fortify':
      return 'fortify'
  }
}

/** Which territories can be picked in a mode: first a source, then one of its targets. */
export interface Interaction {
  sources: TerritoryId[]
  targetsOf: (sourceId: TerritoryId) => TerritoryId[]
  /** Pick a source or target without a click when there is only one choice. */
  autoSelect: boolean
}

const NO_INTERACTION: Interaction = { sources: [], targetsOf: () => [], autoSelect: false }

/** Looks up territories on the board as the player sees it. */
function boardOf(territories: TerritoryState[], infos: TerritoryInfo[]) {
  const stateById = new Map(territories.map((territory) => [territory.territoryId, territory]))
  const adjacentById = new Map(infos.map((info) => [info.id, info.adjacent]))

  // A territory without state is hidden by fog of war, and a blizzard is never part of play.
  const isPlayable = (id: TerritoryId) => stateById.get(id)?.blizzard === false
  const ownerOf = (id: TerritoryId) =>
    isPlayable(id) ? (stateById.get(id)?.ownerId ?? null) : null
  const neighborsOf = (id: TerritoryId) => (adjacentById.get(id) ?? []).filter(isPlayable)

  return { stateById, isPlayable, ownerOf, neighborsOf }
}

/**
 * Searches outwards from sourceId, nearest first, through the territories canEnter lets in. Gives
 * every territory reached, with the one it was reached from (null for sourceId itself).
 */
function searchFrom(
  sourceId: TerritoryId,
  neighborsOf: (id: TerritoryId) => TerritoryId[],
  canEnter: (id: TerritoryId) => boolean,
) {
  const cameFrom = new Map<TerritoryId, TerritoryId | null>([[sourceId, null]])
  const queue = [sourceId]
  for (let id = queue.shift(); id !== undefined; id = queue.shift()) {
    for (const neighbor of neighborsOf(id)) {
      if (canEnter(neighbor) && !cameFrom.has(neighbor)) {
        cameFrom.set(neighbor, id)
        queue.push(neighbor)
      }
    }
  }
  return cameFrom
}

export function interactionFor(
  mode: TurnMode,
  territories: TerritoryState[],
  infos: TerritoryInfo[],
  playerId: PlayerId | undefined,
  pendingConquest: PendingConquestDto | null,
): Interaction {
  if (mode === 'waiting' || !playerId) return NO_INTERACTION

  const { stateById, ownerOf, neighborsOf } = boardOf(territories, infos)
  const isMine = (id: TerritoryId) => ownerOf(id) === playerId
  // One troop always stays behind, so moving out takes at least two.
  const canMoveFrom = (id: TerritoryId) => isMine(id) && (stateById.get(id)?.units ?? 0) >= 2
  const mine = territories.map((territory) => territory.territoryId).filter(isMine)

  function withTargets(targetsOf: Interaction['targetsOf'], autoSelect = false): Interaction {
    const sources = mine.filter((id) => canMoveFrom(id) && targetsOf(id).length > 0)
    return { sources, targetsOf, autoSelect }
  }

  /** Every territory connected to sourceId through the player's own territories. */
  function reachableFrom(sourceId: TerritoryId) {
    const reached = searchFrom(sourceId, neighborsOf, isMine).keys()
    return [...reached].filter((id) => id !== sourceId)
  }

  switch (mode) {
    case 'deploy':
      return { sources: mine, targetsOf: () => [], autoSelect: false }
    case 'attack':
      return withTargets((sourceId) => neighborsOf(sourceId).filter((id) => !isMine(id)))
    case 'conquest': {
      // The server says which territory attacked and which was conquered, so both are picked by
      // themselves, also after a reload.
      const mapIdOf = (stateId: string | undefined) =>
        territories.find((territory) => territory.stateId === stateId)?.territoryId
      const from = mapIdOf(pendingConquest?.fromTerritoryId)
      const to = mapIdOf(pendingConquest?.toTerritoryId)
      if (!from || !to) return NO_INTERACTION
      return { sources: [from], targetsOf: (id) => (id === from ? [to] : []), autoSelect: true }
    }
    case 'fortify':
      return withTargets(reachableFrom)
  }
}

/**
 * The territories troops pass from sourceId to targetId, both included. When fortifying, the
 * shortest way through territories with the same owner as sourceId; otherwise, or when that way
 * cannot be seen (fog of war), straight from one to the other. Null without both.
 */
export function troopRouteOf(
  sourceId: TerritoryId | null | undefined,
  targetId: TerritoryId | null | undefined,
  isFortifying: boolean,
  territories: TerritoryState[],
  infos: TerritoryInfo[],
): TerritoryId[] | null {
  if (!sourceId || !targetId) return null
  const straight = [sourceId, targetId]
  if (!isFortifying) return straight

  const { ownerOf, neighborsOf } = boardOf(territories, infos)
  const owner = ownerOf(sourceId)
  if (!owner) return straight
  const cameFrom = searchFrom(sourceId, neighborsOf, (id) => ownerOf(id) === owner)
  if (!cameFrom.has(targetId)) return straight

  const route: TerritoryId[] = []
  for (let id: TerritoryId | null = targetId; id !== null; id = cameFrom.get(id) ?? null) {
    route.unshift(id)
  }
  return route
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

export const CARD_TYPE_NAMES: Record<BonusCardType, string> = {
  Infantry: 'Infanteri',
  Cavalry: 'Kavaleri',
  Artillery: 'Artilleri',
  Wild: 'Wild card',
}
