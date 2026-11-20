import { useState } from 'react'
import type { TerritoryNames, TerritoryState } from '../../map/types'
import {
  CARD_TYPE_NAMES,
  CARDS_PER_TRADE,
  FORCED_TRADE_HAND_SIZE,
  isValidCardSet,
  progressiveTradeValue,
  TRADE_SETS,
  tradeValueOf,
} from '../rules'
import type { BonusCardDto, BonusCardType } from '../types'
import { useTradeCards } from '../useGameActions'
import BonusCardFace from './BonusCardFace'
import CardIcon from './CardIcon'
import { Button, ErrorText, Hint, Panel } from './ui'

interface CardsPanelProps {
  gameId: string
  playerId: string
  /** The cards the player holds (see useHand). */
  cards: BonusCardDto[]
  /** Cards can only be traded in the player's own Deployment phase. */
  canTrade: boolean
  /**
   * Card sets traded in the game so far when the card bonus is progressive, or null when the
   * bonus is fixed and depends on the cards in the set.
   */
  setsTraded: number | null
  /** Used to see which of the cards show a territory the player holds. */
  territories: TerritoryState[]
  names: TerritoryNames
}

const MAX_CARDS_PER_ROW = 5

/** The trades shown when the bonus is progressive: the next one in the game, and the two after it. */
const UPCOMING_TRADES = ['Nu', 'Næste', 'Derefter']

/** What a set is called in the list of what each set gives. */
function setName(types: BonusCardType[]) {
  const [first] = types
  return types.every((type) => type === first) ? CARD_TYPE_NAMES[first] : 'Én af hver'
}

