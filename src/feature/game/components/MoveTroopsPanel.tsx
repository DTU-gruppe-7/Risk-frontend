import { useState, type ReactNode } from 'react'
import type { TerritoryNames, TerritoryState } from '../../map/types'
import TroopRoute from './TroopRoute'
import { ActionBox, Button, ErrorText, Hint, TroopPicker } from './ui'

interface MoveTroopsPanelProps {
  title: string
  from: TerritoryState | null
  to: TerritoryState | null
  names: TerritoryNames
  /** Shown until both territories are picked. */
  hint: string
  submitLabel: string
  /** 'max' starts with everything that can be moved, 'min' with the least. */
  initial: 'min' | 'max'
  /** How many troops may move, when the server says so (a conquest). Otherwise all but one. */
  limits?: { min: number; max: number }
  isPending: boolean
  error: Error | null
  onMove: (from: TerritoryState, to: TerritoryState, troops: number) => void
  children?: ReactNode
}

/** Moves troops from one territory to another. Used for both conquests and fortifying. */
export default function MoveTroopsPanel(props: MoveTroopsPanelProps) {
  const { title, from, to, names, hint, submitLabel, initial, limits, isPending, error, onMove } =
    props
  const [wanted, setWanted] = useState(initial === 'max' ? Infinity : 0)

  // Without limits from the server, one troop stays behind.
  const min = limits?.min ?? 1
  const max = limits?.max ?? (from ? from.units - 1 : 0)
  const troops = Math.max(min, Math.min(wanted, max))

  return (
    <ActionBox title={title}>
      {from && to ? (
        <>
          <TroopRoute from={from} to={to} names={names} verb="til" />
          <TroopPicker
            label="Antal tropper"
            min={min}
            max={max}
            value={troops}
            onChange={setWanted}
          />
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
