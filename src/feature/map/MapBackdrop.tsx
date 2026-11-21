import { useSuspenseQuery } from '@tanstack/react-query'
import mapBackground from '../../assets/map/map-background.svg'
import { CONTINENT_COLORS } from './colors'
import { MAP_HEIGHT, MAP_VIEWBOX, MAP_WIDTH, territoryGeometries } from './geometry'
import { mapQuery } from './queries'

/**
 * The board as a blurred, darkened backdrop behind a page, e.g. the lobby or a game. Purely
 * decorative: no labels, no interaction, hidden from screen readers. The route loader has already
 * fetched the map. Put the page's content in a positioned element after it, so it lies on top.
 */
export default function MapBackdrop() {
  const map = useSuspenseQuery(mapQuery()).data
  const continentById = new Map(map.territories.map((t) => [t.id, t.continentId]))

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 overflow-hidden bg-stone-950">
      {/* scale-110 pushes the blurred, see-through edges outside the viewport */}
      <svg
        viewBox={MAP_VIEWBOX}
        preserveAspectRatio="xMidYMid slice"
        className="absolute inset-0 h-full w-full scale-110 blur-[5px] saturate-[.85] motion-safe:animate-[backdrop-drift_60s_ease-in-out_infinite_alternate]"
      >
        <image href={mapBackground} width={MAP_WIDTH} height={MAP_HEIGHT} />
        <g stroke="#4a3522" strokeWidth={0.7} strokeLinejoin="round" fillOpacity={0.7}>
          {territoryGeometries.map((territory) => {
            const continent = continentById.get(territory.id)
            return (
              <path
                key={territory.id}
                d={territory.path}
                fill={continent ? CONTINENT_COLORS[continent] : 'transparent'}
              />
            )
          })}
        </g>
      </svg>

      {/* Darken towards the edges and the bottom, so the panels stay readable */}
      <div className="absolute inset-0 bg-stone-950/45" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_30%,rgb(12_10_9/0.85)_100%)]" />
      <div className="absolute inset-x-0 bottom-0 h-1/2 bg-linear-to-t from-stone-950/80 to-transparent" />
    </div>
  )
}
