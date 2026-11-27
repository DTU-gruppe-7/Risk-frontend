import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import type { TerritoryNames, TerritoryState } from '../../map/types'
import { cardTradeRulesQuery, tradePreviewQuery } from '../queries'
import type { BonusCardDto, CardTradeMode } from '../types'
import { useTradeCards } from '../useGameActions'
import BonusCardFace from './BonusCardFace'
import TradeSetsInfo from './TradeSetsInfo'
import { Button, CountBadge, ErrorText, Hint, Panel } from './ui'

interface CardsPanelProps {
  gameId: string
  playerId: string
  /** The cards the player holds (see useHand). */
  cards: BonusCardDto[]
  /** Cards can only be traded in the player's own Deployment phase. */
  canTrade: boolean
  /** The server will not let the player go on before they have traded. */
  mustTrade: boolean
  tradeMode: CardTradeMode
  /** What the next trades give with the progressive bonus (from the game). */
  upcomingTradeValues: number[]
  /** Used to see which cards show a territory the player holds, and to name territories. */
  territories: TerritoryState[]
  names: TerritoryNames
}

/** The panel sits in the narrow side bar, so two cards fit side by side. */
const CARDS_PER_ROW = 2

/**
 * The player's bonus cards, and trading a set of them for extra troops. What a set gives and which
 * card gives the bonus for a territory the player holds is asked of the server (a trade preview).
 */
export default function CardsPanel(props: CardsPanelProps) {
  const { gameId, playerId, cards, canTrade, mustTrade, territories, names } = props
  const trade = useTradeCards(gameId)
  const { data: rules } = useQuery(cardTradeRulesQuery())
  // In the order picked: the order decides which card gives the bonus, as in the real trade.
  const [pickedIds, setPickedIds] = useState<string[]>([])

  // Cards leave the hand when they are traded, so only count the ones still in it.
  const selected = pickedIds
    .map((id) => cards.find((card) => card.id === id))
    .filter((card) => card !== undefined)
  const selectedIds = selected.map((card) => card.id)
  const isFull = rules !== undefined && selected.length >= rules.cardsPerTrade
  const { data: preview } = useQuery({
    ...tradePreviewQuery(gameId, selectedIds),
    enabled: rules !== undefined && selected.length === rules.cardsPerTrade,
  })
  const canRedeem = canTrade && preview?.isValid === true

  const territoryOf = (stateId: string | null | undefined) =>
    territories.find((territory) => territory.stateId === stateId)
  const nameOf = (territoryId: string) => names[territoryId] ?? territoryId
  // A card showing a territory the player holds may give extra troops on it when traded.
  const ownedIds = new Set(
    territories.filter((territory) => territory.ownerId === playerId).map((t) => t.territoryId),
  )
  const showsOwnedTerritory = (card: BonusCardDto) =>
    card.territoryIdentifier !== null && ownedIds.has(card.territoryIdentifier)
  // The server says which territory a trade of the picked cards gives the extra troops on.
  const bonusTerritory = preview?.isValid ? territoryOf(preview.bonusTerritoryId) : undefined
  const bonusCard = selected.find(
    (card) => card.territoryIdentifier === bonusTerritory?.territoryId,
  )
  const tradedBonusTerritory = territoryOf(trade.data?.bonusTerritoryId)

  function toggle(card: BonusCardDto) {
    setPickedIds(
      selectedIds.includes(card.id)
        ? selectedIds.filter((id) => id !== card.id)
        : [...selectedIds, card.id],
    )
  }

  return (
    <Panel title="Kort" badge={<CountBadge>{cards.length}</CountBadge>}>
      {cards.length === 0 && (
        <Hint>Erobrer du et territorium i din tur, får du et kort, når din tur er slut.</Hint>
      )}
      <ul
        className="grid gap-2"
        style={{ gridTemplateColumns: `repeat(${CARDS_PER_ROW}, minmax(0, 1fr))` }}
      >
        {cards.map((card) => {
          const isSelected = selectedIds.includes(card.id)
          // The trade gives the extra troops on another card's territory, not this one's.
          const bonusIsUsed = isSelected && bonusCard !== undefined && bonusCard !== card
          return (
            <li key={card.id}>
              <button
                type="button"
                aria-pressed={isSelected}
                disabled={!isSelected && isFull}
                onClick={() => toggle(card)}
                className="block w-full rounded-lg transition hover:-translate-y-0.5 disabled:opacity-40 disabled:hover:translate-y-0"
              >
                <BonusCardFace
                  card={card}
                  names={names}
                  className={
                    isSelected
                      ? 'border-amber-300 bg-amber-300/15 ring-2 ring-amber-300/40'
                      : 'border-white/10 bg-white/5 hover:border-white/25'
                  }
                >
                  {rules && showsOwnedTerritory(card) && (
                    <span
                      title={
                        bonusIsUsed
                          ? 'Et andet af kortene giver de ekstra tropper ved dette bytte'
                          : `Du ejer territoriet og kan få ${rules.ownedTerritoryBonus} ekstra tropper på det ved bytte`
                      }
                      className={`absolute top-2 right-2 rounded-full px-2 text-sm font-bold ${
                        bonusIsUsed
                          ? 'bg-stone-700 text-stone-400 line-through'
                          : 'bg-emerald-500 text-stone-950'
                      }`}
                    >
                      +{rules.ownedTerritoryBonus}
                    </span>
                  )}
                </BonusCardFace>
              </button>
            </li>
          )
        })}
      </ul>
      {mustTrade && (
        <Hint>Du har for mange kort og skal indløse et sæt, før du kan fortsætte.</Hint>
      )}
      {/* Always shown, and grey until the picked cards make a set the server accepts. */}
      <Button
        variant={canRedeem ? 'primary' : 'secondary'}
        disabled={!canRedeem || trade.isPending}
        onClick={() => trade.mutate(selectedIds)}
      >
        Indløs{preview?.isValid && preview.troops !== null && ` for ${preview.troops} tropper`}
      </Button>
      {preview && !preview.isValid && <Hint>De valgte kort er ikke et gyldigt sæt.</Hint>}
      {preview?.isValid && !canTrade && (
        <Hint>Du kan kun indløse i din egen forstærkningsfase.</Hint>
      )}
      {preview?.isValid && bonusTerritory && preview.bonusTroops > 0 && (
        <Hint>
          {preview.bonusTroops} ekstra tropper på {nameOf(bonusTerritory.territoryId)}, fordi du
          ejer territoriet.
        </Hint>
      )}
      {trade.data && (
        <Hint>
          Du fik {trade.data.troopsAwarded} tropper for dine kort
          {tradedBonusTerritory &&
            trade.data.bonusTroops > 0 &&
            ` og ${trade.data.bonusTroops} ekstra på ${nameOf(tradedBonusTerritory.territoryId)}`}
          .
        </Hint>
      )}
      <ErrorText error={trade.error} />

      {rules && (
        <TradeSetsInfo
          rules={rules}
          tradeMode={props.tradeMode}
          upcomingTradeValues={props.upcomingTradeValues}
        />
      )}
    </Panel>
  )
}
