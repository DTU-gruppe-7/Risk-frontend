import type { Point } from './types'

// The round badge with a territory's troops, drawn just below its name (see TerritoryLabel).

/** How far below the label position the middle of the badge is. */
export const BADGE_OFFSET_Y = 5

export const BADGE_RADIUS = 6

/** The middle of a territory's troop badge. */
export function badgeCenterOf(labelPosition: Point): Point {
  return { x: labelPosition.x, y: labelPosition.y + BADGE_OFFSET_Y }
}
