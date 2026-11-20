import { useState } from 'react'
import type { TerritoryNames, TerritoryState } from '../../map/types'
import { troopWord } from '../troopWord'
import type { GameActions } from '../useGameActions'
import { ActionBox, Button, ErrorText, Hint } from './ui'

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

const STEP_BUTTON =
  'grid h-7 w-7 shrink-0 place-items-center rounded-full bg-stone-700 text-base leading-none hover:bg-stone-600 disabled:opacity-40'

export default function DeployPanel(props: DeployPanelProps) {
  const { available, territory, mustTrade, names, deploy, endPhase } = props
  const [wanted, setWanted] = useState(1)
  const troops = Math.min(wanted, available)
  const canPlace = !mustTrade && available > 0

  return (
    <ActionBox>
      <header className="flex items-center gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-emerald-700 text-lg font-bold tabular-nums ring-2 ring-emerald-400/40">
          {available}
        </span>
        <div className="min-w-0">
          <h2 className="text-xs font-semibold tracking-wide text-stone-400 uppercase">
            Forstærkning
          </h2>
          <p className="truncate font-semibold">
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
      ) : (
        territory && (
          <>
            <div className="flex items-center gap-2">
              <button
                type="button"
                aria-label="Færre tropper"
                className={STEP_BUTTON}
                disabled={troops <= 1}
                onClick={() => setWanted(troops - 1)}
              >
                −
              </button>
              <input
                type="range"
                aria-label="Antal tropper"
                className="min-w-0 flex-1 accent-emerald-500"
                min={1}
                max={available}
                value={troops}
                disabled={available <= 1}
                onChange={(event) => setWanted(Number(event.target.value))}
              />
              <button
                type="button"
                aria-label="Flere tropper"
                className={STEP_BUTTON}
                disabled={troops >= available}
                onClick={() => setWanted(troops + 1)}
              >
                +
              </button>
            </div>
            <Button
              size="sm"
              disabled={deploy.isPending}
              onClick={() => deploy.mutate({ territory, troops })}
            >
              Placér {troops} {troopWord(troops)}
            </Button>
          </>
        )
      )}
      <ErrorText error={deploy.error ?? endPhase.error} />
    </ActionBox>
  )
}
