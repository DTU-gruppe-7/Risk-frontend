/** The colours a player can pick. The value is sent to the backend and drawn on the board as is. */
export const PLAYER_COLORS = [
  { value: 'red', label: 'Rød' },
  { value: 'blue', label: 'Blå' },
  { value: 'green', label: 'Grøn' },
  { value: 'yellow', label: 'Gul' },
  { value: 'purple', label: 'Lilla' },
  { value: 'orange', label: 'Orange' },
] as const

export type PlayerColor = (typeof PLAYER_COLORS)[number]['value']

/** The first colour nobody has taken, or undefined when all are taken. */
export function firstFreeColor(taken: readonly string[]): PlayerColor | undefined {
  return PLAYER_COLORS.find((color) => !taken.includes(color.value))?.value
}
