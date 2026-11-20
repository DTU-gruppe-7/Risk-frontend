import { useState } from 'react'
import { playerName } from '../playerName'
import { currentPlayerOf, turnIdOf } from '../rules'
import { troopWord } from '../troopWord'
import type { GameDto, PlayerDto } from '../types'
import Announcement from './Announcement'

interface TurnAnnouncement {
  turnId: string
  player: PlayerDto
  /** The troops the player got when the turn began. They count down as they are placed. */
  troops: number
}

interface TurnBannerProps {
  game: GameDto
  me: PlayerDto | undefined
  scale: number
  /** Holds the banner back while something else is announced first, e.g. a new bonus card. */
  waiting?: boolean
}

/**
 * Briefly shows in the middle of the map whose turn it now is and how many troops they get.
 * Only shown when the turn changes while the page is open, not when the page is (re)loaded
 * in the middle of a turn.
 */
export default function TurnBanner({ game, me, scale, waiting = false }: TurnBannerProps) {
  const turnId = turnIdOf(game)
  const [seenTurnId, setSeenTurnId] = useState(turnId)
  const [announcement, setAnnouncement] = useState<TurnAnnouncement | null>(null)

  // Updating state while rendering, so the banner shows in the same render as the new turn.
  if (turnId !== seenTurnId) {
    setSeenTurnId(turnId)
    const player = currentPlayerOf(game)
    setAnnouncement(
      game.state === 'InProgress' && player
        ? { turnId, player, troops: player.reinforcementTroops }
        : null,
    )
  }

  // The announcement is kept while waiting, and its animation starts once it is shown.
  if (!announcement || waiting) return null
  const { player, troops } = announcement
  const isMe = player.id === me?.id

  return (
    // Keyed by turn, so the animation starts over if a new turn comes before it has ended.
    <Announcement
      key={announcement.turnId}
      borderColor={player.color}
      scale={scale}
      onDone={() => setAnnouncement(null)}
    >
      <p className="flex items-center gap-2 text-lg font-semibold">
        <span
          className="h-4 w-4 shrink-0 rounded-full border border-stone-300"
          style={{ backgroundColor: player.color }}
        />
        {isMe ? 'Din tur' : `${playerName(player)}s tur`}
      </p>
      {troops > 0 && (
        <p className="text-5xl font-bold tabular-nums">
          +{troops}{' '}
          <span className="text-2xl font-semibold text-stone-300">{troopWord(troops)}</span>
        </p>
      )}
    </Announcement>
  )
}
