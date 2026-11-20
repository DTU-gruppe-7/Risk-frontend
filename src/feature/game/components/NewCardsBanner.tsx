import type { TerritoryNames } from '../../map/types'
import type { BonusCardDto } from '../types'
import Announcement from './Announcement'
import BonusCardFace from './BonusCardFace'

interface NewCardsBannerProps {
  /** The cards to announce (see useHand). Nothing is shown when there are none. */
  cards: BonusCardDto[]
  names: TerritoryNames
  scale: number
  /** Called when the cards have been shown. */
  onDone: () => void
}

/** Briefly shows the bonus cards the player has just got. */
export default function NewCardsBanner({ cards, names, scale, onDone }: NewCardsBannerProps) {
  if (cards.length === 0) return null

  return (
    // Keyed by the cards, so the animation starts over if more cards come before it has ended.
    <Announcement key={cards.map((card) => card.id).join()} scale={scale} onDone={onDone}>
      <p className="text-lg font-semibold">
        {cards.length === 1 ? 'Nyt bonuskort' : `${cards.length} nye bonuskort`}
      </p>
      <ul className="flex gap-3">
        {cards.map((card) => (
          <li key={card.id} className="w-28">
            <BonusCardFace card={card} names={names} />
          </li>
        ))}
      </ul>
    </Announcement>
  )
}
