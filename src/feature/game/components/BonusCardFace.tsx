import type { ReactNode } from 'react'
import TerritoryShape from '../../map/TerritoryShape'
import type { TerritoryNames } from '../../map/types'
import { CARD_TYPE_NAMES } from '../rules'
import type { BonusCardDto } from '../types'
import CardIcon from './CardIcon'

interface BonusCardFaceProps {
  card: BonusCardDto
  names: TerritoryNames
  /** Colours of the card's frame and background, e.g. to show it is selected. */
  className?: string
  /** Shown on top of the card, e.g. a badge in a corner. */
  children?: ReactNode
}

const DEFAULT_COLORS = 'border-white/15 bg-stone-800'

/** How a bonus card looks: its type, and the territory on it (a wild card has none). */
export default function BonusCardFace({
  card,
  names,
  className = DEFAULT_COLORS,
  children,
}: BonusCardFaceProps) {
  return (
    <div
      className={`relative flex aspect-[3/4] w-full flex-col items-center justify-end gap-1 rounded-lg border p-2 ${className}`}
    >
      {children}
      {card.territoryIdentifier ? (
        <>
          <CardIcon type={card.type} className="absolute top-1.5 left-1.5 h-6 w-6" />
          <TerritoryShape
            id={card.territoryIdentifier}
            className="min-h-0 w-full flex-1 px-1 pt-7 text-stone-300"
          />
        </>
      ) : (
        <span className="grid min-h-0 flex-1 place-items-center">
          <CardIcon type={card.type} className="w-3/5" />
        </span>
      )}
      <span className="line-clamp-2 text-center text-xs leading-tight font-semibold text-stone-200">
        {card.territoryIdentifier
          ? (names[card.territoryIdentifier] ?? card.territoryIdentifier)
          : CARD_TYPE_NAMES[card.type]}
      </span>
    </div>
  )
}
