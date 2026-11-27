import { useEffect, useEffectEvent, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { gameHub } from '../../realtime/gameHub'
import { handQuery } from './queries'
import type { BonusCardDto, CardsReceivedDto } from './types'

const NO_CARDS: BonusCardDto[] = []

/**
 * The current user's bonus cards as the server has them, and the cards they have just got, to
 * announce.
 *
 * New cards are pushed by the game hub (CardsReceived), only to the player who got them. A push sent
 * while the player was away is not sent again, so the hand itself is fetched when the page opens
 * and again after every (re)connection (see useGameHub).
 */
export function useHand(gameId: string) {
  const queryClient = useQueryClient()
  // A host who is not playing gets an empty hand.
  const { data: cards = NO_CARDS } = useQuery(handQuery(gameId))
  /** Cards received and not announced yet, oldest first. Each is announced on its own. */
  const [received, setReceived] = useState<CardsReceivedDto[]>([])

  const onCardsReceived = useEffectEvent((message: CardsReceivedDto) => {
    // A message without cards would never be announced, and hold up the announcements after it.
    if (message.gameId !== gameId || message.cards.length === 0) return
    setReceived((queue) => [...queue, message])
    void queryClient.invalidateQueries({ queryKey: handQuery(gameId).queryKey })
  })

  useEffect(() => gameHub.on('CardsReceived', (message) => onCardsReceived(message)), [])

  return {
    cards,
    /** The cards to announce next, or undefined. */
    newCards: received.at(0),
    /** Call when the new cards have been announced. */
    dismissNewCards: () => setReceived((queue) => queue.slice(1)),
    /** True while new cards are being announced, so other announcements can wait their turn. */
    isAnnouncing: received.length > 0,
  }
}

export type Hand = ReturnType<typeof useHand>
