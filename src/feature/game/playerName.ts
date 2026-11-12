import type { PlayerDto } from './types'

/** What a player is called in the UI. The backend does not send user names with a game yet. */
export function playerName(player: PlayerDto) {
  return `Spiller ${player.turnOrder}`
}
