import { Link, useParams, type ErrorComponentProps } from '@tanstack/react-router'
import { useAuth } from '../../auth/useAuth'
import { isApiError } from '../../api/errors'
import Board from '../map/Board'
import { useTerritoryInfos } from '../map/queries'
import { territoryNames } from '../map/names'
import ActionPanel from './components/ActionPanel'
import CardsPanel from './components/CardsPanel'
import GameOver from './components/GameOver'
import MissionPanel from './components/MissionPanel'
import PlayerList from './components/PlayerList'
import TurnStatus from './components/TurnStatus'
import WaitingRoom from './components/WaitingRoom'
import { useGame } from './useGame'
import { useTurn } from './useTurn'

export default function GamePage() {
  const { gameId } = useParams({ from: '/authenticated/games/$gameId' })
  const { game, board, me, connectionStatus } = useGame(gameId)
  const { user } = useAuth()
  const territoryInfos = useTerritoryInfos()
  const turn = useTurn(game, me, board.territories, territoryInfos)
  const names = territoryNames.da

  return (
    <main className="flex h-screen w-screen gap-4 bg-stone-900 p-4">
      <aside className="flex w-64 shrink-0 flex-col gap-4 overflow-y-auto">
        {game.state === 'Lobby' && <WaitingRoom game={game} isHost={game.hostId === user?.id} />}
        {game.state === 'InProgress' && (
          <TurnStatus game={game} me={me} connectionStatus={connectionStatus} />
        )}
        {game.state === 'Finished' && <GameOver game={game} me={me} />}
        <PlayerList game={game} me={me} territories={board.territories} />
        {/* Missions are dealt when the game starts, so there is nothing to show in the lobby. */}
        {me && game.settings?.hasMissions && game.state !== 'Lobby' && (
          <MissionPanel gameId={gameId} />
        )}
      </aside>

      <div className="min-w-0 flex-1">
        <Board
          territories={board.territories}
          infos={territoryInfos}
          names={names}
          players={board.players}
          selectedId={turn.source?.territoryId ?? null}
          highlightedIds={turn.targetIds}
          targetId={turn.target?.territoryId}
          onTerritoryClick={turn.select}
        />
      </div>

      {me && game.state === 'InProgress' && (
        <aside className="flex w-64 shrink-0 flex-col gap-4 overflow-y-auto">
          {/* Keyed by turn, so results and errors from an earlier turn are not shown again. */}
          <ActionPanel
            key={`actions:${turn.id}`}
            gameId={gameId}
            me={me}
            turn={turn}
            names={names}
          />
          <CardsPanel
            key={`cards:${turn.id}`}
            gameId={gameId}
            playerId={me.id}
            canTrade={turn.mode === 'deploy'}
            names={names}
          />
        </aside>
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
