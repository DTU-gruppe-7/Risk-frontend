import { useState } from 'react'
import { Link, useParams, type ErrorComponentProps } from '@tanstack/react-router'
import { isApiError } from '../../api/errors'
import Board from '../map/Board'
import { useTerritoryInfos } from '../map/queries'
import { territoryNames } from '../map/names'
import type { TerritoryId } from '../map/types'
import { useGame } from './useGame'

export default function GamePage() {
  const { gameId } = useParams({ from: '/authenticated/games/$gameId' })
  const { board, connectionStatus } = useGame(gameId)
  const territoryInfos = useTerritoryInfos()
  const [selectedId, setSelectedId] = useState<TerritoryId | null>(null)

  return (
    <main className="relative flex h-screen w-screen items-center justify-center bg-stone-900 p-4">
      {connectionStatus !== 'connected' && (
        <div className="absolute top-4 rounded bg-amber-700 px-3 py-1 text-stone-100">
          {connectionStatus === 'reconnecting' ? 'Forbindelsen er mistet...' : 'Forbinder...'}
        </div>
      )}
      <Board
        territories={board.territories}
        infos={territoryInfos}
        names={territoryNames.da}
        players={board.players}
        selectedId={selectedId}
        onTerritoryClick={(id) => setSelectedId((prev) => (prev === id ? null : id))}
      />
    </main>
  )
}

export function GameErrorPage({ error }: ErrorComponentProps) {
  const notAvailable = isApiError(error) && (error.status === 404 || error.status === 403)

  return (
    <main className="flex h-screen flex-col items-center justify-center gap-4 bg-stone-900 text-stone-100">
      <p>{notAvailable ? 'Spillet findes ikke, eller du er ikke med i det.' : 'Noget gik galt.'}</p>
      <Link to="/" className="rounded bg-stone-700 px-3 py-1 hover:bg-stone-600">
        Tilbage til lobbyen
      </Link>
    </main>
  )
}
