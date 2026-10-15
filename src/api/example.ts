/** import { api } from './api/client'

// GET: you specify what comes back
const ping = await api.get<PingResponse>('/api/ping')
ping.serverTime // typed

// GET with query parameters, undefined values are skipped
const games = await api.get<GameSummary[]>('/api/games', {
  query: { status: 'open', page: 1, search: searchText || undefined },
})

// POST with response and body type
const game = await api.post<GameDto, CreateGameRequest>('/api/games', { name: 'Fredagsspil' })

// POST without a response (204), TResponse defaults to void
await api.post(`/api/games/${id}/join`)

// Cancel a request, e.g. when a component unmounts
const controller = new AbortController()
api.get<GameDto>(`/api/games/${id}`, { signal: controller.signal })
controller.abort() 
*/
