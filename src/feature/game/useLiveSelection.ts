import { useEffect, useEffectEvent, useState } from 'react'
import { gameHub } from '../../realtime/gameHub'
import type { HubStatus } from '../../realtime/typedHub'
import type { RemoteSelection, TerritoryState } from '../map/types'
import { currentPlayerOf, turnIdOf } from './rules'
import type { GameDto, PlayerDto, TerritorySelectionDto } from './types'
import type { Turn } from './useTurn'

// Lets the other players follow the current player's choices live. The selection is never stored
// by the backend: it is passed on to the other players and is gone when the turn ends.
// Territories are sent by their state id (TerritoryDto.id), like in the game's other requests.

/** Sends the current user's selection to the other players while it is their turn. */
export function useShareSelection(gameId: string, turn: Turn, connectionStatus: HubStatus) {
  const isMyTurn = turn.mode !== 'waiting'
  const sourceTerritoryId = turn.source?.stateId ?? null
  const targetTerritoryId = turn.target?.stateId ?? null

  // Also runs at the start of each turn and after a reconnect, which clears what the others saw.
  useEffect(() => {
    if (!isMyTurn || connectionStatus !== 'connected') return

    gameHub
      .invoke('SelectTerritories', gameId, { sourceTerritoryId, targetTerritoryId })
      .catch((error: unknown) => {
        // Only a nicety for the other players, so a failure must never get in the way of the turn.
        if (import.meta.env.DEV) console.debug('Could not share the selection', error)
      })
  }, [gameId, isMyTurn, sourceTerritoryId, targetTerritoryId, connectionStatus])
}

/**
 * What the player whose turn it is has picked, ready for the board. Null when it is the current
 * user's own turn or nothing is picked.
 */
export function useOpponentSelection(
  game: GameDto,
  me: PlayerDto | undefined,
  territories: TerritoryState[],
): RemoteSelection | null {
  const turnId = turnIdOf(game)
  // A selection belongs to one turn, as in useTurn. Storing the turn with it makes an old selection
  // disappear by itself when the turn changes.
  const [received, setReceived] = useState<(TerritorySelectionDto & { turnId: string }) | null>(
    null,
  )

  const onSelectionChanged = useEffectEvent((selection: TerritorySelectionDto) => {
    if (selection.gameId !== game.id) return
    setReceived({ ...selection, turnId })
  })

  useEffect(() => gameHub.on('SelectionChanged', (selection) => onSelectionChanged(selection)), [])

  const selection = received?.turnId === turnId ? received : null
  const player = currentPlayerOf(game)
  // Only the player whose turn it is can pick territories, and our own choices are already shown.
  if (!selection || !player || selection.playerId !== player.id || player.id === me?.id) {
    return null
  }

  // A territory we cannot see has no state, so it is left out like the backend should have done.
  const territoryIdOf = (stateId: string | null) =>
    territories.find((territory) => territory.stateId === stateId)?.territoryId ?? null
  const sourceId = territoryIdOf(selection.sourceTerritoryId)
  const targetId = territoryIdOf(selection.targetTerritoryId)

  return sourceId || targetId ? { sourceId, targetId, color: player.color } : null
}
