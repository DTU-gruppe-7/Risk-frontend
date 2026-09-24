import { useState } from 'react'
import Board from '../feature/map/Board'
import { mockTerritoryInfos, mockTerritoryStates, mockPlayers } from '../feature/map/mock'
import type { TerritoryId } from '../feature/map/types'
import { namesEn } from '../feature/map/names/en'
import { namesDa } from '../feature/map/names/da'

type Language = 'da' | 'en'

function App() {
  const [territories, setTerritories] = useState(mockTerritoryStates)
  const [language, setLanguage] = useState<Language>('da')
  const [selectedId, setSelectedId] = useState<TerritoryId | null>(null)

  const names = language === 'da' ? namesDa : namesEn

  function addUnit(territoryId: string) {
    setTerritories((prev) =>
      prev.map((t) => (t.territoryId === territoryId ? { ...t, units: t.units + 1 } : t)),
    )
  }

  function toggleFog(territoryId: string) {
    setTerritories((prev) =>
      prev.map((t) => (t.territoryId === territoryId ? { ...t, visible: !t.visible } : t)),
    )
  }

  function handleTerritoryClick(id: TerritoryId) {
    setSelectedId((prev) => (prev === id ? null : id))
  }

  return (
    <main className="flex h-screen w-screen items-center justify-center bg-stone-900 p-4">
      {import.meta.env.DEV && (
        <div className="absolute top-4 left-4 flex gap-2">
          <button
            className="rounded bg-stone-700 px-3 py-1 text-stone-100 hover:bg-stone-600"
            onClick={() => setLanguage(language === 'da' ? 'en' : 'da')}
          >
            {language === 'da' ? 'English' : 'Dansk'}
          </button>
          <button
            className="rounded bg-stone-700 px-3 py-1 text-stone-100 hover:bg-stone-600"
            onClick={() => addUnit('alaska')}
          >
            +1 Alaska
          </button>
          <button
            className="rounded bg-stone-700 px-3 py-1 text-stone-100 hover:bg-stone-600"
            onClick={() => toggleFog('alaska')}
          >
            Toogle Alaska
          </button>
        </div>
      )}
      <Board
        territories={territories}
        infos={mockTerritoryInfos}
        names={names}
        players={mockPlayers}
        selectedId={selectedId}
        onTerritoryClick={handleTerritoryClick}
      />
    </main>
  )
}

export default App
