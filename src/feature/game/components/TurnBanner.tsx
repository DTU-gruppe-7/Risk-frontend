import { useState } from 'react'
import { playerName } from '../playerName'
import { currentPlayerOf, turnIdOf } from '../rules'
import type { GameDto, PlayerDto } from '../types'

interface Announcement {
  turnId: string
  player: PlayerDto
  /** The troops the player got when the turn began. They count down as they are placed. */
  troops: number
}

interface TurnBannerProps {
  game: GameDto
  me: PlayerDto | undefined
  /** How much to scale the banner, following the width the map is drawn at. */
  scale: number
}

/**
 * Briefly shows in the middle of the map whose turn it now is and how many troops they get.
 * Only shown when the turn changes while the page is open, not when the page is (re)loaded
 * in the middle of a turn.
 */
export default function TurnBanner({ game, me, scale }: TurnBannerProps) {
  const turnId = turnIdOf(game)
  const [seenTurnId, setSeenTurnId] = useState(turnId)
  const [announcement, setAnnouncement] = useState<Announcement | null>(null)

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

  if (!announcement) return null
  const { player, troops } = announcement
  const isMe = player.id === me?.id

  return (
    <div
      className="pointer-events-none absolute inset-0 flex items-center justify-center"
      role="status"
    >
      <div
        // Keyed by turn, so the animation starts over if a new turn comes before it has ended.
        key={announcement.turnId}
        className="flex animate-turn-banner flex-col items-center gap-1 rounded-2xl border-2 bg-stone-900/85 px-10 py-5 text-stone-100 shadow-2xl backdrop-blur-sm"
        style={{ borderColor: player.color, zoom: scale }}
        onAnimationEnd={() => setAnnouncement(null)}
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
            <span className="text-2xl font-semibold text-stone-300">
              {troops === 1 ? 'troppe' : 'tropper'}
            </span>
          </p>
        )}
      </div>
    </div>
  )
}
