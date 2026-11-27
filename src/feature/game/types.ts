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
  /** Only true for the current player, when the backend will not let them go on without trading. */
  mustTradeCards: boolean
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
  /** The round of the game, counted from 1. */
  round: number
  /** A conquered territory waiting for the attacker to move troops in, or null. */
  pendingConquest: PendingConquestDto | null
  /** Card sets traded in by all players so far. */
  cardSetsTraded: number
  /** What the next 3 card trades give with the progressive bonus, the next one first. Empty when fixed. */
  upcomingTradeValues: number[]
}

/** A conquest waiting for troops to move in. Territory ids are state ids (TerritoryDto.id). */
export interface PendingConquestDto {
  /** The territory that attacked. */
  fromTerritoryId: string
  /** The conquered territory. */
  toTerritoryId: string
  /** The limits POST .../gameplay/conquest accepts. */
  minTroops: number
  maxTroops: number
}

/** Pushed by the game hub: the same shapes as GET /api/games/{id} and /territories. */
export interface GameUpdate {
  game: GameDto
  territories: TerritoryDto[]
}

/** A player as the game list sends it: just enough for the lobby. */
export interface LobbyPlayerDto {
  /** Player id (not the user id). Used to leave the game. */
  id: string
  userId: string
  color: string
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

/** Why the player got cards: for a conquest in their turn, or from a player they knocked out. */
export type CardsReceivedReason = 'Conquest' | 'Elimination'

/**
 * Pushed by the game hub to the player who got new cards only, never to the whole game. Holds only
 * the new cards, not the whole hand. Not sent again after a reload.
 */
export interface CardsReceivedDto {
  gameId: string
  cards: BonusCardDto[]
  reason: CardsReceivedReason
}

export interface GameSummaryDto {
  id: string
  hostId: string
  state: GameStatus
  playerCount: number
  maxPlayers: number
  hasFogOfWar: boolean
  victoryMode: GameVictoryMode
  blizzardCount: number
  /** Seconds per turn, 0 = no limit. */
  turnTimeLimit: number
  createdAt: string
  /** Sorted by turn order. */
  players: LobbyPlayerDto[]
}

/** 'Fixed': a set's value depends on its cards. 'Progressive': each set traded gives more than the last. */
export type CardTradeMode = 'Fixed' | 'Progressive'

export interface GameSettingsDto {
  id: string
  gameId: string
  maxPlayers: number
  timer: number
  turnTimeLimit: number
  hasFogOfWar: boolean
  hasMissions: boolean
  blizzardCount: number
  /** How many troops a traded card set gives. */
  cardTradeMode: CardTradeMode
}

export type GameVictoryMode = 'CompleteConquest' | 'Mission'

export interface CreateGameRequest {
  maxPlayers?: number
  timer?: number
  turnTimeLimit?: number
  hasFogOfWar?: boolean
  hasMissions?: boolean
  blizzardCount?: number
  victoryMode?: GameVictoryMode
  /** When set, the host joins with this color in the same request. */
  color?: string
  /** How many troops a traded card set gives. Always sent, as the backend has its own default. */
  cardTradeMode?: CardTradeMode
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
}

export interface BlitzRequest {
  fromTerritoryId: string
  toTerritoryId: string
}

export type BattleSide = 'Attacker' | 'Defender'

/** One pair of dice the server compared, and who won it. */
export interface DiceComparisonDto {
  attackerDie: number
  defenderDie: number
  winner: BattleSide
}

export interface BattleRoundDto {
  attackerDice: number[]
  defenderDice: number[]
  attackerLosses: number
  defenderLosses: number
  /** One per pair, highest first. Dice without a pair are only in attackerDice/defenderDice. */
  comparisons: DiceComparisonDto[]
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
  /** The territory (state id) that got the extra troops for a card showing it, or null. */
  bonusTerritoryId?: string | null
  bonusTroops: number
}

/** What trading the given cards would give. The order of the cards decides which one gives the bonus. */
export interface TradePreviewResponse {
  /** The cards are three valid cards from the player's own hand. */
  isValid: boolean
  troops: number | null
  /** The territory (state id) that would get the extra troops, or null. */
  bonusTerritoryId: string | null
  bonusTroops: number
}

/** The card trade rules, the same for every game (GET /api/rules/card-trades). */
export interface CardTradeRulesResponse {
  /** Every kind of set and what it gives with the fixed bonus. */
  fixedSets: { types: BonusCardType[]; troops: number }[]
  /** The first values with the progressive bonus. */
  firstProgressiveValues: number[]
  /** The extra troops on a territory the player holds, for a traded card showing it. */
  ownedTerritoryBonus: number
  cardsPerTrade: number
  /** A player holding this many cards must trade. */
  forcedTradeHandSize: number
}

export interface MissionCardDto {
  id: string
  playerId: string | null
  title: string
  description: string
  isCompleted: boolean
}
