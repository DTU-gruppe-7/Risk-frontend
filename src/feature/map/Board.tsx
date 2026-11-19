import mapBackground from '../../assets/map/map-background.svg'
import { MAP_HEIGHT, MAP_WIDTH, MAP_VIEWBOX, territoryGeometries } from './geometry'
import TerritoryLabel from './TerritoryLabel'
import { seaRoutes } from './seaRoutes'
import type {
  ContinentId,
  MapContinentDto,
  Point,
  TerritoryId,
  TerritoryNames,
  TerritoryState,
  TerritoryInfo,
  Player,
} from './types'
import { BLIZZARD_COLOR, CONTINENT_COLORS, FOG_COLOR, NEUTRAL_BORDER_COLOR } from './colors'

const INK = '#4a3522'
const PAPER = '#f3e7c9'

/** Where each continent's bonus is written: a spot in the sea right next to the continent. */
const BONUS_POSITIONS: Record<ContinentId, Point> = {
  'north-america': { x: 70, y: 160 },
  'south-america': { x: 268, y: 385 },
  europe: { x: 340, y: 72 },
  africa: { x: 345, y: 365 },
  asia: { x: 682, y: 225 },
  australia: { x: 592, y: 392 },
}

/** How far outside a continent its border reaches, in map units. */
const CONTINENT_BORDER_WIDTH = 1.8
/** The width of the black line on each side of a player's border. */
const CONTINENT_BORDER_EDGE = 0.6

interface BoardProps {
  territories: TerritoryState[]
  infos: TerritoryInfo[]
  continents: MapContinentDto[]
  names: TerritoryNames
  players: Player[]
  selectedId: TerritoryId | null
  /** Territories to outline as possible choices, e.g. what the selected one can attack. */
  highlightedIds?: TerritoryId[]
  /** The chosen one among the highlighted territories. */
  targetId?: TerritoryId | null
  onTerritoryClick: (id: TerritoryId) => void
}

