import type { ContinentId } from './types'

export const CONTINENT_COLORS: Record<ContinentId, string> = {
  'north-america': '#d9b43c',
  'south-america': '#d9832f',
  europe: '#5b82c2',
  africa: '#c4533f',
  asia: '#7ea44c',
  australia: '#8f65b3',
}

/** The dark brown of the lines and text drawn on the map. */
export const INK = '#4a3522'

/** The light parchment colour behind text and on neutral badges. */
export const PAPER = '#f3e7c9'

/** The arrow from a picked territory to its target: black and white, so it stands out on any colour. */
export const ARROW_DARK = '#111111'
export const ARROW_LIGHT = '#ffffff'

/** The border around a continent that no single player holds. */
export const NEUTRAL_BORDER_COLOR = '#9c9585'

export const FOG_COLOR = '#8c8579'

export const BLIZZARD_COLOR = '#e9eef2'
