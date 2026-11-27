import { MAP_WIDTH } from './geometry'
import type { Point } from './types'

/** How far an arrow between two points bends to the side, as a share of its length. */
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

/** A cubic Bézier curve: start, two control points, end. */
type Curve = [Point, Point, Point, Point]

/**
 * An arrow along the given points, from the first to the last, stopping `gap` short of both ends,
 * e.g. outside the troop badges. Between two points it bends slightly; with more it runs smoothly
 * through the points between. Null when the ends are too close to fit an arrow.
 */
export function arrowAlong(points: Point[], gap: number): ArrowShape | null {
  if (points.length < 2) return null
  const { route, offsetsX } = unwrapped(points)
  const last = route.length - 1

  const first = directionOf(route[0], route[1])
  const final = directionOf(route[last - 1], route[last])
  const tooShort =
    first.length <= gap ||
    final.length <= gap + HEAD_LENGTH ||
    (route.length === 2 && first.length <= 2 * gap + HEAD_LENGTH)
  if (tooShort) return null

  const start = moved(route[0], first.unit, gap)
  const tip = moved(route[last], final.unit, -gap)
  const through = [start, ...route.slice(1, last), tip]
  const curves = through.length === 2 ? [bentCurve(start, tip)] : smoothCurves(through)

  // The head points the way the line runs at its end, and the line stops where the head begins.
  const [lastStart, lastControl1, lastControl2] = curves[curves.length - 1]
  const headAlong = directionOf(lastControl2, tip).unit
  const headAcross = { x: headAlong.y, y: -headAlong.x }
  const base = moved(tip, headAlong, -HEAD_LENGTH)
  curves[curves.length - 1] = [
    lastStart,
    lastControl1,
    moved(lastControl2, headAlong, -HEAD_LENGTH),
    base,
  ]
  const corners = [
    tip,
    moved(base, headAcross, HEAD_HALF_WIDTH),
    moved(base, headAcross, -HEAD_HALF_WIDTH),
  ]

  return {
    path: `M${format(start)} ${curves.map(([, c1, c2, end]) => `C${format(c1)} ${format(c2)} ${format(end)}`).join(' ')}`,
    head: corners.map(format).join(' '),
    offsetsX,
  }
}

/**
 * The map wraps around (Alaska and Kamchatka are neighbours), so each step takes the short way,
 * towards a copy of the next point beyond the edge. Gives the points moved that way, and the shifts
 * that bring each part of the arrow back onto the map.
 */
function unwrapped(points: Point[]) {
  const route = [points[0]]
  const shifts = new Set([0])
  let shift = 0
  for (const point of points.slice(1)) {
    const dx = point.x + shift - route[route.length - 1].x
    if (Math.abs(dx) > MAP_WIDTH / 2) shift -= Math.sign(dx) * MAP_WIDTH
    shifts.add(shift)
    route.push({ x: point.x + shift, y: point.y })
  }
  return { route, offsetsX: [...shifts].map((value) => -value) }
}

/** One curve from start to end, bent a little to the side. */
function bentCurve(start: Point, end: Point): Curve {
  const { unit, length } = directionOf(start, end)
  const across = { x: unit.y, y: -unit.x }
  const control = moved(midpoint(start, end), across, length * BEND)
  // The same curve as a quadratic one with this single control point.
  return [start, between(start, control, 2 / 3), between(end, control, 2 / 3), end]
}

/** Smooth curves through all the points (a Catmull-Rom spline). */
function smoothCurves(points: Point[]): Curve[] {
  return points.slice(0, -1).map((from, index) => {
    const before = points[index - 1] ?? from
    const to = points[index + 1]
    const after = points[index + 2] ?? to
    return [
      from,
      { x: from.x + (to.x - before.x) / 6, y: from.y + (to.y - before.y) / 6 },
      { x: to.x - (after.x - from.x) / 6, y: to.y - (after.y - from.y) / 6 },
      to,
    ]
  })
}

function directionOf(from: Point, to: Point) {
  const length = Math.hypot(to.x - from.x, to.y - from.y)
  const unit =
    length > 0 ? { x: (to.x - from.x) / length, y: (to.y - from.y) / length } : { x: 0, y: 0 }
  return { unit, length }
}

function moved(point: Point, direction: Point, distance: number): Point {
  return { x: point.x + direction.x * distance, y: point.y + direction.y * distance }
}

/** The point `share` of the way from a to b. */
function between(a: Point, b: Point, share: number): Point {
  return { x: a.x + (b.x - a.x) * share, y: a.y + (b.y - a.y) * share }
}

function midpoint(a: Point, b: Point): Point {
  return between(a, b, 1 / 2)
}

function format({ x, y }: Point) {
  return `${x.toFixed(1)},${y.toFixed(1)}`
}
