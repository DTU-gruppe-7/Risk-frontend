/**
 * The colours a player can pick. The value is sent to the backend and drawn on the board as is.
 * isLight marks the colours that dark marks stand out better on than white ones.
 */
export const PLAYER_COLORS = [
  { value: 'red', label: 'Rød', isLight: false },
  { value: 'blue', label: 'Blå', isLight: false },
  { value: 'green', label: 'Grøn', isLight: false },
  { value: 'yellow', label: 'Gul', isLight: true },
  { value: 'purple', label: 'Lilla', isLight: false },
  { value: 'orange', label: 'Orange', isLight: true },
] as const

export type PlayerColor = (typeof PLAYER_COLORS)[number]['value']

/** The first colour nobody has taken, or undefined when all are taken. */
export function firstFreeColor(taken: readonly string[]): PlayerColor | undefined {
  return PLAYER_COLORS.find((color) => !taken.includes(color.value))?.value
}

/** Whether dark marks, e.g. text or pips, should be drawn on top of a player's colour. */
export function isLightPlayerColor(color: string) {
  return PLAYER_COLORS.some((option) => option.value === color && option.isLight)
}
