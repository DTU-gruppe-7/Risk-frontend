import { useState } from 'react'
import type { TerritoryNames, TerritoryState } from '../../map/types'
import { MAX_ATTACK_DICE } from '../rules'
import type { GameActions } from '../useGameActions'
import BattleResult from './BattleResult'
import { Button, ErrorText, Hint, Panel, TroopPicker } from './ui'

interface AttackPanelProps {
  from: TerritoryState | null
  to: TerritoryState | null
  names: TerritoryNames
  battle: GameActions['battle']
  endPhase: GameActions['endPhase']
}

export default function AttackPanel({ from, to, names, battle, endPhase }: AttackPanelProps) {
  const [wantedDice, setWantedDice] = useState(MAX_ATTACK_DICE)
  const isPending = battle.isPending || endPhase.isPending
  const nameOf = (territory: TerritoryState) =>
    names[territory.territoryId] ?? territory.territoryId

  // One troop stays behind, so each die needs a troop besides that one.
  const maxDice = from ? Math.min(MAX_ATTACK_DICE, from.units - 1) : 0
  const dice = Math.min(wantedDice, maxDice)

  return (
    <Panel title="Angreb">
      {from && to ? (
        <>
          <Hint>
            {nameOf(from)} ({from.units}) angriber {nameOf(to)} ({to.units})
          </Hint>
          <TroopPicker label="Terninger" max={maxDice} value={dice} onChange={setWantedDice} />
          <Button disabled={isPending} onClick={() => battle.mutate({ from, to, dice })}>
            Angrib
          </Button>
          <Button disabled={isPending} onClick={() => battle.mutate({ from, to })}>
            Blitz (til det er afgjort)
          </Button>
        </>
      ) : (
        <Hint>
          {from
            ? `Vælg det naboterritorium, ${nameOf(from)} skal angribe.`
            : 'Vælg et af dine territorier med mindst 2 tropper.'}
        </Hint>
      )}
      {battle.data && <BattleResult report={battle.data} />}
      <ErrorText error={battle.error ?? endPhase.error} />
      <Button variant="secondary" disabled={isPending} onClick={() => endPhase.mutate('Fortify')}>
        Afslut angreb
      </Button>
    </Panel>
  )
}
