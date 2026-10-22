import { queryOptions, useSuspenseQuery } from '@tanstack/react-query'
import { apiQuery } from '../../api/query/apiQuery'
import { queryKeys } from '../../api/query/queryKeys'
import type { MapDto, TerritoryInfo } from './types'

/** The static board. It never changes while the app runs, so it is fetched once and kept. */
export const mapQuery = () =>
  queryOptions({
    // Public endpoint: no token needed, so no refresh is triggered just to read the map.
    ...apiQuery<MapDto>(queryKeys.map(), '/api/map', { auth: false }),
    staleTime: Infinity,
    gcTime: Infinity,
  })

function toTerritoryInfos(map: MapDto): TerritoryInfo[] {
  return map.territories.map((t) => ({
    id: t.id,
    continent: t.continentId,
    adjacent: t.neighborIds,
  }))
}

/** The board's territories with continent and neighbours, as Board expects them.
 *  The route loader has already fetched the map, so this never suspends in practice.
 */
export function useTerritoryInfos() {
  return useSuspenseQuery({ ...mapQuery(), select: toTerritoryInfos }).data
}
