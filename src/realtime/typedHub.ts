// Maps names to function signature use `type` (not `interface`) for these maps,
// since interface do not satisfy a Record index signature.
export type HubEvents = Record<string, (...args: never[]) => void>
export type HubMethods = Record<string, (...args: never[]) => Promise<unknown>>

export type HubStatus = 'disconnected' | 'connecting' | 'connected' | 'reconnecting'

/** A typed real-time connection. TEvents are pushed by the server,
 *  TMethods are invoked on the server by the client.
 *  Implemented by SignalR in production and by a mock in tests.
 */
export interface TypedHub<TEvents extends HubEvents, TMethods extends HubMethods> {
  readonly status: HubStatus
  start(): Promise<void>
  stop(): Promise<void>
  /** Registers an event handler. Returns a function that removes it. */
  on<K extends keyof TEvents & string>(event: K, handler: TEvents[K]): () => void
  invoke<K extends keyof TMethods & string>(
    method: K,
    ...args: Parameters<TMethods[K]>
  ): ReturnType<TMethods[K]>
  /** Subscribes to status changes. Returns an unsubscribe function. */
  onStatusChange(listener: (status: HubStatus) => void): () => void
}
