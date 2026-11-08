// DTOs as the backend sends them. Enum values are PascalCase, because the backend
// serializes enums with JsonStringEnumConverter using the C# member names.

export type GameStatus = 'Lobby' | 'InProgress' | 'Finished'
export type GamePhase = 'Deployment' | 'Attack' | 'Fortify'

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
  id: string
  identifier: string
  ownerId: string | null
  troopCount: number
  isBlizzard: boolean
}

export interface GameDto {
  id: string
  version: number
  hostId: string
  state: GameStatus
  winnerId: string | null
  currentPlayerId: string | null
  currentPhase: GamePhase
  settings: GameSettingsDto | null
  players: PlayerDto[]
  createdAt: string
  startedAt: string | null
  endedAt: string | null
  turnStartedAt: string | null
}

/** Pushed by the game hub: the same shapes as GET /api/games/{id} and /territories. */
export interface GameUpdate {
  game: GameDto
  territories: TerritoryDto[]
}

export interface GameSummaryDto {
  id: string
  hostId: string
  state: GameStatus
  playerCount: number
  maxPlayers: number
  createdAt: string
}

export interface GameSettingsDto {
  id: string
  gameId: string
  maxPlayers: number
  timer: number
  turnTimeLimit: number
  hasFogOfWar: boolean
  hasMissions: boolean
  blizzardCount: number
}

export interface CreateGameRequest {
  maxPlayers?: number
  timer?: number
  turnTimeLimit?: number
  hasFogOfWar?: boolean
  hasMissions?: boolean
  blizzardCount?: number
}

export interface JoinGameRequest {
  color: string
}

export interface DeployTroopsRequest {
  troops: number
}
