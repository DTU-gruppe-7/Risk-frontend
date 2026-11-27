import { isLightPlayerColor } from '../../lobby/playerColors'

// The pips of each face, as cells in a 3x3 grid counted from the top left (0) to the bottom right (8).
const PIPS: Record<number, readonly number[]> = {
  1: [4],
  2: [0, 8],
  3: [0, 4, 8],
  4: [0, 2, 6, 8],
  5: [0, 2, 4, 6, 8],
  6: [0, 2, 3, 5, 6, 8],
}
const CELLS = Array.from({ length: 9 }, (_, cell) => cell)

/** One die with pips, in the colour of the player who rolled it. */
export default function Die({
  value,
  color,
  className = 'h-6 w-6',
}: {
  value: number
  /** A player's colour (see PLAYER_COLORS). */
  color: string
  /** The size of the die. */
  className?: string
}) {
  const pips = PIPS[value] ?? []
  const pipColor = isLightPlayerColor(color) ? 'bg-stone-900' : 'bg-white'

  return (
    <span
      role="img"
      aria-label={String(value)}
      // A light from the top left on the player's colour, so it looks like a die and not a tile.
      className={`grid shrink-0 grid-cols-3 grid-rows-3 rounded-[22%] border border-white/40 bg-linear-to-br from-white/30 to-black/25 p-[14%] shadow-md shadow-black/40 ${className}`}
      style={{ backgroundColor: color }}
    >
      {CELLS.map((cell) => (
        <span
          key={cell}
          className={`m-auto aspect-square w-[72%] rounded-full ${pips.includes(cell) ? pipColor : ''}`}
        />
      ))}
    </span>
  )
}
