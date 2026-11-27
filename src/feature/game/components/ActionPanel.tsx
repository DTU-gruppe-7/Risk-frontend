import type { TerritoryNames } from '../../map/types'
import type { PlayerDto } from '../types'
import { useGameActions } from '../useGameActions'
import type { Turn } from '../useTurn'
import AttackPanel from './AttackPanel'
import BattleResult from './BattleResult'
import DeployPanel from './DeployPanel'
import MoveTroopsPanel from './MoveTroopsPanel'
import { Button } from './ui'

interface ActionPanelProps {
  gameId: string
  me: PlayerDto
  turn: Turn
  /** An attack roll is being shown on the map, so its result must not be shown here yet. */
  isRollingDice: boolean
  names: TerritoryNames
}

/** The controls for what the player can do right now. Shows nothing while they wait. */
export default function ActionPanel({ gameId, me, turn, isRollingDice, names }: ActionPanelProps) {
  const actions = useGameActions(gameId)
  const { mode, source, target } = turn

  switch (mode) {
    case 'waiting':
      return null
    case 'deploy':
      return (
        <DeployPanel
          // A new territory starts from one troop again.
          key={source?.stateId}
          available={me.reinforcementTroops}
          territory={source}
          mustTrade={me.mustTradeCards}
          names={names}
          deploy={actions.deploy}
          endPhase={actions.endPhase}
        />
      )
    case 'attack':
      return (
        <AttackPanel
          from={source}
          to={target}
          names={names}
          battle={actions.battle}
          isRollingDice={isRollingDice}
          endPhase={actions.endPhase}
        />
      )
    case 'conquest':
      return (
        <MoveTroopsPanel
          title="Erobring"
          from={source}
          to={target}
          names={names}
          hint="Vælg det territorium, tropperne skal rykke ind fra."
          submitLabel="Ryk ind"
          initial="max"
          limits={
            turn.pendingConquest
              ? { min: turn.pendingConquest.minTroops, max: turn.pendingConquest.maxTroops }
              : undefined
          }
          isPending={actions.completeConquest.isPending}
          error={actions.completeConquest.error}
          onMove={(from, to, troops) => actions.completeConquest.mutate({ from, to, troops })}
        >
          {actions.battle.data && <BattleResult report={actions.battle.data} />}
        </MoveTroopsPanel>
      )
    case 'fortify':
      return (
        <MoveTroopsPanel
          key={`${source?.stateId}:${target?.stateId}`}
          title="Befæstning"
          from={source}
          to={target}
          names={names}
          hint={
            source
              ? 'Vælg et forbundet territorium at flytte til.'
              : 'Flyt tropper mellem to af dine forbundne territorier, eller afslut turen.'
          }
          submitLabel="Flyt og afslut tur"
          initial="min"
          isPending={actions.fortify.isPending || actions.endPhase.isPending}
          error={actions.fortify.error ?? actions.endPhase.error}
          onMove={(from, to, troops) => actions.fortify.mutate({ from, to, troops })}
        >
          <Button
            size="sm"
            variant="secondary"
            disabled={actions.fortify.isPending || actions.endPhase.isPending}
            onClick={() => actions.endPhase.mutate('Deployment')}
          >
            Afslut tur uden at flytte
          </Button>
        </MoveTroopsPanel>
      )
  }
}
