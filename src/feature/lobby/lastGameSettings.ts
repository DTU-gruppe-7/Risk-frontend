import type { GameVictoryMode } from '../game/types'
import { PLAYER_COLORS, type PlayerColor } from './playerColors'

/** The choices in "Opret et spil", remembered in this browser between visits. */
export interface GameSettingsDraft {
  maxPlayers: number
  color: PlayerColor
  victoryMode: GameVictoryMode
  hasFogOfWar: boolean
  blizzardCount: number
  turnTimeLimit: number
}

export const DEFAULT_GAME_SETTINGS: GameSettingsDraft = {
  maxPlayers: 4,
  color: 'red',
  victoryMode: 'CompleteConquest',
  hasFogOfWar: false,
  blizzardCount: 0,
  turnTimeLimit: 0,
}

const STORAGE_KEY = 'risk.lastGameSettings'

/**
 * The settings from the last game this browser created, or the defaults. Each field is checked
 * on its own, so an old or hand-edited value falls back to its default instead of breaking the form.
 * Storage can be unavailable (private browsing, blocked site data), so every access is guarded.
 */
export function loadLastGameSettings(): GameSettingsDraft {
  let saved: Record<string, unknown>
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    const parsed: unknown = raw ? JSON.parse(raw) : null
    if (typeof parsed !== 'object' || parsed === null) return DEFAULT_GAME_SETTINGS
    saved = parsed as Record<string, unknown>
  } catch {
    return DEFAULT_GAME_SETTINGS
  }

  const d = DEFAULT_GAME_SETTINGS
  return {
    maxPlayers: intInRange(saved.maxPlayers, 2, 6) ?? d.maxPlayers,
    color: PLAYER_COLORS.find((c) => c.value === saved.color)?.value ?? d.color,
    victoryMode:
      saved.victoryMode === 'Mission' || saved.victoryMode === 'CompleteConquest'
        ? saved.victoryMode
        : d.victoryMode,
    hasFogOfWar: typeof saved.hasFogOfWar === 'boolean' ? saved.hasFogOfWar : d.hasFogOfWar,
    blizzardCount: intInRange(saved.blizzardCount, 0, 6) ?? d.blizzardCount,
    turnTimeLimit: intInRange(saved.turnTimeLimit, 0, 3600) ?? d.turnTimeLimit,
  }
}

export function saveLastGameSettings(settings: GameSettingsDraft) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
  } catch {
    // Not being able to remember the settings is fine: the game is still created.
  }
}

function intInRange(value: unknown, min: number, max: number) {
  return typeof value === 'number' && Number.isInteger(value) && value >= min && value <= max
    ? value
    : undefined
}
