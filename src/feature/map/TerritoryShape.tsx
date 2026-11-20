import { territoryGeometries } from './geometry'
import { pointsOf } from './paths'
import type { TerritoryId } from './types'

const PADDING = 2

/** The box around a path. */
function viewBoxOf(path: string) {
  const points = pointsOf(path)
  const xs = points.map((point) => point.x)
  const ys = points.map((point) => point.y)
  const left = Math.min(...xs) - PADDING
  const top = Math.min(...ys) - PADDING
  const width = Math.max(...xs) + PADDING - left
  const height = Math.max(...ys) + PADDING - top
  return `${left} ${top} ${width} ${height}`
}

// The shapes never change, so each box is only worked out once.
const shapes = new Map(
  territoryGeometries.map(({ id, path }) => [id as string, { path, viewBox: viewBoxOf(path) }]),
)

/** The outline of one territory, scaled to fit. Renders nothing for an unknown territory. */
export default function TerritoryShape({ id, className }: { id: TerritoryId; className?: string }) {
  const shape = shapes.get(id)
  if (!shape) return null

  return (
    <svg viewBox={shape.viewBox} aria-hidden="true" className={className}>
      <path
        d={shape.path}
        fill="currentColor"
        stroke="currentColor"
        strokeWidth={1}
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  )
}
