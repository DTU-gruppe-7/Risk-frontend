import { API_BASE_URL, HUB_URLS } from '../api/config'
import { getValidAccessToken } from '../api/auth/session'
import type { GameUpdate } from '../feature/game/types'
import { createSignalRHub } from './signalrHub'

// Events the server pushes to the clients watching a game. Names must match the backend's IGameClient.
export type GameHubEvents = {
  /** Sent on join and after every change, filtered for the receiver (fog of war). */
  GameUpdated: (update: GameUpdate) => void
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
