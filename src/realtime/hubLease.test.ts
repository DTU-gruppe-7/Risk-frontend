import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { acquireHub } from './hubLease'
import type { HubEvents, HubMethods, HubStatus, TypedHub } from './typedHub'

/** A hub whose start() fails for each 'fail' in the list and then connects. */
function fakeHub(startResults: ('ok' | 'fail')[] = []) {
  const hub = {
    status: 'disconnected' as HubStatus,
    start: vi.fn(async () => {
      if ((startResults.shift() ?? 'ok') === 'fail') throw new Error('no connection')
      hub.status = 'connected'
    }),
    stop: vi.fn(async () => {
      hub.status = 'disconnected'
    }),
    on: vi.fn(() => () => {}),
    invoke: vi.fn(),
    onStatusChange: vi.fn(() => () => {}),
  }
  return hub
}

function acquire(hub: ReturnType<typeof fakeHub>) {
  return acquireHub(hub as unknown as TypedHub<HubEvents, HubMethods>)
}

beforeEach(() => vi.useFakeTimers())
afterEach(() => vi.useRealTimers())

describe('acquireHub', () => {
  it('shares one connection between holders and stops it shortly after the last one lets go', async () => {
    const hub = fakeHub()
    const releaseFirst = acquire(hub)
    const releaseSecond = acquire(hub)
    await vi.advanceTimersByTimeAsync(0)

    releaseFirst()
    releaseSecond()
    await vi.advanceTimersByTimeAsync(1_999)
    expect(hub.stop).not.toHaveBeenCalled()

    await vi.advanceTimersByTimeAsync(1)
    expect(hub.start).toHaveBeenCalledTimes(1)
    expect(hub.stop).toHaveBeenCalledTimes(1)
  })

  it('keeps the connection when it is acquired again before it is stopped, e.g. on a quick remount', async () => {
    const hub = fakeHub()
    acquire(hub)()
    await vi.advanceTimersByTimeAsync(1_000)

    acquire(hub)
    await vi.advanceTimersByTimeAsync(10_000)

    expect(hub.stop).not.toHaveBeenCalled()
    expect(hub.start).toHaveBeenCalledTimes(1)
  })

  it('ignores a second call to the same release function', async () => {
    const hub = fakeHub()
    const release = acquire(hub)
    acquire(hub)

    release()
    release()
    await vi.advanceTimersByTimeAsync(10_000)

    expect(hub.stop).not.toHaveBeenCalled()
  })

  it('retries the first connect with growing pauses until it succeeds', async () => {
    const hub = fakeHub(['fail', 'fail'])
    acquire(hub)
    await vi.advanceTimersByTimeAsync(0)
    expect(hub.start).toHaveBeenCalledTimes(1)

    await vi.advanceTimersByTimeAsync(1_000) // first pause: 1 second
    expect(hub.start).toHaveBeenCalledTimes(2)

    await vi.advanceTimersByTimeAsync(1_999) // second pause: 2 seconds
    expect(hub.start).toHaveBeenCalledTimes(2)
    await vi.advanceTimersByTimeAsync(1)
    expect(hub.start).toHaveBeenCalledTimes(3)

    await vi.advanceTimersByTimeAsync(60_000) // connected, so no more attempts
    expect(hub.start).toHaveBeenCalledTimes(3)
    expect(hub.status).toBe('connected')
  })

  it('stops retrying when nobody holds the hub any more', async () => {
    const hub = fakeHub(['fail', 'fail', 'fail'])
    const release = acquire(hub)
    await vi.advanceTimersByTimeAsync(0)

    release()
    await vi.advanceTimersByTimeAsync(60_000)

    expect(hub.start).toHaveBeenCalledTimes(1)
  })
})
