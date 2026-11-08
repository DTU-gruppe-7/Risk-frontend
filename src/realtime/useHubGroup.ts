import { useEffect, useEffectEvent } from 'react'
import { acquireHub } from './hubLease'
import type { HubEvents, HubMethods, HubStatus, TypedHub } from './typedHub'
import { useHubStatus } from './useHubStatus'

export interface HubGroupOptions {
  /** Identifies the group (e.g. the game id). Changing it leaves the old group and joins the new one. */
  key: string
  /** Asks the server to add this connection to the group. */
  join: () => Promise<unknown>
  /** Asks the server to remove this connection from the group. */
  leave: () => Promise<unknown>
  /** false = do not connect at all, e.g. while logged out. Default true. */
  enabled?: boolean
}

/**
 * Keeps the hub connected while mounted and keeps this connection in one server-side group.
 * Shared by every hub that works with groups (game, and later lobby, chat, …).
 * Returns the connection status.
 */
export function useHubGroup<TEvents extends HubEvents, TMethods extends HubMethods>(
  hub: TypedHub<TEvents, TMethods>,
  { key, join, leave, enabled = true }: HubGroupOptions,
): HubStatus {
  const status = useHubStatus(hub)

  // Effect events always see the latest join/leave without re-running the effects.
  const onJoin = useEffectEvent(join)
  const onLeave = useEffectEvent(leave)

  useEffect(() => {
    if (!enabled) return
    return acquireHub(hub)
  }, [hub, enabled])

  // Join whenever we are connected. A reconnect creates a new connection on the
  // server, which is not in any groups, so we must join again.
  useEffect(() => {
    if (!enabled || status !== 'connected') return

    onJoin().catch((error: unknown) => console.error(`Failed to join group ${key}`, error))

    return () => {
      onLeave().catch(() => {
        // Ignored: the connection may already be closed, which also leaves the group.
      })
    }
  }, [enabled, status, key])

  return status
}
