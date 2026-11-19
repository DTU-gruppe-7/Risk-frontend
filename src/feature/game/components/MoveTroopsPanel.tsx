import { useState, type ReactNode } from 'react'
import type { TerritoryNames, TerritoryState } from '../../map/types'
import { ActionBox, Button, ErrorText, Hint, TroopPicker } from './ui'

interface MoveTroopsPanelProps {
  title: string
  from: TerritoryState | null
  to: TerritoryState | null
  names: TerritoryNames
  /** Shown until both territories are picked. */
  hint: string
  submitLabel: string
  /** 'max' starts with everything that can be moved, 'min' with a single troop. */
  initial: 'min' | 'max'
  isPending: boolean
  error: Error | null
  onMove: (from: TerritoryState, to: TerritoryState, troops: number) => void
  children?: ReactNode
}

/** Moves troops from one territory to another. Used for both conquests and fortifying. */
export default function MoveTroopsPanel(props: MoveTroopsPanelProps) {
  const { title, from, to, names, hint, submitLabel, initial, isPending, error, onMove } = props
  const [wanted, setWanted] = useState(initial === 'max' ? Infinity : 1)
  const nameOf = (territory: TerritoryState) =>
    names[territory.territoryId] ?? territory.territoryId

  // One troop always stays behind.
  const max = from ? from.units - 1 : 0
  const troops = Math.min(wanted, max)

  return (
    <ActionBox title={title}>
      {from && to ? (
        <>
          <Hint>
            Fra {nameOf(from)} ({from.units}) til {nameOf(to)} ({to.units})
          </Hint>
          <TroopPicker label="Antal tropper" max={max} value={troops} onChange={setWanted} />
          <Button size="sm" disabled={isPending} onClick={() => onMove(from, to, troops)}>
            {submitLabel}
          </Button>
        </>
      ) : (
        <Hint>{hint}</Hint>
      )}
      <ErrorText error={error} />
      {props.children}
    </ActionBox>
  )
}
