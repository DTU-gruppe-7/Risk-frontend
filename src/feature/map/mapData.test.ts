import { describe, expect, it } from 'vitest'
import { MAP_HEIGHT, MAP_WIDTH, territoryGeometries } from './geometry'
import { languages, territoryNames } from './names'
import { seaRoutes } from './seaRoutes'

// The map is drawn from hand-maintained data in several files. These tests catch a
// territory that is added, renamed or misspelled in one file but not in the others.

const ids = territoryGeometries.map((territory) => territory.id)

describe('the map data', () => {
  it('has the 42 territories of the classic board, each once', () => {
    expect(ids).toHaveLength(42)
    expect(new Set(ids).size).toBe(42)
  })

  it.each(languages)('has a name in "%s" for every territory, and no others', (language) => {
    const names = territoryNames[language]

    expect(Object.keys(names).sort()).toEqual([...ids].sort())
    expect(Object.values(names).every((name) => name.trim().length > 0)).toBe(true)
  })

  it('places every label inside the map', () => {
    for (const { id, labelPosition } of territoryGeometries) {
      expect(labelPosition.x, id).toBeGreaterThanOrEqual(0)
      expect(labelPosition.x, id).toBeLessThanOrEqual(MAP_WIDTH)
      expect(labelPosition.y, id).toBeGreaterThanOrEqual(0)
      expect(labelPosition.y, id).toBeLessThanOrEqual(MAP_HEIGHT)
    }
  })

  it('only draws sea routes between known territories', () => {
    for (const route of seaRoutes) {
      expect(ids, `${route.from} → ${route.to}`).toContain(route.from)
      expect(ids, `${route.from} → ${route.to}`).toContain(route.to)
    }
  })
})
