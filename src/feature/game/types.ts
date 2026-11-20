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
  /**
   * Card sets traded in by all players so far. Decides what the next set gives when the card
   * bonus is progressive. Not sent by the backend yet; counted as 0 until it is.
   */
  cardSetsTraded?: number
}

/** Pushed by the game hub: the same shapes as GET /api/games/{id} and /territories. */
export interface GameUpdate {
  game: GameDto
  territories: TerritoryDto[]
}

/**
 * Sent to the game hub by the current player whenever they pick territories, so the other players
 * can follow along. Both null clears the selection.
 */
export interface SelectTerritoriesRequest {
  sourceTerritoryId: string | null
  targetTerritoryId: string | null
}

/**
 * Pushed by the game hub to the other players when the current player picks territories. Under fog
 * of war the backend leaves out (null) the territories the receiver cannot see.
 */
export interface TerritorySelectionDto extends SelectTerritoriesRequest {
  gameId: string
  playerId: string
}

export interface GameSummaryDto {
  id: string
  hostId: string
  state: GameStatus
  playerCount: number
  maxPlayers: number
  createdAt: string
}

/** 'Fixed': a set's value depends on its cards. 'Progressive': each set traded gives more than the last. */
export type CardBonusMode = 'Fixed' | 'Progressive'

export interface GameSettingsDto {
  id: string
  gameId: string
  maxPlayers: number
  timer: number
  turnTimeLimit: number
  hasFogOfWar: boolean
  hasMissions: boolean
  blizzardCount: number
  /** Not sent by the backend yet; the bonus is fixed until it is. */
  cardBonusMode?: CardBonusMode
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

/** Ends the current phase. Must name the phase that follows, so a repeated request cannot skip one. */
export interface SetPhaseRequest {
  phase: GamePhase
}

// Territory ids in the requests below are territory state ids (TerritoryDto.id), not map slugs.

export interface AttackRequest {
  fromTerritoryId: string
  toTerritoryId: string
  /** Dice the attacker rolls: 1-3, and fewer than the troops in the attacking territory. */
  attackingTroopsCount: number
  /** Dice the defender rolls: 1-2, at most the troops in the defending territory. */
  defendingTroopsCount: number
}

export interface BlitzRequest {
  fromTerritoryId: string
  toTerritoryId: string
}

export interface BattleRoundDto {
  attackerDice: number[]
  defenderDice: number[]
  attackerLosses: number
  defenderLosses: number
}

export interface AttackResultDto extends BattleRoundDto {
  territoryConquered: boolean
}

export interface BlitzResultDto {
  totalAttackerLosses: number
  totalDefenderLosses: number
  territoryConquered: boolean
  rounds: BattleRoundDto[]
}

/** Moves troops into a territory that was just conquered, which completes the conquest. */
export interface ConquestRequest {
  fromTerritoryId: string
  toTerritoryId: string
  movingTroopsCount: number
}

export interface FortifyRequest {
  fromTerritoryId: string
  toTerritoryId: string
  troops: number
}

export type BonusCardType = 'Infantry' | 'Cavalry' | 'Artillery' | 'Wild'

export interface BonusCardDto {
  id: string
  playerId: string | null
  type: BonusCardType
  /** Map slug of the territory on the card, or null for a wild card. */
  territoryIdentifier: string | null
  used: boolean
}

export interface TradeCardsRequest {
  cardIds: string[]
}

export interface TradeCardsResponse {
  troopsAwarded: number
}

export interface MissionCardDto {
  id: string
  playerId: string | null
  title: string
  description: string
  isCompleted: boolean
}
