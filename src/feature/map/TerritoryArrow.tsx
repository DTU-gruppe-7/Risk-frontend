import { arrowBetween } from './arrow'
import { BADGE_RADIUS, badgeCenterOf } from './badge'
import { ARROW_DARK, ARROW_LIGHT } from './colors'
import type { TerritoryGeometry } from './types'

/** The space between the arrow and the troop badges it points from and to. */
const GAP = BADGE_RADIUS + 2

interface TerritoryArrowProps {
  from: TerritoryGeometry
  to: TerritoryGeometry
}

/**
 * A black and white arrow from one territory's troops to another's, e.g. what is attacked or where
 * troops are moved. Dark dashes run along it towards the target, so it stands out as live.
 */
function TerritoryArrow({ from, to }: TerritoryArrowProps) {
  const arrow = arrowBetween(
    badgeCenterOf(from.labelPosition),
    badgeCenterOf(to.labelPosition),
    GAP,
  )
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
