import { API_BASE_URL, HUB_URLS } from '../api/config'
import { getValidAccessToken } from '../api/auth/session'
import type { GameDto } from '../feature/game/types'
import { createSignalRHub } from './signalrHub'

// Events the server pushes to all clients in a game. Names must match the backend.
export type GameHubEvents = {
  GameUpdated: (game: GameDto) => void
}

// Methods the client calls on the server.
export type GameHubMethods = {
  JoinGame: (gameId: string) => Promise<void>
  LeaveGame: (gameId: string) => Promise<void>
}

export const gameHub = createSignalRHub<GameHubEvents, GameHubMethods>(
  API_BASE_URL + HUB_URLS.game,
  { getAccessToken: getValidAccessToken },
)
