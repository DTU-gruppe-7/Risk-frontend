import { useState } from 'react'
import type { TerritoryNames, TerritoryState } from '../../map/types'
import { troopWord } from '../troopWord'
import type { GameActions } from '../useGameActions'
import { ActionBox, Button, ErrorText, Hint, SectionHeading, TroopPicker } from './ui'

interface DeployPanelProps {
  /** Troops the player still has to place. */
  available: number
  territory: TerritoryState | null
  /** The player holds too many cards and has to trade before placing troops. */
  mustTrade: boolean
  names: TerritoryNames
  deploy: GameActions['deploy']
  endPhase: GameActions['endPhase']
}

export default function DeployPanel(props: DeployPanelProps) {
  const { available, territory, mustTrade, names, deploy, endPhase } = props
  const [wanted, setWanted] = useState(1)
  const troops = Math.min(wanted, available)
  const canPlace = !mustTrade && available > 0

  return (
    <ActionBox>
      <header className="flex items-center gap-3">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-linear-to-b from-amber-300 to-amber-600 text-lg font-bold text-stone-950 tabular-nums shadow-lg ring-2 shadow-amber-900/40 ring-amber-200/30">
          {available}
        </span>
        <div className="min-w-0">
          <SectionHeading>Forstærkning</SectionHeading>
          <p className="truncate font-serif text-base text-amber-50">
            {canPlace && territory
              ? (names[territory.territoryId] ?? territory.territoryId)
              : 'tropper at placere'}
          </p>
        </div>
      </header>

      {mustTrade ? (
        <Hint>Du har for mange kort og skal bytte et sæt, før du kan fortsætte.</Hint>
      ) : available === 0 ? (
        // Placing the last troop starts the attack phase by itself, so this is only a way out
        // when a turn is in Deployment without troops.
        <Button size="sm" disabled={endPhase.isPending} onClick={() => endPhase.mutate('Attack')}>
          Gå til angreb
        </Button>
      ) : // Placing starts on the map, so the box says what to click until a territory is picked.
      territory ? (
        <>
          <TroopPicker label="Antal tropper" max={available} value={troops} onChange={setWanted} />
          <Button
            size="sm"
            disabled={deploy.isPending}
            onClick={() => deploy.mutate({ territory, troops })}
          >
            Placér {troops} {troopWord(troops)}
          </Button>
        </>
      ) : (
        <Hint>Klik på et af dine territorier for at placere tropper.</Hint>
      )}
      <ErrorText error={deploy.error ?? endPhase.error} />
    </ActionBox>
  )
}
