import { HubConnectionBuilder, HubConnectionState, LogLevel } from '@microsoft/signalr'
import type { HubEvents, HubMethods, HubStatus, TypedHub } from './typedHub'

const MAX_RECONNECT_DELAY_MS = 30_000

export interface SignalRHubOptions {
  /** Called on every connect and reconnect, so a fresh token is always used. */
  getAccessToken: () => Promise<string | null>
}

/** SignalR implementation of TypedHub. Knows nothing about sessions or config:
 *  the URL and token source are passed in by the caller.
 */
export function createSignalRHub<TEvents extends HubEvents, TMethods extends HubMethods>(
  url: string,
  { getAccessToken }: SignalRHubOptions,
): TypedHub<TEvents, TMethods> {
  const connection = new HubConnectionBuilder()
    .withUrl(url, {
      accessTokenFactory: async () => (await getAccessToken()) ?? '',
    })
    // Keep retrying forever with exponential backoff: to max 30s.
    // The default policy gives up after four attempts.
    .withAutomaticReconnect({
      nextRetryDelayInMilliseconds: ({ previousRetryCount }) =>
        previousRetryCount === 0
          ? 0
          : Math.min(1000 * 2 ** (previousRetryCount - 1), MAX_RECONNECT_DELAY_MS),
    })
    .configureLogging(import.meta.env.DEV ? LogLevel.Information : LogLevel.Warning)
    .build()

  let status: HubStatus = 'disconnected'
  const statusListeners = new Set<(status: HubStatus) => void>()

  function setStatus(next: HubStatus) {
    status = next
    statusListeners.forEach((listener) => listener(next))
  }

  connection.onreconnecting(() => setStatus('reconnecting'))
  connection.onreconnected(() => setStatus('connected'))
  connection.onclose(() => setStatus('disconnected'))

  return {
    get status() {
      return status
    },

    async start() {
      if (connection.state !== HubConnectionState.Disconnected) return
      setStatus('connecting')
      try {
        await connection.start()
        setStatus('connected')
      } catch (error) {
        setStatus('disconnected')
        throw error
      }
    },

    stop() {
      return connection.stop()
    },

    on(event, handler) {
      // SignalR's own types are untyped (any[]). The cast is safe because
      // TypedHub has already checked the handler against TEvents.
      const callback = handler as unknown as (...args: unknown[]) => void
      connection.on(event, callback)
      return () => connection.off(event, callback)
    },

    invoke(method, ...args) {
      return connection.invoke(method, ...args) as ReturnType<TMethods[typeof method]>
    },

    onStatusChange(listener) {
      statusListeners.add(listener)
      return () => {
        statusListeners.delete(listener)
      }
    },
  }
}
