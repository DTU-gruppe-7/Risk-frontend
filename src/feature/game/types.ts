import type { TerritoryId } from '../map/types'

// DTOs as the backend sends them. Enum values are PascalCase, because the backend
// serializes enums with JsonStringEnumConverter uing the C# menber names.

export type GameStatus = 'Lobby' | 'InProgress' | 'Finished'
export type GamePhase = 'Deployment' | 'Attack' | ' Fortify'

export interface PlayerDto {
  id: string
  userId: string
  userName: string
  color: string
  turnOrder: number
  reinforcementTroops: number
  isEliminated: boolean
}

export interface TerritoryDto {
  identifier: TerritoryId // e.g. north-africa, mathes the map ids
  ownerId: string | null // PlayerDto.id
  troopCount: number
}

export interface GameDto {
  id: string
  hostId: string
  state: GameStatus
  currentPhase: GamePhase
  currentPlayerId: string | null
  players: PlayerDto[]
  territories: TerritoryDto[]
  /** Increases on every change. Lets the client ignore updates older than what it has */
  version: number
}
