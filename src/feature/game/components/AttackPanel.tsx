import { useState } from 'react'
import type { TerritoryNames, TerritoryState } from '../../map/types'
import { MAX_ATTACK_DICE } from '../rules'
import type { GameActions } from '../useGameActions'
import BattleResult from './BattleResult'
import TroopRoute from './TroopRoute'
import { ActionBox, Button, ErrorText, Hint, TroopPicker } from './ui'

interface AttackPanelProps {
  from: TerritoryState | null
  to: TerritoryState | null
  names: TerritoryNames
  battle: GameActions['battle']
  /** The last roll is still being shown on the map: its result waits, and so does the next roll. */
  isRollingDice: boolean
  endPhase: GameActions['endPhase']
}

export default function AttackPanel({
  from,
  to,
  names,
  battle,
  isRollingDice,
  endPhase,
}: AttackPanelProps) {
  const [wantedDice, setWantedDice] = useState(MAX_ATTACK_DICE)
  const isPending = battle.isPending || endPhase.isPending || isRollingDice
  const nameOf = (territory: TerritoryState) =>
    names[territory.territoryId] ?? territory.territoryId

  // One troop stays behind, so each die needs a troop besides that one.
  const maxDice = from ? Math.min(MAX_ATTACK_DICE, from.units - 1) : 0
  const dice = Math.min(wantedDice, maxDice)

  return (
    <ActionBox title="Angreb">
      {from && to ? (
        <>
          <TroopRoute from={from} to={to} names={names} verb="angriber" />
          <TroopPicker label="Terninger" max={maxDice} value={dice} onChange={setWantedDice} />
          <div className="grid grid-cols-2 gap-2">
            <Button
              size="sm"
              disabled={isPending}
              onClick={() => battle.mutate({ from, to, dice })}
            >
              Angrib
            </Button>
            <Button
              size="sm"
              title="Angrib igen og igen, til det er afgjort"
              disabled={isPending}
              onClick={() => battle.mutate({ from, to })}
            >
              Lynangreb
            </Button>
          </div>
        </>
      ) : (
        <Hint>
          {from
            ? `Vælg det naboterritorium, ${nameOf(from)} skal angribe.`
            : 'Vælg et af dine territorier med mindst 2 tropper.'}
        </Hint>
      )}
      {battle.data && !isRollingDice && <BattleResult report={battle.data} />}
      <ErrorText error={battle.error ?? endPhase.error} />
      <Button
        size="sm"
        variant="secondary"
        disabled={isPending}
        onClick={() => endPhase.mutate('Fortify')}
      >
        Afslut angreb
      </Button>
    </ActionBox>
  )
}
