import { MAP_WIDTH } from './geometry'
import type { Point } from './types'

/** How far the arrow bends to the side, as a share of its length. */
const BEND = 0.18
const HEAD_LENGTH = 7
const HEAD_HALF_WIDTH = 4.5

export interface ArrowShape {
  /** The curved line, ending where the head begins. */
  path: string
  /** The corners of the triangular head, as an SVG points list. */
  head: string
  /**
   * Where to draw the arrow, as sideways shifts. A single 0, except for an arrow across the edge
   * of the map, which is drawn twice: leaving one edge and coming in at the other.
   */
  offsetsX: number[]
}

/**
 * A slightly curved arrow from one point to another, stopping `gap` short of both, e.g. outside
 * the troop badges. Null when the points are too close to fit an arrow between them.
 */
export function arrowBetween(from: Point, to: Point, gap: number): ArrowShape | null {
  // The map wraps around (Alaska and Kamchatka are neighbours), so an arrow takes the short way:
  // towards a copy of the target beyond the edge.
  const wrapShift =
    Math.abs(to.x - from.x) > MAP_WIDTH / 2 ? -Math.sign(to.x - from.x) * MAP_WIDTH : 0
  const end = { x: to.x + wrapShift, y: to.y }

  const length = Math.hypot(end.x - from.x, end.y - from.y)
  if (length <= 2 * gap + HEAD_LENGTH) return null

  // The direction of the arrow, and the one at right angles to it.
  const along = { x: (end.x - from.x) / length, y: (end.y - from.y) / length }
  const across = { x: along.y, y: -along.x }

  const start = moved(from, along, gap)
  const tip = moved(end, along, -gap)
  const control = moved(midpoint(start, tip), across, length * BEND)

  // The head points the way the curve runs at its end, from the control point to the tip.
  const toTip = { x: tip.x - control.x, y: tip.y - control.y }
  const toTipLength = Math.hypot(toTip.x, toTip.y)
  const headAlong = { x: toTip.x / toTipLength, y: toTip.y / toTipLength }
  const headAcross = { x: headAlong.y, y: -headAlong.x }
  const base = moved(tip, headAlong, -HEAD_LENGTH)
  const corners = [
    tip,
    moved(base, headAcross, HEAD_HALF_WIDTH),
    moved(base, headAcross, -HEAD_HALF_WIDTH),
  ]

  return {
    path: `M${format(start)} Q${format(control)} ${format(base)}`,
    head: corners.map(format).join(' '),
    offsetsX: wrapShift ? [0, -wrapShift] : [0],
  }
}

function moved(point: Point, direction: Point, distance: number): Point {
  return { x: point.x + direction.x * distance, y: point.y + direction.y * distance }
}

function midpoint(a: Point, b: Point): Point {
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }
}

function format({ x, y }: Point) {
  return `${x.toFixed(1)},${y.toFixed(1)}`
}
