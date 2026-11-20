import { API_BASE_URL, HUB_URLS } from '../api/config'
import { getValidAccessToken } from '../api/auth/session'
import type {
  GameUpdate,
  SelectTerritoriesRequest,
  TerritorySelectionDto,
} from '../feature/game/types'
import { createSignalRHub } from './signalrHub'

// Events the server pushes to the clients watching a game. Names must match the backend's IGameClient.
export type GameHubEvents = {
  /** Sent on join and after every change, filtered for the receiver (fog of war). */
  GameUpdated: (update: GameUpdate) => void
  /** Sent to the other players when the current player picks territories. */
  SelectionChanged: (selection: TerritorySelectionDto) => void
}

// Methods the client calls on the server.
export type GameHubMethods = {
  JoinGame: (gameId: string) => Promise<void>
  LeaveGame: (gameId: string) => Promise<void>
  /** Shares the current player's selection with the others. Only allowed on your own turn. */
  SelectTerritories: (gameId: string, request: SelectTerritoriesRequest) => Promise<void>
}

export const gameHub = createSignalRHub<GameHubEvents, GameHubMethods>(
  API_BASE_URL + HUB_URLS.game,
  { getAccessToken: getValidAccessToken },
)
