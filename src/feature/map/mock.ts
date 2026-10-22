// Fake game state. Delete when players and territories come from the backend.

import { territoryGeometries } from './geometry'
import type { Player, TerritoryState } from './types'

export const mockPlayers: Player[] = [
  { id: 'p1', name: 'Rød', color: '#9e2b25' },
  { id: 'p2', name: 'Blå', color: '#2f4f7f' },
  { id: 'p3', name: 'Grøn', color: '#4f6b2f' },
]

export const mockTerritoryStates: TerritoryState[] = territoryGeometries.map(
  (territory, index) => ({
    territoryId: territory.id,
    ownerId: mockPlayers[index % mockPlayers.length].id,
    units: ((index * 7) % 12) + 1,
    visible: true,
    blizzard: false,
  }),
)
