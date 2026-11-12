import type { GameDto } from '../types'
import { useStartGame } from '../useGameActions'
import { Button, ErrorText, Hint, Panel } from './ui'

const MIN_PLAYERS = 2

/** Shown before the game has started: who has joined, and the host's start button. */
export default function WaitingRoom({ game, isHost }: { game: GameDto; isHost: boolean }) {
  const start = useStartGame(game.id)
  const hasEnoughPlayers = game.players.length >= MIN_PLAYERS

  return (
    <Panel title="Venter på spillere">
      <p>
        {game.players.length}
        {game.settings && ` af ${game.settings.maxPlayers}`} spillere er med.
      </p>
      {isHost ? (
        <>
          {!hasEnoughPlayers && <Hint>Der skal være mindst {MIN_PLAYERS} spillere.</Hint>}
          <Button disabled={!hasEnoughPlayers || start.isPending} onClick={() => start.mutate()}>
            Start spillet
          </Button>
        </>
      ) : (
        <Hint>Venter på, at værten starter spillet.</Hint>
      )}
      <ErrorText error={start.error} />
    </Panel>
  )
}
