// Maps names to function signature use `type` (not `interface`) for these maps,
// since interface do not satisfy a Record index signature.
export type HubEvents = Record<string, (...args: never[]) => void>
export type HubMethods = Record<string, (...args: never[]) => Promise<unknown>>

export type HubStatus = 'disconnected' | 'connecting' | 'connected' | 'reconnecting'

/** A typed real-time connection. TEvents are pushed by the server,
 *  TMethoeds are invoked on the server by the client.
 *  Implemented by SignalR in production and by a mock in tests.
 */
export interface TypedHub<TEvents extends HubEvents, TMethoeds extends HubMethods> {
  readonly status: HubStatus
  start(): Promise<void>
  stop(): Promise<void>
  /** Registers an event handler. Returns a fcuntion that removes it. */
  on<K extends keyof TEvents & string>(event: K, handler: TEvents[K]): () => void
  invoke<K extends keyof TMethoeds & string>(
    method: K,
    ...args: Parameters<TMethoeds[K]>
  ): ReturnType<TMethoeds[K]>
  /** Subscribes to status changes. Returns an unsubscribe funcion. */
  onStatusChange(listener: (status: HubStatus) => void): () => void
}
