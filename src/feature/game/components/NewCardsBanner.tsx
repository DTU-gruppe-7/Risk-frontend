import type { TerritoryNames } from '../../map/types'
import type { CardsReceivedDto } from '../types'
import Announcement from './Announcement'
import BonusCardFace from './BonusCardFace'

interface NewCardsBannerProps {
  /** The cards to announce (see useHand). Nothing is shown without any. */
  received: CardsReceivedDto | undefined
  names: TerritoryNames
  scale: number
  /** Called when the cards have been shown. */
  onDone: () => void
}

/** The heading, after why the player got the cards. */
function headingOf({ cards, reason }: CardsReceivedDto) {
  const count = cards.length === 1 ? 'Et kort' : `${cards.length} kort`
  if (reason === 'Elimination') return `${count} overtaget fra en spiller, du slog ud`
  return cards.length === 1 ? 'Nyt bonuskort' : `${cards.length} nye bonuskort`
}

/** Briefly shows the bonus cards the player has just got. */
export default function NewCardsBanner({ received, names, scale, onDone }: NewCardsBannerProps) {
  if (!received || received.cards.length === 0) return null

  return (
    // Keyed by the cards, so the animation starts over for the next cards.
    <Announcement key={received.cards.map((card) => card.id).join()} scale={scale} onDone={onDone}>
      <p className="text-lg font-semibold">{headingOf(received)}</p>
      <ul className="flex gap-3">
        {received.cards.map((card) => (
          <li key={card.id} className="w-28">
            <BonusCardFace card={card} names={names} />
          </li>
        ))}
      </ul>
    </Announcement>
  )
}
