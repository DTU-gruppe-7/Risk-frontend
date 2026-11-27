import type { Point } from './types'

/**
 * The points in a territory's outline. The paths only use absolute M, L, C and Z, so every number
 * pair is a point (some are the control points of curves, which lie close to the outline).
 */
export function pointsOf(path: string): Point[] {
  const numbers = (path.match(/-?\d+(\.\d+)?/g) ?? []).map(Number)
  const points: Point[] = []
  for (let index = 0; index + 1 < numbers.length; index += 2) {
    points.push({ x: numbers[index], y: numbers[index + 1] })
  }
  return points
}
