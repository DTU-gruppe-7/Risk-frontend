import { Link } from '@tanstack/react-router'
import type { GameSummaryDto } from '../game/types'
import { Panel } from './ui'

/** Games that have started, so a player can get back into one. */
export default function InProgressGamesPanel({ games }: { games: GameSummaryDto[] }) {
  return (
    <Panel eyebrow="I felten" title="Igangværende spil">
      {games.length === 0 ? (
        <p className="text-sm text-stone-400">Der er ingen igangværende spil.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {games.map((game) => (
            <li
              key={game.id}
              className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-black/25 px-4 py-3 transition hover:border-amber-200/25"
            >
              <div>
                <p className="font-serif text-stone-50">
                  Spil <span className="font-mono text-sm">{game.id.slice(0, 8)}</span>
                </p>
                <p className="text-sm text-stone-400">{game.playerCount} spillere</p>
              </div>
              <Link
                to="/games/$gameId"
                params={{ gameId: game.id }}
                className="rounded-lg bg-amber-500 px-4 py-1.5 text-sm font-semibold text-stone-950 transition hover:bg-amber-400"
              >
                Fortsæt
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  )
}
