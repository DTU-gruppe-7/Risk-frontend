//This should be deleted when data is coming from backend

import { territoryGeometries } from './geometry'
import type { ContinentId, Player, TerritoryId, TerritoryInfo, TerritoryState } from './types'

const continentMembers: Record<ContinentId, TerritoryId[]> = {
  'north-america': [
    'alaska',
    'alberta',
    'central-america',
    'eastern-united-states',
    'greenland',
    'northwest-territory',
    'ontario',
    'quebec',
    'western-united-states',
  ],
  'south-america': ['argentina', 'brazil', 'venezuela', 'peru'],
  europe: [
    'great-britain',
    'iceland',
    'northern-europe',
    'scandinavia',
    'southern-europe',
    'ukraine',
    'western-europe',
  ],
  africa: ['congo', 'east-africa', 'egypt', 'madagascar', 'north-africa', 'south-africa'],
  asia: [
    'afghanistan',
    'china',
    'india',
    'irkutsk',
    'japan',
    'kamchatka',
    'middle-east',
    'mongolia',
    'siam',
    'siberia',
    'ural',
    'yakutsk',
  ],
  australia: ['eastern-australia', 'new-guinea', 'indonesia', 'western-australia'],
}

const adjacency: Record<TerritoryId, TerritoryId[]> = {
  alaska: ['northwest-territory', 'alberta', 'kamchatka'],
  'northwest-territory': ['alaska', 'alberta', 'ontario', 'greenland'],
  greenland: ['northwest-territory', 'ontario', 'quebec', 'iceland'],
  alberta: ['alaska', 'northwest-territory', 'ontario', 'western-united-states'],
  ontario: [
    'northwest-territory',
    'alberta',
    'western-united-states',
    'eastern-united-states',
    'quebec',
    'greenland',
  ],
  quebec: ['ontario', 'eastern-united-states', 'greenland'],
  'western-united-states': ['alberta', 'ontario', 'eastern-united-states', 'central-america'],
  'eastern-united-states': ['western-united-states', 'ontario', 'quebec', 'central-america'],
  'central-america': ['western-united-states', 'eastern-united-states', 'venezuela'],

  venezuela: ['central-america', 'peru', 'brazil'],
  peru: ['venezuela', 'brazil', 'argentina'],
  brazil: ['venezuela', 'peru', 'argentina', 'north-africa'],
  argentina: ['peru', 'brazil'],

  iceland: ['greenland', 'great-britain', 'scandinavia'],
  'great-britain': ['iceland', 'scandinavia', 'northern-europe', 'western-europe'],
  scandinavia: ['iceland', 'great-britain', 'northern-europe', 'ukraine'],
  'northern-europe': [
    'great-britain',
    'scandinavia',
    'ukraine',
    'southern-europe',
    'western-europe',
  ],
  'western-europe': ['great-britain', 'northern-europe', 'southern-europe', 'north-africa'],
  'southern-europe': [
    'western-europe',
    'northern-europe',
    'ukraine',
    'middle-east',
    'egypt',
    'north-africa',
  ],
  ukraine: [
    'scandinavia',
    'northern-europe',
    'southern-europe',
    'middle-east',
    'afghanistan',
    'ural',
  ],

  'north-africa': ['brazil', 'western-europe', 'southern-europe', 'egypt', 'east-africa', 'congo'],
  egypt: ['north-africa', 'southern-europe', 'middle-east', 'east-africa'],
  'east-africa': ['egypt', 'north-africa', 'congo', 'south-africa', 'madagascar', 'middle-east'],
  congo: ['north-africa', 'east-africa', 'south-africa'],
  'south-africa': ['congo', 'east-africa', 'madagascar'],
  madagascar: ['south-africa', 'east-africa'],

  ural: ['ukraine', 'siberia', 'china', 'afghanistan'],
  siberia: ['ural', 'yakutsk', 'irkutsk', 'mongolia', 'china'],
  yakutsk: ['siberia', 'kamchatka', 'irkutsk'],
  kamchatka: ['yakutsk', 'irkutsk', 'mongolia', 'japan', 'alaska'],
  irkutsk: ['siberia', 'yakutsk', 'kamchatka', 'mongolia'],
  mongolia: ['siberia', 'irkutsk', 'kamchatka', 'japan', 'china'],
  japan: ['kamchatka', 'mongolia'],
  afghanistan: ['ukraine', 'ural', 'china', 'india', 'middle-east'],
  china: ['afghanistan', 'ural', 'siberia', 'mongolia', 'siam', 'india'],
  'middle-east': ['ukraine', 'southern-europe', 'egypt', 'east-africa', 'india', 'afghanistan'],
  india: ['middle-east', 'afghanistan', 'china', 'siam'],
  siam: ['india', 'china', 'indonesia'],

  indonesia: ['siam', 'new-guinea', 'western-australia'],
  'new-guinea': ['indonesia', 'western-australia', 'eastern-australia'],
  'western-australia': ['indonesia', 'new-guinea', 'eastern-australia'],
  'eastern-australia': ['new-guinea', 'western-australia'],
}

export const mockTerritoryInfos: TerritoryInfo[] = Object.entries(continentMembers).flatMap(
  ([continent, ids]) =>
    ids.map((id) => ({ id, continent: continent as ContinentId, adjacent: adjacency[id] ?? [] })),
)

export const mockPlayers: Player[] = [
  { id: 'p1', name: 'Rød', color: '#9e2b25' },
  { id: 'p2', name: 'Blå', color: '#2f4f7f' },
  { id: 'p3', name: 'Grøn', color: '#4f6b2f' },
]

export const mockTerritoryStates: TerritoryState[] = territoryGeometries.map(
  (territory, index) => ({
    territoryId: territory.id,
    ownerId: mockPlayers[index % mockPlayers.length].id,
    units: ((index * 7) % 12) + 1,
    visible: true,
  }),
)
