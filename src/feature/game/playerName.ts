import type { PlayerDto } from './types'

/** What a player is called in the UI. Falls back to the turn order if the user name is missing. */
export function playerName(player: PlayerDto) {
  return player.userName || `Spiller ${player.turnOrder}`
}
