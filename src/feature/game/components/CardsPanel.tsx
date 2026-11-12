import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import type { TerritoryNames } from '../../map/types'
import { handQuery } from '../queries'
import { CARDS_PER_TRADE, FORCED_TRADE_HAND_SIZE, isValidCardSet } from '../rules'
import type { BonusCardDto, BonusCardType } from '../types'
import { useTradeCards } from '../useGameActions'
import { Button, ErrorText, Hint, Panel } from './ui'

const CARD_TYPE_NAMES: Record<BonusCardType, string> = {
  Infantry: 'Infanteri',
  Cavalry: 'Kavaleri',
  Artillery: 'Artilleri',
  Wild: 'Joker',
}

interface CardsPanelProps {
  gameId: string
  playerId: string
  /** Cards can only be traded in the player's own Deployment phase. */
  canTrade: boolean
  names: TerritoryNames
}

/** The player's bonus cards, and trading three of them for extra troops. */
export default function CardsPanel({ gameId, playerId, canTrade, names }: CardsPanelProps) {
  const { data: cards = [] } = useQuery(handQuery(gameId, playerId))
  const trade = useTradeCards(gameId)
  const [selectedIds, setSelectedIds] = useState<string[]>([])

  // Cards leave the hand when they are traded, so only count the ones still in it.
  const selected = cards.filter((card) => selectedIds.includes(card.id))

  function toggle(card: BonusCardDto) {
    const ids = selected.map((other) => other.id)
    setSelectedIds(ids.includes(card.id) ? ids.filter((id) => id !== card.id) : [...ids, card.id])
  }

  return (
    <Panel title={`Kort (${cards.length})`}>
      {cards.length === 0 && <Hint>Du får et kort, når du erobrer et territorium i din tur.</Hint>}
      <ul className="flex flex-col gap-1">
        {cards.map((card) => {
          const isSelected = selectedIds.includes(card.id)
          return (
            <li key={card.id}>
              <button
                type="button"
                aria-pressed={isSelected}
                disabled={!isSelected && selected.length >= CARDS_PER_TRADE}
                onClick={() => toggle(card)}
                className={`flex w-full justify-between rounded px-2 py-1 text-left text-sm disabled:opacity-50 ${
                  isSelected ? 'bg-emerald-800' : 'bg-stone-700 hover:bg-stone-600'
                }`}
              >
                <span>{CARD_TYPE_NAMES[card.type]}</span>
                {card.territoryIdentifier && (
                  <span className="text-stone-300">
                    {names[card.territoryIdentifier] ?? card.territoryIdentifier}
                  </span>
                )}
              </button>
            </li>
          )
        })}
      </ul>
      {cards.length >= FORCED_TRADE_HAND_SIZE && (
        <Hint>Med {FORCED_TRADE_HAND_SIZE} eller flere kort skal du bytte i din næste tur.</Hint>
      )}
      {cards.length >= CARDS_PER_TRADE && (
        <>
          <Hint>Byt tre ens, tre forskellige eller et sæt med en joker for ekstra tropper.</Hint>
          <Button
            disabled={!canTrade || !isValidCardSet(selected) || trade.isPending}
            onClick={() => trade.mutate(selected.map((card) => card.id))}
          >
            Byt kort
          </Button>
        </>
      )}
      {trade.data && <Hint>Du fik {trade.data.troopsAwarded} tropper for dine kort.</Hint>}
      <ErrorText error={trade.error} />
    </Panel>
  )
}
