import { useState, type FormEvent } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Link, useParams, type ErrorComponentProps } from '@tanstack/react-router'
import { queryKeys } from '../../api/query/queryKeys'
import { useAuth } from '../../auth/useAuth'
import { isApiError } from '../../api/errors'
import Board from '../map/Board'
import { useTerritoryInfos } from '../map/queries'
import { territoryNames } from '../map/names'
import type { TerritoryId } from '../map/types'
import { deployTroops } from './mutations'
import { useGame } from './useGame'

export default function GamePage() {
  const { gameId } = useParams({ from: '/authenticated/games/$gameId' })
  const { board, connectionStatus, game } = useGame(gameId)
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const territoryInfos = useTerritoryInfos()
  const [selectedId, setSelectedId] = useState<TerritoryId | null>(null)
  const [troopsToPlace, setTroopsToPlace] = useState(1)
  const deployMutation = useMutation({
    mutationFn: ({ territoryId, troops }: { territoryId: string; troops: number }) =>
      deployTroops(gameId, territoryId, { troops }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.games.detail(gameId) })
      await queryClient.invalidateQueries({ queryKey: queryKeys.games.territories(gameId) })
    },
  })

  const currentPlayer = game.players.find((player) => player.userId === user?.id)
  const selectedTerritory = board.territories.find(
    (territory) => territory.territoryId === selectedId,
  )
  const canDeploy =
    game.currentPhase === 'Deployment' &&
    currentPlayer !== undefined &&
    selectedTerritory?.ownerId === currentPlayer.id &&
    currentPlayer.reinforcementTroops > 0

  function selectTerritory(id: TerritoryId) {
    setSelectedId((previous) => (previous === id ? null : id))
    setTroopsToPlace(1)
    deployMutation.reset()
  }

  function submitDeployment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!selectedTerritory || !canDeploy) return
    deployMutation.mutate({
      territoryId: selectedTerritory.stateId,
      troops: Math.min(troopsToPlace, currentPlayer.reinforcementTroops),
    })
  }

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
        onTerritoryClick={selectTerritory}
      />
      {currentPlayer && (
        <aside className="absolute top-4 right-4 w-64 rounded bg-stone-800 p-4 text-stone-100 shadow-lg">
          <p className="font-semibold">Dine tropper</p>
          <p className="mb-3 text-2xl">{currentPlayer.reinforcementTroops}</p>
          {selectedTerritory && (
            <form onSubmit={submitDeployment} className="flex flex-col gap-2">
              <p className="text-sm text-stone-300">Valgt: {selectedTerritory.territoryId}</p>
              {canDeploy ? (
                <>
                  <label className="flex flex-col gap-1 text-sm">
                    Antal tropper
                    <input
                      type="number"
                      min={1}
                      max={currentPlayer.reinforcementTroops}
                      value={troopsToPlace}
                      onChange={(event) => setTroopsToPlace(Number(event.target.value))}
                      className="rounded bg-stone-700 px-2 py-1"
                    />
                  </label>
                  <button
                    type="submit"
                    disabled={deployMutation.isPending}
                    className="rounded bg-emerald-700 px-3 py-2 hover:bg-emerald-600 disabled:opacity-50"
                  >
                    {deployMutation.isPending ? 'Placering...' : 'Placér tropper'}
                  </button>
                </>
              ) : (
                <p className="text-sm text-stone-300">Vælg et af dine egne territorier.</p>
              )}
              {deployMutation.error && (
                <p className="text-sm text-red-300">Tropperne kunne ikke placeres.</p>
              )}
            </form>
          )}
        </aside>
      )}
      {board.territories.length === 0 && (
        <div className="absolute bottom-4 rounded bg-stone-800 px-3 py-2 text-stone-100">
          Spillet er endnu ikke startet.
        </div>
      )}
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
