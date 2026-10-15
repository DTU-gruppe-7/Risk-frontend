import { useSyncExternalStore } from 'react'
import type { HubEvents, HubMethods, TypedHub } from './typedHub'

/** The hub's connection status. Re-renders when it changes */
export function useHubStatus<TEvents extends HubEvents, TMethods extends HubMethods>(
  hub: TypedHub<TEvents, TMethods>,
) {
  return useSyncExternalStore(hub.onStatusChange, () => hub.status)
}
