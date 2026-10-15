import type { HubEvents, HubMethods, TypedHub } from './typedHub'

// Wait before stopping, so a quick remount (StrictMode, naviating between
// routes) reuses the open connection instead of reconnecting.
const STOP_DELAY_MS = 2_000
const MAX_START_DELAY_MS = 30_000

interface Lease {
  holders: number
  stopTimer: ReturnType<typeof setTimeout> | null
  starting: boolean
}

const leases = new WeakMap<object, Lease>()

/**
 * Keeps the hub connected while at least one caller holds it.
 * Returns a release function. The connection is stopped when the last holder releases.
 */
export function acquireHub<TEvents extends HubEvents, TMethods extends HubMethods>(
  hub: TypedHub<TEvents, TMethods>,
): () => void {
  let lease = leases.get(hub)
  if (!lease) {
    lease = { holders: 0, stopTimer: null, starting: false }
    leases.set(hub, lease)
  }
  const current = lease

  current.holders++
  if (current.stopTimer) {
    clearTimeout(current.stopTimer)
    current.stopTimer = null
  }
  void keepStarting(hub, current)

  let released = false

  return () => {
    if (released) return
    released = true
    current.holders--
    if (current.holders === 0) {
      current.stopTimer = setTimeout(() => {
        current.stopTimer = null
        void hub.stop()
      }, STOP_DELAY_MS)
    }
  }
}

/**
 * SignalR's automatic reconnect only applies after a successful first connect.
 * This retries the first connect with backoff until it succeeds or nobody holds the hub
 */
async function keepStarting<TEvents extends HubEvents, TMethods extends HubMethods>(
  hub: TypedHub<TEvents, TMethods>,
  lease: Lease,
) {
  if (lease.starting) return
  lease.starting = true
  try {
    for (let attempt = 0; lease.holders > 0 && hub.status !== 'connected'; attempt++) {
      if (attempt > 0) await sleep(Math.min(1000 * 2 ** (attempt - 1), MAX_START_DELAY_MS))
      if (lease.holders === 0) return
      await hub.start().catch(() => {
        // Ignored: the loop retries, and SignalR already logs the error.
      })
    }
  } finally {
    lease.starting = false
  }
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
