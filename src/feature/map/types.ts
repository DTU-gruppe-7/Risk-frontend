// ---- Id'er (skal matche backenden) ----
export type TerritoryId = string
export type ContinentId =
  'north-america' | 'south-america' | 'europe' | 'africa' | 'asia' | 'australia'
export type PlayerId = string

// ---- Frontend: kun visuelt ----
export interface Point {
  x: number
  y: number
}

export interface TerritoryGeometry {
  id: TerritoryId
  path: string // SVG "d"-attribut
  labelPosition: Point // hvor navn + enheder tegnes
}

// ---- Backend: det statiske kort (GET /api/map, seedet i databasen) ----
export interface MapContinentDto {
  id: ContinentId
  name: string
  captureBonus: number
}

export interface MapTerritoryDto {
  id: TerritoryId
  continentId: ContinentId
  neighborIds: TerritoryId[]
}

export interface MapDto {
  continents: MapContinentDto[]
  territories: MapTerritoryDto[]
}

// Kortet i den form Board bruger det
export interface TerritoryInfo {
  id: TerritoryId
  continent: ContinentId
  adjacent: TerritoryId[]
}

// ---- Frontend: Kun visuelt ----
export type TerritoryNames = Record<TerritoryId, string>

// ---- Backend: spiltilstand (ændrer sig løbende) ----
export interface TerritoryState {
  territoryId: TerritoryId
  ownerId: PlayerId | null // null = ingen ejer endnu
  units: number
  /** Fog of war: om spilleren må se feltet. Beregnes pr. spiller i backenden. */
  visible: boolean
  /** Blizzard-mode: ufremkommeligt hele spillet. Offentligt, altid synligt. */
  blizzard: boolean
}

export interface Player {
  id: PlayerId
  name: string
  color: string // f.eks. "#d33"
}

export interface SeaRoute {
  from: TerritoryId
  to: TerritoryId
  path: string
}
