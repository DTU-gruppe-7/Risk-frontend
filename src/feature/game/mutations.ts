import { api } from '../../api/client'
import type {
  AttackRequest,
  AttackResultDto,
  BlitzRequest,
  BlitzResultDto,
  ConquestRequest,
  CreateGameRequest,
  DeployTroopsRequest,
  FortifyRequest,
  GameDto,
  GamePhase,
  JoinGameRequest,
  PlayerDto,
  SetPhaseRequest,
  TerritoryDto,
  TradeCardsRequest,
  TradeCardsResponse,
} from './types'

export function createGame(request: CreateGameRequest) {
  return api.post<GameDto, CreateGameRequest>('/api/games', request)
}

export function joinGame(gameId: string, request: JoinGameRequest) {
  return api.post<PlayerDto, JoinGameRequest>(`/api/games/${gameId}/players`, request)
}

export function startGame(gameId: string) {
  return api.put<GameDto>(`/api/games/${gameId}/start`)
}

export function deployTroops(gameId: string, territoryId: string, request: DeployTroopsRequest) {
  return api.put<TerritoryDto, DeployTroopsRequest>(
    `/api/games/${gameId}/territories/${territoryId}/deploy`,
    request,
  )
}

/** Ends the current phase and moves on to nextPhase. Ending Fortify ends the turn. */
export function endPhase(gameId: string, nextPhase: GamePhase) {
  return api.put<GameDto, SetPhaseRequest>(`/api/games/${gameId}/phase`, { phase: nextPhase })
}

/** One round of dice. A conquered territory must be completed with completeConquest. */
export function attack(gameId: string, request: AttackRequest) {
  return api.post<AttackResultDto, AttackRequest>(`/api/games/${gameId}/gameplay/attack`, request)
}

/** Keeps rolling until the territory is conquered or the attacker has one troop left. */
export function blitz(gameId: string, request: BlitzRequest) {
  return api.post<BlitzResultDto, BlitzRequest>(`/api/games/${gameId}/gameplay/blitz`, request)
}

export function completeConquest(gameId: string, request: ConquestRequest) {
  return api.post<void, ConquestRequest>(`/api/games/${gameId}/gameplay/conquest`, request)
}

/** Moves troops between two connected territories of the player and ends the turn. */
export function fortify(gameId: string, request: FortifyRequest) {
  return api.put<GameDto, FortifyRequest>(`/api/games/${gameId}/fortify`, request)
}

export function tradeCards(gameId: string, request: TradeCardsRequest) {
  return api.post<TradeCardsResponse, TradeCardsRequest>(
    `/api/games/${gameId}/bonus-cards/trade-in`,
    request,
  )
}
