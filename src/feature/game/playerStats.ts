import type { TerritoryInfo, TerritoryState } from '../map/types'
import type { PlayerDto } from './types'

export interface PlayerStats {
  territories: number
  troops: number
}

interface BoardView {
  /** The territories as the current user sees them. Under fog of war the hidden ones are missing. */
  territories: TerritoryState[]
  infos: TerritoryInfo[]
  hasFogOfWar: boolean
  /** The current user's player, whose own territories can always be seen. */
  meId: string | undefined
}

/**
 * Whether every territory a player holds can be seen, so their totals are the real ones. Under fog
 * of war the owner of a hidden territory is unknown, so any hidden territory could be theirs.
 */
function canSeeAllOf(player: PlayerDto, view: BoardView) {
  if (!view.hasFogOfWar || player.id === view.meId || player.isEliminated) return true
  const seenIds = new Set(view.territories.map((territory) => territory.territoryId))
  return view.infos.every((info) => seenIds.has(info.id))
}

/** How much of the board a player holds, or null when fog of war hides some of it. */
export function playerStatsOf(player: PlayerDto, view: BoardView): PlayerStats | null {
  if (!canSeeAllOf(player, view)) return null

  const owned = view.territories.filter((territory) => territory.ownerId === player.id)
  return {
    territories: owned.length,
    troops: owned.reduce((sum, territory) => sum + territory.units, 0),
  }
}
