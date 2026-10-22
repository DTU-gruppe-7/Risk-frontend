import mapBackground from '../../assets/map/map-background.svg'
import { MAP_HEIGHT, MAP_WIDTH, MAP_VIEWBOX, territoryGeometries } from './geometry'
import TerritoryLabel from './TerritoryLabel'
import { seaRoutes } from './seaRoutes'
import type { TerritoryId, TerritoryNames, TerritoryState, TerritoryInfo, Player } from './types'
import { BLIZZARD_COLOR, CONTINENT_COLORS, FOG_COLOR } from './colors'

interface BoardProps {
  territories: TerritoryState[]
  infos: TerritoryInfo[]
  names: TerritoryNames
  players: Player[]
  selectedId: TerritoryId | null
  onTerritoryClick: (id: TerritoryId) => void
}

function Board({ territories, infos, players, names, selectedId, onTerritoryClick }: BoardProps) {
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
  const neighbors = selected
    ? territoryGeometries.filter(
        (t) => infoById.get(selected.id)?.adjacent.includes(t.id) && isPlayable(t.id),
      )
    : []

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
          const isSelected = playable && territory.id === selectedId

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

      {/* Layer 4: selection + neighbors */}

      {selected && (
        <g fill="none" strokeLinejoin="round" pointerEvents="none">
          {neighbors.map((n) => (
            <path key={n.id} d={n.path} stroke="#fff6dc" strokeWidth={1.2} strokeDasharray="3 2" />
          ))}
          <path d={selected.path} stroke="#4a3522" strokeWidth={2.0} />
          <path d={selected.path} stroke="#fff6dc" strokeWidth={1.0} />
        </g>
      )}

      {/* Layer 5: names and troops (blizzards get a name but no troops) */}
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
