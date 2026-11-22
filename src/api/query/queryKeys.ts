// All query keys in one place. Keys are hierarchical, so invalidating
// games.all() also invalidates every list and detail under 'games'.
export const queryKeys = {
  map: () => ['map'] as const,
  games: {
    all: () => ['games'] as const,
    list: () => ['games', 'list'] as const,
    detail: (gameId: string) => ['games', 'detail', gameId] as const,
    territories: (gameId: string) => ['games', 'territories', gameId] as const,
    // The current user's own cards. The cache is cleared when the user changes (see AuthProvider).
    hand: (gameId: string) => ['games', 'hand', gameId] as const,
    missions: (gameId: string) => ['games', 'missions', gameId] as const,
    // The key of the attack mutation (not a query), so the dice can be shown outside the panel
    // that rolls them (see useAttackRoll).
    battle: (gameId: string) => ['games', 'battle', gameId] as const,
  },
}
