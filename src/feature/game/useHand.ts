import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { handQuery } from './queries'
import { eliminatedCountOf } from './rules'
import type { BonusCardDto, GameDto } from './types'

const NO_CARDS: BonusCardDto[] = []

/**
 * The current user's bonus cards, as they should be shown.
 *
 * The card for conquering a territory is dealt when the attack phase ends, but is kept back until
 * the player's turn is over, as when drawing a card at the end of the turn. The cards taken from a
 * knocked out player are shown at once: they may have to be traded before the turn can go on.
 * The hand already held when the page is opened is shown as it is.
 */
export function useHand(game: GameDto, playerId: string | undefined) {
  const {
    data: hand,
    dataUpdatedAt,
    errorUpdatedAt,
    refetch,
  } = useQuery({
    ...handQuery(game.id, playerId ?? ''),
    // A host who is not playing has no hand.
    enabled: playerId !== undefined,
  })
  // When the hand was last fetched. A failed fetch counts too, so we never wait for ever.
  const fetchedAt = Math.max(dataUpdatedAt, errorUpdatedAt)

  const isMyTurn = game.state === 'InProgress' && game.currentPlayerId === playerId
  const eliminated = eliminatedCountOf(game)

  /** The cards that have been shown. Null until the hand has been loaded. */
  const [shownIds, setShownIds] = useState<ReadonlySet<string> | null>(null)
  /** Cards that have just been shown, until they have been announced. */
  const [newCards, setNewCards] = useState<BonusCardDto[]>(NO_CARDS)
  const [seen, setSeen] = useState({ isMyTurn, eliminated })
  /**
   * Set when new cards may have been dealt: our turn ended, or a player was knocked out in our turn.
   * The new cards are shown with the first hand fetched after this time.
   */
  const [revealAfter, setRevealAfter] = useState<number | null>(null)

  // State is updated while rendering, so the cards show in the same render as the change.
  if (seen.isMyTurn !== isMyTurn || seen.eliminated !== eliminated) {
    setSeen({ isMyTurn, eliminated })
    const turnEnded = seen.isMyTurn && !isMyTurn
    const knockedOutInMyTurn = isMyTurn && eliminated > seen.eliminated
    if (turnEnded || knockedOutInMyTurn) setRevealAfter(fetchedAt)
  }

  // The hand is not pushed by the game hub, so fetch it ourselves when new cards may have come.
  const isWaiting = revealAfter !== null
  useEffect(() => {
    if (isWaiting) void refetch()
  }, [isWaiting, refetch])

  if (hand && shownIds === null) setShownIds(new Set(hand.map((card) => card.id)))

  if (revealAfter !== null && fetchedAt > revealAfter && shownIds) {
    setRevealAfter(null)
    const unseen = (hand ?? NO_CARDS).filter((card) => !shownIds.has(card.id))
    if (unseen.length > 0) {
      setNewCards(unseen)
      setShownIds(new Set([...shownIds, ...unseen.map((card) => card.id)]))
    }
  }

  return {
    /** The cards in the hand that may be shown. */
    cards: hand && shownIds ? hand.filter((card) => shownIds.has(card.id)) : (hand ?? NO_CARDS),
    /** Cards that have just been shown, to announce. */
    newCards,
    /** Call when the new cards have been announced. */
    dismissNewCards: () => setNewCards(NO_CARDS),
    /**
     * True while new cards are about to be announced or are being announced, so other
     * announcements can wait their turn.
     */
    isAnnouncing: isWaiting || newCards.length > 0,
  }
}

export type Hand = ReturnType<typeof useHand>
