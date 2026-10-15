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

// ---- Backend: spilregler (mock indtil backend er klar) ----
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
  visible: boolean
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
