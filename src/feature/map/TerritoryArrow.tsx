import { arrowAlong } from './arrow'
import { BADGE_RADIUS, badgeCenterOf } from './badge'
import { landCrossingOf } from './borders'
import { ARROW_DARK, ARROW_LIGHT } from './colors'
import type { Point, TerritoryGeometry } from './types'

/** The space between the arrow and the troop badges it points from and to. */
const GAP = BADGE_RADIUS + 2
/** A border crossing closer than this to a badge is left out, so the arrow has room there. */
const MIN_CROSSING_DISTANCE = 2 * GAP

interface TerritoryArrowProps {
  /** The territories the arrow runs through, from the first to the last. */
  route: TerritoryGeometry[]
}

/**
 * The points the arrow runs through: the troops of each territory, and between two neighbours on
 * land a point on their border, so the arrow keeps to land where it can. Between neighbours that
 * are only connected across the sea, it goes straight over the water.
 */
function waypointsOf(route: TerritoryGeometry[]): Point[] {
  const badges = route.map((territory) => badgeCenterOf(territory.labelPosition))
  const isRoomy = (crossing: Point, badge: Point) =>
    Math.hypot(crossing.x - badge.x, crossing.y - badge.y) >= MIN_CROSSING_DISTANCE

  return badges.flatMap((badge, index) => {
    const next = badges[index + 1]
    if (!next) return [badge]
    const crossing = landCrossingOf(route[index].id, route[index + 1].id, badge, next)
    return crossing && isRoomy(crossing, badge) && isRoomy(crossing, next)
      ? [badge, crossing]
      : [badge]
  })
}

/**
 * A black and white arrow through territories' troops, e.g. what is attacked or the way troops are
 * moved. Dark dashes run along it towards the target, so it stands out as live.
 */
function TerritoryArrow({ route }: TerritoryArrowProps) {
  const arrow = arrowAlong(waypointsOf(route), GAP)
  if (!arrow) return null

  return (
    <g fill="none" strokeLinecap="round" strokeLinejoin="round" pointerEvents="none">
      {arrow.offsetsX.map((offsetX) => (
        <g key={offsetX} transform={`translate(${offsetX} 0)`}>
          <path d={arrow.path} stroke={ARROW_DARK} strokeWidth={4} />
          <path d={arrow.path} stroke={ARROW_LIGHT} strokeWidth={2.4} />
          <path
            d={arrow.path}
            stroke={ARROW_DARK}
            strokeWidth={1.2}
            strokeDasharray="3 5"
            className="animate-arrow-flow motion-reduce:animate-none"
          />
          <polygon points={arrow.head} fill={ARROW_LIGHT} stroke={ARROW_DARK} strokeWidth={1.2} />
        </g>
      ))}
    </g>
  )
}

export default TerritoryArrow