/** The player's bonus cards, and trading three of them for extra troops. */
export default function CardsPanel(props: CardsPanelProps) {
  const { gameId, playerId, cards, canTrade, setsTraded, territories, names } = props
  const trade = useTradeCards(gameId)
  const [selectedIds, setSelectedIds] = useState<string[]>([])

  // Cards leave the hand when they are traded, so only count the ones still in it.
  const selected = cards.filter((card) => selectedIds.includes(card.id))
  const isValidSet = isValidCardSet(selected)
  // With a progressive bonus every valid set gives the same, whatever cards are in it.
  const value =
    setsTraded === null
      ? tradeValueOf(selected)
      : isValidSet
        ? progressiveTradeValue(setsTraded)
        : null
  const canRedeem = canTrade && isValidSet

  // Trading a card with a territory the player holds puts one extra troop on that territory.
  const ownedIds = new Set(
    territories.filter((territory) => territory.ownerId === playerId).map((t) => t.territoryId),
  )
  const givesBonus = (card: BonusCardDto) =>
    card.territoryIdentifier !== null && ownedIds.has(card.territoryIdentifier)
  // Only one card per trade gives the extra troop: the first of the traded cards that can.
  const bonusCard = selected.find(givesBonus)

  function toggle(card: BonusCardDto) {
    const ids = selected.map((other) => other.id)
    setSelectedIds(ids.includes(card.id) ? ids.filter((id) => id !== card.id) : [...ids, card.id])
  }

  return (
    <Panel title={`Kort (${cards.length})`}>
      {cards.length === 0 && (
        <Hint>Erobrer du et territorium i din tur, får du et kort, når din tur er slut.</Hint>
      )}
      {/* Fixed card widths, so the panel is exactly as wide as the cards in it need. */}
      <ul
        className="grid justify-center gap-3"
        style={{
          gridTemplateColumns: `repeat(${Math.min(Math.max(cards.length, 1), MAX_CARDS_PER_ROW)}, 7rem)`,
        }}
      >
        {cards.map((card) => {
          const isSelected = selectedIds.includes(card.id)
          // Another card in the set already gives the one extra troop of this trade.
          const bonusIsUsed = isSelected && bonusCard !== undefined && bonusCard !== card
          return (
            <li key={card.id}>
              <button
                type="button"
                aria-pressed={isSelected}
                disabled={!isSelected && selected.length >= CARDS_PER_TRADE}
                onClick={() => toggle(card)}
                className="block w-full rounded-lg disabled:opacity-50"
              >
                <BonusCardFace
                  card={card}
                  names={names}
                  className={
                    isSelected
                      ? 'border-emerald-400 bg-emerald-900/60'
                      : 'border-stone-600 bg-stone-700 hover:bg-stone-600'
                  }
                >
                  {givesBonus(card) && (
                    <span
                      title={
                        bonusIsUsed
                          ? 'Kun ét kort pr. bytte giver en ekstra trop'
                          : 'Du ejer territoriet og får 1 ekstra trop på det ved bytte'
                      }
                      className={`absolute top-2 right-2 rounded-full px-2 text-sm font-bold ${
                        bonusIsUsed
                          ? 'bg-stone-600 text-stone-400 line-through'
                          : 'bg-emerald-600 text-white'
                      }`}
                    >
                      +1
                    </span>
                  )}
                </BonusCardFace>
              </button>
            </li>
          )
        })}
      </ul>
      {cards.length >= FORCED_TRADE_HAND_SIZE && (
        <Hint>Med {FORCED_TRADE_HAND_SIZE} eller flere kort skal du bytte i din næste tur.</Hint>
      )}
      {/* Always shown, and grey until three cards that make a set are picked. */}
      <Button
        variant={canRedeem ? 'primary' : 'secondary'}
        disabled={!canRedeem || trade.isPending}
        onClick={() => trade.mutate(selected.map((card) => card.id))}
      >
        Indløs{value !== null && ` for ${value} tropper`}
      </Button>
      {isValidSet && !canTrade && <Hint>Du kan kun indløse i din egen forstærkningsfase.</Hint>}
      {bonusCard?.territoryIdentifier && (
        <Hint>
          +1 trop på {names[bonusCard.territoryIdentifier] ?? bonusCard.territoryIdentifier}, fordi
          du ejer territoriet.
        </Hint>
      )}
      {trade.data && <Hint>Du fik {trade.data.troopsAwarded} tropper for dine kort.</Hint>}
      <ErrorText error={trade.error} />

      <div className="flex flex-col gap-1 border-t border-stone-700 pt-2">
        <h3 className="text-xs font-semibold tracking-wide text-stone-400 uppercase">
          Et sæt giver
        </h3>
        {setsTraded === null ? (
          <ul className="flex flex-col gap-1 text-sm">
            {TRADE_SETS.map((set) => (
              <li key={set.types.join()} className="flex items-center justify-between">
                <span className="flex items-center gap-1">
                  {set.types.map((type, index) => (
                    <CardIcon key={index} type={type} className="h-5 w-5" />
                  ))}
                  <span className="ml-1 text-stone-300">{setName(set.types)}</span>
                </span>
                <span>
                  <span className="font-semibold tabular-nums">{set.troops}</span> tropper
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <>
            <ol className="grid grid-cols-3 gap-2 text-center">
              {UPCOMING_TRADES.map((label, index) => (
                <li
                  key={label}
                  className={`flex flex-col rounded px-1 py-1 ${
                    index === 0 ? 'bg-emerald-800' : 'bg-stone-700'
                  }`}
                >
                  <span className="text-lg leading-tight font-bold tabular-nums">
                    {progressiveTradeValue(setsTraded + index)}
                  </span>
                  <span className="text-xs text-stone-300">{label}</span>
                </li>
              ))}
            </ol>
            <p className="text-xs text-stone-400">
              Bonussen stiger, hver gang en spiller indløser. Alle gyldige sæt giver det samme.
            </p>
          </>
        )}
        <p className="flex items-center gap-1 text-xs text-stone-400">
          <CardIcon type="Wild" className="h-4 w-4 shrink-0" />
          Jokeren kan erstatte et hvilket som helst kort.
        </p>
        <p className="text-xs text-stone-400">
          Ejer du territoriet på et af kortene, får du 1 ekstra trop på det. Højst én pr. bytte.
        </p>
      </div>
    </Panel>
  )
}
