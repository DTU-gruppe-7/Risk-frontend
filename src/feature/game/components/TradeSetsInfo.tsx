import { CARD_TYPE_NAMES } from '../rules'
import type { BonusCardType, CardTradeMode, CardTradeRulesResponse } from '../types'
import CardIcon from './CardIcon'
import { SectionHeading } from './ui'

/** The trades shown when the bonus is progressive: the next one in the game, and the two after it. */
const UPCOMING_TRADE_LABELS = ['Nu', 'Næste', 'Derefter']

/** What a set is called in the list of what each set gives. */
function setName(types: BonusCardType[]) {
  const [first] = types
  return types.every((type) => type === first) ? CARD_TYPE_NAMES[first] : 'Én af hver'
}

interface TradeSetsInfoProps {
  /** The card trade rules from the server. */
  rules: CardTradeRulesResponse
  tradeMode: CardTradeMode
  /** What the next trades give with the progressive bonus, the next one first (from the game). */
  upcomingTradeValues: number[]
}

/** Which card sets can be traded and what they give, as the server says. */
export default function TradeSetsInfo({
  rules,
  tradeMode,
  upcomingTradeValues,
}: TradeSetsInfoProps) {
  const isFixed = tradeMode === 'Fixed'
  const ownedBonusText = `${rules.ownedTerritoryBonus} ekstra tropper`

  return (
    <div className="flex flex-col gap-1.5 border-t border-white/10 pt-3">
      <SectionHeading>{isFixed ? 'Et sæt giver' : 'Gyldige sæt'}</SectionHeading>
      <ul className="flex flex-col gap-1 text-sm">
        {rules.fixedSets.map((set) => (
          <li key={set.types.join()} className="flex items-center justify-between">
            <span className="flex items-center gap-1">
              {set.types.map((type, index) => (
                <CardIcon key={index} type={type} className="h-5 w-5" />
              ))}
              <span className="ml-1 text-stone-300">{setName(set.types)}</span>
            </span>
            {/* With a progressive bonus every set gives the same, shown below instead. */}
            {isFixed && (
              <span>
                <span className="font-semibold tabular-nums">{set.troops}</span> tropper
              </span>
            )}
          </li>
        ))}
      </ul>
      {!isFixed && upcomingTradeValues.length > 0 && (
        <>
          <SectionHeading className="mt-2">Et sæt giver</SectionHeading>
          <ol className="grid grid-cols-3 gap-2 text-center">
            {upcomingTradeValues.slice(0, UPCOMING_TRADE_LABELS.length).map((troops, index) => (
              <li
                key={UPCOMING_TRADE_LABELS[index]}
                className={`flex flex-col rounded-lg px-1 py-1 ${
                  index === 0 ? 'bg-amber-400/90 text-stone-950' : 'bg-white/5'
                }`}
              >
                <span className="text-lg leading-tight font-bold tabular-nums">{troops}</span>
                <span className={`text-xs ${index === 0 ? 'text-stone-800' : 'text-stone-400'}`}>
                  {UPCOMING_TRADE_LABELS[index]}
                </span>
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
        Et wild card kan erstatte et hvilket som helst kort.
      </p>
      <p className="text-xs text-stone-400">
        Ejer du territoriet på et af kortene, får du {ownedBonusText} på det. Højst én gang pr.
        bytte.
      </p>
      <p className="text-xs text-stone-400">
        Med {rules.forcedTradeHandSize} eller flere kort skal du bytte, før du kan fortsætte.
      </p>
    </div>
  )
}
