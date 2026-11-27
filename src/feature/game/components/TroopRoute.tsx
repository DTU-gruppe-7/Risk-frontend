import type { TerritoryNames, TerritoryState } from '../../map/types'

function TerritoryChip({ territory, names }: { territory: TerritoryState; names: TerritoryNames }) {
  return (
    <span className="flex min-w-0 flex-1 flex-col rounded-lg bg-black/30 px-2 py-1">
      <span className="truncate text-xs text-stone-200">
        {names[territory.territoryId] ?? territory.territoryId}
      </span>
      <span className="text-base font-bold text-amber-100 tabular-nums">{territory.units}</span>
    </span>
  )
}

/** Two territories troops go between, e.g. an attack or a move, with their troops. */
export default function TroopRoute(props: {
  from: TerritoryState
  to: TerritoryState
  names: TerritoryNames
  /** Read aloud between the two names, e.g. "angriber". */
  verb: string
}) {
  return (
    <div className="flex items-center gap-1.5">
      <TerritoryChip territory={props.from} names={props.names} />
      <span aria-hidden className="text-amber-300">
        →
      </span>
      <span className="sr-only">{props.verb}</span>
      <TerritoryChip territory={props.to} names={props.names} />
    </div>
  )
}
