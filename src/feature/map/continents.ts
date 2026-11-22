import type { ContinentId, PlayerId, TerritoryInfo, TerritoryState } from './types'

/**
 * The player who holds every territory of a continent, or null when nobody does. Blizzards cannot
 * be held and do not count. Under fog of war it is only known when the whole continent can be seen.
 */
export function continentOwnerOf(
  continentId: ContinentId,
  territories: TerritoryState[],
  infos: TerritoryInfo[],
): PlayerId | null {
  const stateById = new Map(territories.map((state) => [state.territoryId, state]))
  const states = infos
    .filter((info) => info.continent === continentId)
    .map((info) => stateById.get(info.id))
    .filter((state) => !state?.blizzard)
  const ownerId = states[0]?.ownerId
  if (!ownerId || !states.every((state) => state?.visible && state.ownerId === ownerId)) {
    return null
  }
  return ownerId
}
