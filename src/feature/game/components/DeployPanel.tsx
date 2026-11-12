import { useState } from 'react'
import type { TerritoryNames, TerritoryState } from '../../map/types'
import type { GameActions } from '../useGameActions'
import { Button, ErrorText, Hint, Panel, TroopPicker } from './ui'

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

  return (
    <Panel title="Forstærkning">
      <p>
        Tropper at placere: <span className="text-xl font-semibold">{available}</span>
      </p>
      {mustTrade ? (
        <Hint>Du har for mange kort og skal bytte et sæt, før du kan fortsætte.</Hint>
      ) : available === 0 ? (
        // Placing the last troop starts the attack phase by itself, so this is only a way out
        // when a turn is in Deployment without troops.
        <Button disabled={endPhase.isPending} onClick={() => endPhase.mutate('Attack')}>
          Gå til angreb
        </Button>
      ) : territory ? (
        <>
          <Hint>Placér i {names[territory.territoryId] ?? territory.territoryId}</Hint>
          <TroopPicker label="Antal tropper" max={available} value={troops} onChange={setWanted} />
          <Button disabled={deploy.isPending} onClick={() => deploy.mutate({ territory, troops })}>
            Placér tropper
          </Button>
        </>
      ) : (
        <Hint>Vælg et af dine egne territorier.</Hint>
      )}
      <ErrorText error={deploy.error ?? endPhase.error} />
    </Panel>
  )
}
