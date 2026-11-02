import { api } from '../../api/client'
import type {
  CreateGameRequest,
  DeployTroopsRequest,
  GameDto,
  JoinGameRequest,
  PlayerDto,
  TerritoryDto,
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
