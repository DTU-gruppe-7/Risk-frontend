import { useState, type ReactNode } from 'react'
import Board from '../feature/map/Board'
import { mockTerritoryStates, mockPlayers } from '../feature/map/mock'
import { useTerritoryInfos } from '../feature/map/queries'
import type { TerritoryId } from '../feature/map/types'
import { languages, territoryNames, type Language } from '../feature/map/names'

function App() {
  const territoryInfos = useTerritoryInfos()
  const [territories, setTerritories] = useState(mockTerritoryStates)
  const [language, setLanguage] = useState<Language>('da')
  const [selectedId, setSelectedId] = useState<TerritoryId | null>(null)

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

  function toggleBlizzard(territoryId: string) {
    setTerritories((prev) =>
      prev.map((t) => (t.territoryId === territoryId ? { ...t, blizzard: !t.blizzard } : t)),
    )
  }

  function nextLanguage() {
    setLanguage((prev) => languages[(languages.indexOf(prev) + 1) % languages.length])
  }

  function handleTerritoryClick(id: TerritoryId) {
    setSelectedId((prev) => (prev === id ? null : id))
  }

  return (
    <main className="flex h-screen w-screen items-center justify-center bg-stone-900 p-4">
      {import.meta.env.DEV && (
        <div className="absolute top-4 left-4 flex gap-2">
          <DevButton onClick={nextLanguage}>{language.toUpperCase()}</DevButton>
          <DevButton onClick={() => addUnit('alaska')}>+1 Alaska</DevButton>
          <DevButton onClick={() => toggleFog('alaska')}>Fog Alaska</DevButton>
          <DevButton onClick={() => toggleBlizzard('kamchatka')}>Blizzard Kamchatka</DevButton>
        </div>
      )}
      <Board
        territories={territories}
        infos={territoryInfos}
        names={territoryNames[language]}
        players={mockPlayers}
        selectedId={selectedId}
        onTerritoryClick={handleTerritoryClick}
      />
    </main>
  )
}

function DevButton({ onClick, children }: { onClick: () => void; children: ReactNode }) {
  return (
    <button
      className="rounded bg-stone-700 px-3 py-1 text-stone-100 hover:bg-stone-600"
      onClick={onClick}
    >
      {children}
    </button>
  )
}

export default App
