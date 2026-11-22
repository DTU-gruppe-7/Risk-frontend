import { useEffect, useState } from 'react'
import { Link, useParams, type ErrorComponentProps } from '@tanstack/react-router'
import { useAuth } from '../../auth/useAuth'
import { isApiError } from '../../api/errors'
import Board from '../map/Board'
import MapBackdrop from '../map/MapBackdrop'
import { MAP_HEIGHT, MAP_WIDTH } from '../map/geometry'
import { useContinents, useTerritoryInfos } from '../map/queries'
import { territoryNames } from '../map/names'
import type { TerritoryId } from '../map/types'
import ActionPanel from './components/ActionPanel'
import BackToLobbyLink from './components/BackToLobbyLink'
import CardsPanel from './components/CardsPanel'
import GameOver from './components/GameOver'
import MissionPanel from './components/MissionPanel'
import NewCardsBanner from './components/NewCardsBanner'
import PlayerList from './components/PlayerList'
import SideBarTabs, { type SideBarTab } from './components/SideBarTabs'
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
  // The side bar sits beside the map, never on top of it: the map shrinks to make room, so every
  // territory can still be clicked. One of its tabs is open at a time, and it can be closed.
  const [openPanel, setOpenPanel] = useState<PanelId | null>('players')
  const { frameRef, scale } = useMapScale()

  const isPlaying = game.state === 'InProgress'
  // Missions are dealt when the game starts, so there is nothing to show in the lobby.
  const hasMission = Boolean(me && game.settings?.hasMissions && game.state !== 'Lobby')
  const hasCards = Boolean(me && isPlaying)

  const tabs: SideBarTab<PanelId>[] = [
    { id: 'players', label: 'Spillere', count: game.players.length },
    ...(hasMission ? [{ id: 'mission' as const, label: 'Mission' }] : []),
    ...(hasCards ? [{ id: 'cards' as const, label: 'Kort', count: hand.cards.length }] : []),
  ]

  return (
    <main className="flex h-screen w-screen flex-col text-stone-100">
      <MapBackdrop />

      <header className="relative z-10 flex shrink-0 items-center gap-4 border-b border-amber-100/10 bg-linear-to-b from-stone-900/55 to-stone-900/40 px-3 py-2 shadow-lg shadow-black/40 backdrop-blur-sm">
        <BackToLobbyLink variant="compact" />
        {isPlaying ? (
          <TurnStatus game={game} me={me} connectionStatus={connectionStatus} />
        ) : (
          <span className="font-serif text-lg text-amber-50">
            {game.state === 'Lobby' ? 'Venter på spillere' : 'Spillet er slut'}
          </span>
        )}
      </header>

      <div className="relative flex min-h-0 flex-1">
        <aside className="flex w-64 shrink-0 flex-col gap-3 overflow-y-auto border-r border-amber-100/10 bg-stone-900/40 p-2.5 backdrop-blur-sm xl:w-72">
          {/* What the player can do right now, e.g. how many troops are left and where they go. */}
          {me && isPlaying && (
            // Keyed by turn, so results and errors from an earlier turn are not shown again.
            <ActionPanel
              key={`actions:${turn.id}`}
              gameId={gameId}
              me={me}
              turn={turn}
              cardCount={hand.cards.length}
              names={names}
            />
          )}
          {game.state === 'Lobby' && <WaitingRoom game={game} isHost={game.hostId === user?.id} />}
          {game.state === 'Finished' && <GameOver game={game} me={me} />}

          <SideBarTabs tabs={tabs} openId={openPanel} onChange={setOpenPanel} />
          {openPanel === 'players' && (
            <PlayerList
              game={game}
              me={me}
              territories={board.territories}
              infos={territoryInfos}
            />
          )}
          {openPanel === 'mission' && hasMission && <MissionPanel gameId={gameId} />}
          {openPanel === 'cards' && me && hasCards && (
            <CardsPanel
              key={`cards:${turn.id}`}
              gameId={gameId}
              playerId={me.id}
              cards={hand.cards}
              canTrade={turn.mode === 'deploy'}
              setsTraded={
                game.settings?.cardTradeMode === 'Progressive' ? (game.cardSetsTraded ?? 0) : null
              }
              territories={board.territories}
              names={names}
            />
          )}
        </aside>

        {/* The map lies on top of a blurred copy of itself, as in the lobby. */}
        <div className="[container-type:size] relative flex min-w-0 flex-1 items-center justify-center">
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
        </div>
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
