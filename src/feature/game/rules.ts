import type { PlayerId, TerritoryId, TerritoryInfo, TerritoryState } from '../map/types'
import type { BonusCardDto, BonusCardType, GameDto, PlayerDto } from './types'

// Client-side copies of the game rules, used only to guide the player: what can be clicked and
// which buttons are enabled. The backend validates every action and is the authority.

/** What the current user can do right now. 'waiting' covers everything that is not their move. */
export type TurnMode = 'waiting' | 'deploy' | 'attack' | 'conquest' | 'fortify'

export const MAX_ATTACK_DICE = 3
export const MAX_DEFENSE_DICE = 2
export const CARDS_PER_TRADE = 3
/** A player holding this many cards must trade before deploying or moving on. */
export const FORCED_TRADE_HAND_SIZE = 5

/** The player whose turn it is, or undefined when nobody has the turn (e.g. in the lobby). */
export function currentPlayerOf(game: GameDto): PlayerDto | undefined {
  return game.players.find((player) => player.id === game.currentPlayerId)
}

/** How many players have been knocked out of the game. */
export function eliminatedCountOf(game: GameDto) {
  return game.players.filter((player) => player.isEliminated).length
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

/**
 * The sets that can be traded and the troops each one gives. These are the classic fixed values;
 * the backend decides what a trade really gives, so keep them in step with it.
 */
export const TRADE_SETS: { types: BonusCardType[]; troops: number }[] = [
  { types: ['Infantry', 'Infantry', 'Infantry'], troops: 4 },
  { types: ['Cavalry', 'Cavalry', 'Cavalry'], troops: 6 },
  { types: ['Artillery', 'Artillery', 'Artillery'], troops: 8 },
  { types: ['Infantry', 'Cavalry', 'Artillery'], troops: 10 },
]

/**
 * The extra troops put on a territory the player holds when a card showing it is traded, at most
 * once per trade. Like TRADE_SETS, keep it in step with the backend.
 */
export const OWNED_TERRITORY_BONUS = 2

/**
 * The troops a set is expected to give, or null when that is not known: the set is not valid,
 * or it holds a wild card, where the backend picks what the wild card counts as.
 */
export function tradeValueOf(cards: BonusCardDto[]) {
  if (!isValidCardSet(cards) || cards.some((card) => card.type === 'Wild')) return null
  const types = cards.map((card) => card.type).sort()
  const match = TRADE_SETS.find((set) => [...set.types].sort().join() === types.join())
  return match?.troops ?? null
}

// The classic rising values: the first sets give these, and every set after that gives 5 more.
const PROGRESSIVE_TRADE_VALUES = [4, 6, 8, 10, 12, 15]
const PROGRESSIVE_TRADE_STEP = 5

/**
 * The troops a set gives under the progressive card bonus, where only the number of sets traded
 * before it counts, not which cards are in it. Like TRADE_SETS, keep it in step with the backend.
 */
export function progressiveTradeValue(setsTraded: number) {
  const last = PROGRESSIVE_TRADE_VALUES.length - 1
  return setsTraded <= last
    ? PROGRESSIVE_TRADE_VALUES[setsTraded]
    : PROGRESSIVE_TRADE_VALUES[last] + (setsTraded - last) * PROGRESSIVE_TRADE_STEP
}

/** Three cards can be traded when they are alike, all different, or include a wild card. */
export function isValidCardSet(cards: BonusCardDto[]) {
  if (cards.length !== CARDS_PER_TRADE) return false
  if (cards.some((card) => card.type === 'Wild')) return true
  const types = new Set(cards.map((card) => card.type)).size
  return types === 1 || types === CARDS_PER_TRADE
}
