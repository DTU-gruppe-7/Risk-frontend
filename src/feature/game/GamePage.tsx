import { useState, type ReactNode } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link, useParams, type ErrorComponentProps } from '@tanstack/react-router'
import { useAuth } from '../../auth/useAuth'
import { isApiError } from '../../api/errors'
import Board from '../map/Board'
import { MAP_HEIGHT, MAP_WIDTH } from '../map/geometry'
import { useTerritoryInfos } from '../map/queries'
import { territoryNames } from '../map/names'
import ActionPanel from './components/ActionPanel'
import CardsPanel from './components/CardsPanel'
import GameOver from './components/GameOver'
import MissionPanel from './components/MissionPanel'
import PlayerList from './components/PlayerList'
import TurnStatus from './components/TurnStatus'
import WaitingRoom from './components/WaitingRoom'
import { handQuery } from './queries'
import { useGame } from './useGame'
import { useTurn } from './useTurn'

// The board keeps the map's proportions, so this is the largest frame that fits the space.
const MAP_FRAME_STYLE = {
  aspectRatio: `${MAP_WIDTH} / ${MAP_HEIGHT}`,
  width: `min(100cqw, 100cqh * ${MAP_WIDTH} / ${MAP_HEIGHT})`,
}

type PanelId = 'players' | 'mission' | 'cards'

export default function GamePage() {
  const { gameId } = useParams({ from: '/authenticated/games/$gameId' })
  const { game, board, me, connectionStatus } = useGame(gameId)
  const { user } = useAuth()
  const territoryInfos = useTerritoryInfos()
  const turn = useTurn(game, me, board.territories, territoryInfos)
  const names = territoryNames.da
  // The side panels are closed until asked for, so the map gets the whole screen.
  const [openPanel, setOpenPanel] = useState<PanelId | null>(null)

  const isPlaying = game.state === 'InProgress'
  // Missions are dealt when the game starts, so there is nothing to show in the lobby.
  const hasMission = Boolean(me && game.settings?.hasMissions && game.state !== 'Lobby')
  const hasCards = Boolean(me && isPlaying)

  function panelButton(id: PanelId, label: ReactNode) {
    const isOpen = openPanel === id
    return (
      <button
        type="button"
        aria-expanded={isOpen}
        onClick={() => setOpenPanel(isOpen ? null : id)}
        className={`rounded px-3 py-1 text-sm ${
          isOpen ? 'bg-emerald-700' : 'bg-stone-700 hover:bg-stone-600'
        }`}
      >
        {label}
      </button>
    )
  }

  return (
    <main className="flex h-screen w-screen flex-col bg-stone-900 text-stone-100">
      <header className="flex shrink-0 items-center justify-between gap-4 bg-stone-800 px-3 py-1.5 shadow-lg">
        {isPlaying ? (
          <TurnStatus game={game} me={me} connectionStatus={connectionStatus} />
        ) : (
          <span className="text-sm font-semibold">
            {game.state === 'Lobby' ? 'Venter på spillere' : 'Spillet er slut'}
          </span>
        )}
        <nav className="flex shrink-0 gap-2">
          {panelButton('players', `Spillere (${game.players.length})`)}
          {hasMission && panelButton('mission', 'Mission')}
          {me && hasCards && panelButton('cards', <CardsLabel gameId={gameId} playerId={me.id} />)}
        </nav>
      </header>

      <div className="[container-type:size] relative flex min-h-0 flex-1 items-center justify-center">
        {/* Exactly as large as the drawn map, so things can be placed relative to the map itself. */}
        <div className="relative" style={MAP_FRAME_STYLE}>
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

          {/* The sea west of South America is the largest part of the map without territories. */}
          {me && isPlaying && (
            <div className="absolute bottom-[2%] left-[1%] flex max-h-[42%] w-52 flex-col overflow-y-auto">
              {/* Keyed by turn, so results and errors from an earlier turn are not shown again. */}
              <ActionPanel
                key={`actions:${turn.id}`}
                gameId={gameId}
                me={me}
                turn={turn}
                names={names}
              />
            </div>
          )}
        </div>

        {game.state !== 'InProgress' && (
          <div className="absolute top-3 left-3 w-64">
            {game.state === 'Lobby' && (
              <WaitingRoom game={game} isHost={game.hostId === user?.id} />
            )}
            {game.state === 'Finished' && <GameOver game={game} me={me} />}
          </div>
        )}

        {openPanel && (
          <aside className="absolute top-3 right-3 flex max-h-[calc(100%-1.5rem)] w-72 flex-col overflow-y-auto">
            {openPanel === 'players' && (
              <PlayerList game={game} me={me} territories={board.territories} />
            )}
            {openPanel === 'mission' && hasMission && <MissionPanel gameId={gameId} />}
            {openPanel === 'cards' && me && hasCards && (
              <CardsPanel
                key={`cards:${turn.id}`}
                gameId={gameId}
                playerId={me.id}
                canTrade={turn.mode === 'deploy'}
                names={names}
              />
            )}
          </aside>
        )}
      </div>
    </main>
  )
}

/** The label of the cards button, with how many cards the player holds. */
function CardsLabel({ gameId, playerId }: { gameId: string; playerId: string }) {
  const { data: cards = [] } = useQuery(handQuery(gameId, playerId))
  return <>Kort ({cards.length})</>
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
