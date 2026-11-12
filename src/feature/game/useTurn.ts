import { useMemo, useState } from 'react'
import type { TerritoryId, TerritoryInfo, TerritoryState } from '../map/types'
import {
  NO_SELECTION,
  interactionFor,
  resolveSelection,
  selectTerritory,
  turnModeOf,
  type Selection,
} from './rules'
import type { GameDto, PlayerDto } from './types'

/**
 * The current user's part of a turn: what they can do right now (mode) and which
 * territories they have picked for it.
 */
export function useTurn(
  game: GameDto,
  me: PlayerDto | undefined,
  territories: TerritoryState[],
  infos: TerritoryInfo[],
) {
  // A selection belongs to one turn. Storing the turn with it makes an old selection
  // disappear by itself when the turn changes.
  const turnId = `${game.currentPlayerId}:${game.turnStartedAt}`
  const [stored, setStored] = useState<Selection & { turnId: string }>({ ...NO_SELECTION, turnId })

  const mode = turnModeOf(game, me, territories)
  const playerId = me?.id
  const interaction = useMemo(
    () => interactionFor(mode, territories, infos, playerId),
    [mode, territories, infos, playerId],
  )

  // The board changes under the selection (troops are lost, territories change owner),
  // so it is checked against the rules on every render instead of being trusted.
  const selection = resolveSelection(stored.turnId === turnId ? stored : NO_SELECTION, interaction)
  const find = (id: TerritoryId | null) =>
    territories.find((territory) => territory.territoryId === id) ?? null

  return {
    /** Changes when the turn does. Use as a key for state that belongs to one turn. */
    id: turnId,
    mode,
    source: find(selection.sourceId),
    target: find(selection.targetId),
    /** The territories that can be picked as target for the chosen source. */
    targetIds: selection.sourceId ? interaction.targetsOf(selection.sourceId) : [],
    select: (id: TerritoryId) =>
      setStored({ ...selectTerritory(selection, id, interaction), turnId }),
  }
}

export type Turn = ReturnType<typeof useTurn>
