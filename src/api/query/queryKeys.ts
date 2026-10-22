// All query keys in one place. Keys are hierarchical, so invalidating
// games.all() also invalidates every list and detail under 'games'.
export const queryKeys = {
  ping: () => ['ping'] as const,
  map: () => ['map'] as const,
  games: {
    all: () => ['games'] as const,
    list: () => ['games', 'list'] as const,
    detail: (gameId: string) => ['games', 'detail', gameId] as const,
  },
}