function Board({
  territories,
  infos,
  continents,
  players,
  names,
  selectedId,
  highlightedIds = [],
  targetId = null,
  onTerritoryClick,
}: BoardProps) {
  const stateById = new Map(territories.map((t) => [t.territoryId, t]))
  const infoById = new Map(infos.map((i) => [i.id, i]))
  const playersById = new Map(players.map((p) => [p.id, p]))

  // Blizzards are public and always shown, but never part of play.
  const isBlizzard = (id: TerritoryId) => stateById.get(id)?.blizzard ?? false
  const isVisible = (id: TerritoryId) => stateById.get(id)?.visible ?? false
  const isPlayable = (id: TerritoryId) => isVisible(id) && !isBlizzard(id)

  const selected =
    selectedId && isPlayable(selectedId)
      ? territoryGeometries.find((t) => t.id === selectedId)
      : undefined
  const highlighted = territoryGeometries.filter(
    (t) => highlightedIds.includes(t.id) && isPlayable(t.id),
  )
  const target = highlighted.find((t) => t.id === targetId)

  /**
   * The colour of the player who holds every territory of a continent, or null when nobody does.
   * Blizzards cannot be held and do not count. Under fog of war it is only known when the whole
   * continent can be seen.
   */
  function continentOwnerColor(continentId: ContinentId) {
    const states = infos
      .filter((info) => info.continent === continentId)
      .map((info) => stateById.get(info.id))
      .filter((state) => !state?.blizzard)
    const ownerId = states[0]?.ownerId
    if (!ownerId || !states.every((state) => state?.visible && state.ownerId === ownerId)) {
      return null
    }
    return playersById.get(ownerId)?.color ?? null
  }

  const continentOwners = continents.map((continent) => ({
    continent,
    color: continentOwnerColor(continent.id),
  }))

  function fillFor(id: TerritoryId) {
    if (isBlizzard(id)) return BLIZZARD_COLOR
    const info = infoById.get(id)
    return isVisible(id) && info ? CONTINENT_COLORS[info.continent] : FOG_COLOR
  }

  return (
    <svg viewBox={MAP_VIEWBOX} className="h-full w-full">
      {/* Layer 1: background */}
      <image href={mapBackground} width={MAP_WIDTH} height={MAP_HEIGHT} />

      {/* Layer 2: sea routes (a route into a blizzard leads nowhere, so it is hidden) */}
      <g
        fill="none"
        stroke="#4a3522"
        strokeOpacity={0.75}
        strokeWidth={1.1}
        strokeDasharray="3 2.5"
        strokeLinecap="round"
        pointerEvents="none"
      >
        {seaRoutes
          .filter((route) => isPlayable(route.from) && isPlayable(route.to))
          .map((route) => (
            <path key={`${route.from}-${route.to}`} d={route.path} />
          ))}
      </g>

      {/* Layer 3: territories */}
      <g>
        {territoryGeometries.map((territory) => {
          const playable = isPlayable(territory.id)
          const isSelected = playable && (territory.id === selectedId || territory.id === targetId)

          return (
            <path
              key={territory.id}
              id={territory.id}
              d={territory.path}
              fill={fillFor(territory.id)}
              fillOpacity={isSelected ? 1.0 : 0.75}
              stroke="#4a3522"
              strokeWidth={0.7}
              strokeLinejoin="round"
              style={{ mixBlendMode: 'multiply' }}
              pointerEvents={playable ? 'auto' : 'none'}
              className={
                playable
                  ? 'cursor-pointer transition-[fill-opacity] duration-150 hover:[fill-opacity:1.0]'
                  : undefined
              }
              onClick={() => onTerritoryClick(territory.id)}
            />
          )
        })}
      </g>

      {/* Layer 4: a border around each continent, showing which territories belong together. It
          has the colour of the player who holds the whole continent, and is neutral otherwise.
          The filter grows the continent's shape a little and keeps only the part outside it. */}
      <g pointerEvents="none">
        {continentOwners.map(({ continent, color }) => (
          <g key={continent.id}>
            {color ? (
              // A player's border has a black line on each side, so it stands out even when the
              // territories next to it have nearly the same colour.
              <filter id={`continent-border-${continent.id}`}>
                <feMorphology
                  in="SourceAlpha"
                  operator="dilate"
                  radius={CONTINENT_BORDER_EDGE}
                  result="inner"
                />
                <feMorphology
                  in="SourceAlpha"
                  operator="dilate"
                  radius={CONTINENT_BORDER_EDGE + CONTINENT_BORDER_WIDTH}
                  result="middle"
                />
                <feMorphology
                  in="SourceAlpha"
                  operator="dilate"
                  radius={2 * CONTINENT_BORDER_EDGE + CONTINENT_BORDER_WIDTH}
                  result="outer"
                />
                <feFlood floodColor="black" />
                <feComposite in2="outer" operator="in" />
                <feComposite in2="SourceAlpha" operator="out" result="edges" />
                <feFlood floodColor={color} />
                <feComposite in2="middle" operator="in" />
                <feComposite in2="inner" operator="out" result="band" />
                <feMerge>
                  <feMergeNode in="edges" />
                  <feMergeNode in="band" />
                </feMerge>
              </filter>
            ) : (
              <filter id={`continent-border-${continent.id}`}>
                <feMorphology
                  in="SourceAlpha"
                  operator="dilate"
                  radius={CONTINENT_BORDER_WIDTH}
                  result="grown"
                />
                <feFlood floodColor={NEUTRAL_BORDER_COLOR} />
                <feComposite in2="grown" operator="in" />
                <feComposite in2="SourceAlpha" operator="out" />
              </filter>
            )}
            {/* The stroke closes the hairline gaps between neighbouring territories. */}
            <g
              filter={`url(#continent-border-${continent.id})`}
              stroke="black"
              strokeWidth={0.7}
              opacity={color ? 1 : 0.9}
            >
              {territoryGeometries
                .filter((t) => infoById.get(t.id)?.continent === continent.id)
                .map((t) => (
                  <path key={t.id} d={t.path} />
                ))}
            </g>
          </g>
        ))}
      </g>

      {/* Layer 5: selection, possible choices and the chosen target */}
      <g fill="none" strokeLinejoin="round" pointerEvents="none">
        {highlighted.map((t) => (
          <path key={t.id} d={t.path} stroke="#fff6dc" strokeWidth={1.2} strokeDasharray="3 2" />
        ))}
        {[selected, target].map(
          (t) =>
            t && (
              <g key={t.id}>
                <path d={t.path} stroke="#4a3522" strokeWidth={2.0} />
                <path d={t.path} stroke="#fff6dc" strokeWidth={1.0} />
              </g>
            ),
        )}
      </g>

      {/* Layer 6: what each continent gives per turn, in the colour of the player who holds it */}
      <g pointerEvents="none" fontFamily="Georgia, serif" fontWeight="bold" fontSize={11}>
        {continentOwners.map(({ continent, color }) => {
          const position = BONUS_POSITIONS[continent.id]
          return (
            <g
              key={continent.id}
              transform={`translate(${position.x} ${position.y})`}
              opacity={color ? 1 : 0.75}
            >
              <title>
                {continent.name}: +{continent.captureBonus} tropper pr. tur
              </title>
              <rect
                x={-13}
                y={-8}
                width={26}
                height={16}
                rx={8}
                fill={color ?? PAPER}
                stroke={INK}
                strokeWidth={0.8}
              />
              <text textAnchor="middle" dominantBaseline="central" fill={color ? PAPER : INK}>
                +{continent.captureBonus}
              </text>
            </g>
          )
        })}
      </g>

      {/* Layer 7: names and troops (blizzards get a name but no troops) */}
      <g pointerEvents="none">
        {territoryGeometries.map((territory) => {
          const state = stateById.get(territory.id)
          if (!state || !isVisible(territory.id)) return null
          return (
            <TerritoryLabel
              key={territory.id}
              position={territory.labelPosition}
              name={names[territory.id] ?? territory.id}
              ownerColor={state.ownerId ? (playersById.get(state.ownerId)?.color ?? null) : null}
              units={state.blizzard ? null : state.units}
            />
          )
        })}
      </g>
    </svg>
  )
}

export default Board
