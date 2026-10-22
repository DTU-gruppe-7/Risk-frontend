import type { Point } from './types'

interface TerritoryLabelProps {
  position: Point
  name: string
  units: number | null
  ownerColor: string | null
}

const INK = '#4a3522'
const PAPER = '#f3e7c9'

function TerritoryLabel({ position, name, ownerColor, units }: TerritoryLabelProps) {
  return (
    <g transform={`translate(${position.x} ${position.y})`}>
      <text
        y={-5}
        textAnchor="middle"
        fontFamily="Georgia, serif"
        fontStyle="italic"
        fontSize={7.5}
        fill={INK}
        stroke={PAPER}
        strokeWidth={2}
        strokeOpacity={0.8}
        paintOrder="stroke"
      >
        {name}
      </text>
      {/* No troop badge when there are no troops to show (e.g. a blizzard) */}
      {units !== null && (
        <>
          <circle cy={5} r={6} fill={ownerColor ?? PAPER} stroke={INK} strokeWidth={0.8} />
          <text
            y={5}
            textAnchor="middle"
            dominantBaseline="central"
            fontFamily="Georgia, serif"
            fontWeight="bold"
            fontSize={7.5}
            fill={ownerColor ? PAPER : INK}
          >
            {units}
          </text>
        </>
      )}
    </g>
  )
}

export default TerritoryLabel
