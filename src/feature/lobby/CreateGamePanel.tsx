import { useState, type FormEvent } from 'react'
import { useQuery } from '@tanstack/react-query'
import { cardTradeRulesQuery } from '../game/queries'
import type {
  CardTradeMode,
  CardTradeRulesResponse,
  CreateGameRequest,
  GameVictoryMode,
} from '../game/types'
import {
  ChoiceCards,
  ColorPicker,
  ErrorText,
  FieldLabel,
  Panel,
  PrimaryButton,
  Segmented,
  Toggle,
} from './ui'
import type { PlayerColor } from './playerColors'

const PLAYER_COUNTS = [2, 3, 4, 5, 6].map((n) => ({ value: n, label: String(n) }))

const VICTORY_MODES: { value: GameVictoryMode; title: string; description: string }[] = [
  { value: 'CompleteConquest', title: 'Total erobring', description: 'Erobr hele verden' },
  { value: 'Mission', title: 'Hemmelige missioner', description: 'Hver spiller får et mål' },
]

/** How many of the first progressive values to show in the explanation. */
const SHOWN_PROGRESSIVE_VALUES = 4

/** The two ways card sets are valued, explained with the values from the server once they are in. */
function cardTradeModes(
  rules: CardTradeRulesResponse | undefined,
): { value: CardTradeMode; title: string; description: string }[] {
  const fixed = rules?.fixedSets.map((set) => set.troops) ?? []
  const progressive = rules?.firstProgressiveValues.slice(0, SHOWN_PROGRESSIVE_VALUES) ?? []
  return [
    {
      value: 'Fixed',
      title: 'Faste værdier',
      description:
        fixed.length > 0
          ? `Et sæt giver ${Math.min(...fixed)}–${Math.max(...fixed)} tropper efter kortene`
          : 'Et sæt giver tropper efter kortene',
    },
    {
      value: 'Progressive',
      title: 'Stigende bonus',
      description:
        progressive.length > 0
          ? `Hvert sæt giver mere: ${progressive.join(', ')}, …`
          : 'Hvert sæt giver mere end det forrige',
    },
  ]
}

const TURN_TIMES = [
  { value: 0, label: 'Ingen' },
  { value: 60, label: '1 min' },
  { value: 120, label: '2 min' },
  { value: 300, label: '5 min' },
]

const MAX_BLIZZARDS = 6

export interface CreateGameInput {
  request: CreateGameRequest
  color: PlayerColor
}

export default function CreateGamePanel({
  onCreate,
  isPending,
  error,
}: {
  onCreate: (input: CreateGameInput) => void
  isPending: boolean
  error: Error | null
}) {
  const [maxPlayers, setMaxPlayers] = useState(4)
  const [color, setColor] = useState<PlayerColor>('red')
  const [victoryMode, setVictoryMode] = useState<GameVictoryMode>('CompleteConquest')
  const [cardTradeMode, setCardTradeMode] = useState<CardTradeMode>('Fixed')
  const { data: cardTradeRules } = useQuery(cardTradeRulesQuery())
  const [hasFogOfWar, setHasFogOfWar] = useState(false)
  const [blizzardCount, setBlizzardCount] = useState(0)
  const [turnTimeLimit, setTurnTimeLimit] = useState(0)

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    onCreate({
      color,
      request: {
        maxPlayers,
        victoryMode,
        hasMissions: victoryMode === 'Mission',
        cardTradeMode,
        hasFogOfWar,
        blizzardCount,
        turnTimeLimit,
      },
    })
  }

  return (
    <Panel eyebrow="Nyt felttog" title="Opret et spil">
      <form onSubmit={submit} className="flex flex-col gap-5">
        <div>
          <FieldLabel>Antal spillere</FieldLabel>
          <Segmented
            label="Antal spillere"
            options={PLAYER_COUNTS}
            value={maxPlayers}
            onChange={setMaxPlayers}
          />
        </div>

        <div>
          <FieldLabel>Din farve</FieldLabel>
          <ColorPicker value={color} onChange={setColor} />
        </div>

        <div>
          <FieldLabel>Sejrsbetingelse</FieldLabel>
          <ChoiceCards
            label="Sejrsbetingelse"
            options={VICTORY_MODES}
            value={victoryMode}
            onChange={setVictoryMode}
          />
        </div>

        <div>
          <FieldLabel hint="Når kort byttes">Bonustropper</FieldLabel>
          <ChoiceCards
            label="Bonustropper"
            options={cardTradeModes(cardTradeRules)}
            value={cardTradeMode}
            onChange={setCardTradeMode}
          />
        </div>

        <div className="flex flex-col gap-2">
          <FieldLabel>Regler</FieldLabel>
          <Toggle
            title="Fog of war"
            description="Du ser kun territorier op til dine egne"
            checked={hasFogOfWar}
            onChange={setHasFogOfWar}
          />
          <div className="rounded-xl border border-white/10 bg-black/20 p-3">
            <div className="flex items-center justify-between gap-4">
              <span>
                <span className="block text-sm font-medium text-stone-100">Snestorme</span>
                <span className="block text-xs text-stone-400">
                  Territorier der er ufremkommelige hele spillet
                </span>
              </span>
              <span className="font-serif text-xl text-amber-200 tabular-nums">
                {blizzardCount === 0 ? 'Fra' : blizzardCount}
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={MAX_BLIZZARDS}
              value={blizzardCount}
              onChange={(event) => setBlizzardCount(Number(event.target.value))}
              aria-label="Antal snestorme"
              className="mt-2 w-full accent-amber-400"
            />
          </div>
        </div>

        <div>
          <FieldLabel hint="Pr. tur">Tidsgrænse</FieldLabel>
          <Segmented
            label="Tidsgrænse pr. tur"
            options={TURN_TIMES}
            value={turnTimeLimit}
            onChange={setTurnTimeLimit}
          />
        </div>

        <PrimaryButton type="submit" disabled={isPending}>
          {isPending ? 'Opretter…' : 'Opret spil'}
        </PrimaryButton>
        {error && <ErrorText error={error} />}
      </form>
    </Panel>
  )
}
