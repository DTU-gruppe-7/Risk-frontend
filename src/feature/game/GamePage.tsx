import { useEffect, useState, type ReactNode } from 'react'
import { Link, useParams, type ErrorComponentProps } from '@tanstack/react-router'
import { useAuth } from '../../auth/useAuth'
import { isApiError } from '../../api/errors'
import Board from '../map/Board'
import { MAP_HEIGHT, MAP_WIDTH } from '../map/geometry'
import { useContinents, useTerritoryInfos } from '../map/queries'
import { territoryNames } from '../map/names'
import type { TerritoryId } from '../map/types'
import ActionPanel from './components/ActionPanel'
import CardsPanel from './components/CardsPanel'
import GameOver from './components/GameOver'
import MissionPanel from './components/MissionPanel'
import NewCardsBanner from './components/NewCardsBanner'
import PlayerList from './components/PlayerList'
import TurnBanner from './components/TurnBanner'
import TurnStatus from './components/TurnStatus'
import WaitingRoom from './components/WaitingRoom'
import { useGame } from './useGame'
import { troopRouteOf } from './rules'
import { useHand } from './useHand'
import { useOpponentSelection, useShareSelection } from './useLiveSelection'
import { useTurn } from './useTurn'

// The board keeps the map's proportions, so this is the largest frame that fits the space.
const MAP_FRAME_STYLE = {
  aspectRatio: `${MAP_WIDTH} / ${MAP_HEIGHT}`,
  width: `min(100cqw, 100cqh * ${MAP_WIDTH} / ${MAP_HEIGHT})`,
}

// The boxes on top of the map are drawn for a map this wide, and grow and shrink with it.
const DESIGN_MAP_WIDTH = 1150
const MIN_SCALE = 0.6
const MAX_SCALE = 2

/** How much to scale what lies on top of the map, following the width the map is drawn at. */
function useMapScale() {
  const [frame, setFrame] = useState<HTMLDivElement | null>(null)
  const [width, setWidth] = useState(0)

  useEffect(() => {
    if (!frame) return
    const observer = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width))
    observer.observe(frame)
    return () => observer.disconnect()
  }, [frame])

  // Before the first measurement there is no width to go by.
  const scale = width > 0 ? width / DESIGN_MAP_WIDTH : 1
  return { frameRef: setFrame, scale: Math.min(MAX_SCALE, Math.max(MIN_SCALE, scale)) }
}

type PanelId = 'players' | 'mission' | 'cards'

export default function GamePage() {
  const { gameId } = useParams({ from: '/authenticated/games/$gameId' })
  const { game, board, me, connectionStatus } = useGame(gameId)
  const { user } = useAuth()
  const territoryInfos = useTerritoryInfos()
  const continents = useContinents()
  const turn = useTurn(game, me, board.territories, territoryInfos)
  useShareSelection(gameId, turn, connectionStatus)
  const opponentSelection = useOpponentSelection(game, me, board.territories)
  const hand = useHand(game, me?.id)
  // The arrows follow the way troops go: through the player's own territories when fortifying.
  const routeOf = (
    sourceId: TerritoryId | null | undefined,
    targetId: TerritoryId | null | undefined,
    isFortifying: boolean,
  ) => troopRouteOf(sourceId, targetId, isFortifying, board.territories, territoryInfos)
  const arrowRoutes = [
    routeOf(turn.source?.territoryId, turn.target?.territoryId, turn.mode === 'fortify'),
    routeOf(
      opponentSelection?.sourceId,
      opponentSelection?.targetId,
      game.currentPhase === 'Fortify',
    ),
  ].filter((route) => route !== null)
  const names = territoryNames.da
  // The side panels are closed until asked for, so the map gets the whole screen.
  const [openPanel, setOpenPanel] = useState<PanelId | null>(null)
  const { frameRef, scale } = useMapScale()

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
          {me && hasCards && panelButton('cards', `Kort (${hand.cards.length})`)}
        </nav>
      </header>

      <div className="[container-type:size] relative flex min-h-0 flex-1 items-center justify-center">
        {/* Exactly as large as the drawn map, so things can be placed relative to the map itself. */}
        <div ref={frameRef} className="relative" style={MAP_FRAME_STYLE}>
          <Board
            territories={board.territories}
            infos={territoryInfos}
            continents={continents}
            names={names}
            players={board.players}
            selectedId={turn.source?.territoryId ?? null}
            highlightedIds={turn.targetIds}
            targetId={turn.target?.territoryId}
            remoteSelection={opponentSelection}
            arrowRoutes={arrowRoutes}
            onTerritoryClick={turn.select}
          />

          {/* The sea west of South America is the largest part of the map without territories. */}
          {me && isPlaying && (
            <div className="absolute bottom-[2%] left-[1%] max-h-[42%] overflow-y-auto">
              <div className="flex w-52 flex-col" style={{ zoom: scale }}>
                {/* Keyed by turn, so results and errors from an earlier turn are not shown again. */}
                <ActionPanel
                  key={`actions:${turn.id}`}
                  gameId={gameId}
                  me={me}
                  turn={turn}
                  cardCount={hand.cards.length}
                  names={names}
                />
              </div>
            </div>
          )}

          {/* Announcements in the middle of the map. */}
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-3">
            {me && isPlaying && (
              <NewCardsBanner
                cards={hand.newCards}
                names={names}
                scale={scale}
                onDone={hand.dismissNewCards}
              />
            )}
            {/* The new cards first, so they can be seen before the next player's turn is shown. */}
            <TurnBanner game={game} me={me} scale={scale} waiting={hand.isAnnouncing} />
          </div>
        </div>

        {game.state !== 'InProgress' && (
          <div className="absolute top-3 left-3 w-64">
            {game.state === 'Lobby' && (
              <WaitingRoom game={game} isHost={game.hostId === user?.id} />
            )}
            {game.state === 'Finished' && <GameOver game={game} me={me} />}
          </div>
        )}

        {openPanel && openPanel !== 'cards' && (
          <aside className="absolute top-3 right-3 max-h-[calc(100%-1.5rem)] overflow-y-auto">
            <div className="flex w-72 flex-col" style={{ zoom: scale }}>
              {openPanel === 'players' && (
                <PlayerList game={game} me={me} territories={board.territories} />
              )}
              {openPanel === 'mission' && hasMission && <MissionPanel gameId={gameId} />}
            </div>
          </aside>
        )}

        {/* The cards are only shown when asked for, so they take the middle of the screen. */}
        {openPanel === 'cards' && me && hasCards && (
          <div
            className="absolute inset-0 flex items-center justify-center bg-black/40 p-3"
            onClick={() => setOpenPanel(null)}
          >
            <div
              className="max-h-full overflow-y-auto"
              onClick={(event) => event.stopPropagation()}
            >
              {/* No wider than the cards need: the texts wrap instead of stretching the box. */}
              <div className="flex w-min min-w-72 flex-col" style={{ zoom: scale }}>
                <CardsPanel
                  key={`cards:${turn.id}`}
                  gameId={gameId}
                  playerId={me.id}
                  cards={hand.cards}
                  canTrade={turn.mode === 'deploy'}
                  setsTraded={
                    game.settings?.cardTradeMode === 'Progressive'
                      ? (game.cardSetsTraded ?? 0)
                      : null
                  }
                  territories={board.territories}
                  names={names}
                />
              </div>
            </div>
          </div>
        )}
      </div>
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
