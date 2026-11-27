import { territoryGeometries } from './geometry'
import { pointsOf } from './paths'
import type { Point, TerritoryId } from './types'

/**
 * How close two outline points must be to count as the same. Neighbours on land share the exact
 * points of their border; this only allows for rounding.
 */
const TOUCH_DISTANCE = 1

// The shapes never change, so the outlines and borders are only worked out once.
const outlineById = new Map(territoryGeometries.map(({ id, path }) => [id, pointsOf(path)]))
const borderCache = new Map<string, Point[]>()

/**
 * The points on the land border between two territories. None when they do not touch, e.g. when
 * they are only connected across the sea.
 */
export function landBorderOf(a: TerritoryId, b: TerritoryId): Point[] {
  const key = [a, b].sort().join('|')
  const cached = borderCache.get(key)
  if (cached) return cached

  const other = outlineById.get(b) ?? []
  const border = (outlineById.get(a) ?? []).filter((point) =>
    other.some((near) => Math.hypot(point.x - near.x, point.y - near.y) <= TOUCH_DISTANCE),
  )
  borderCache.set(key, border)
  return border
}

/**
 * Where to cross over land from one territory into the next: the point on their border on the
 * shortest way from `from` to `to`. Null when they are only connected across the sea.
 */
export function landCrossingOf(a: TerritoryId, b: TerritoryId, from: Point, to: Point) {
  const wayVia = (point: Point) =>
    Math.hypot(point.x - from.x, point.y - from.y) + Math.hypot(to.x - point.x, to.y - point.y)

  let best: Point | null = null
  for (const point of landBorderOf(a, b)) {
    if (!best || wayVia(point) < wayVia(best)) best = point
  }
  return best
}
