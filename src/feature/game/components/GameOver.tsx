import { playerName } from '../playerName'
import type { GameDto, PlayerDto } from '../types'
import BackToLobbyLink from './BackToLobbyLink'
import { Panel } from './ui'

/** The result of a finished game. A game the host ended early has no winner. */
export default function GameOver({ game, me }: { game: GameDto; me: PlayerDto | undefined }) {
  const winner = game.players.find((player) => player.id === game.winnerId)

  return (
    <Panel title="Spillet er slut">
      {winner && (
        <p className="text-lg">
          {winner.id === me?.id ? 'Du har vundet!' : `${playerName(winner)} har vundet.`}
        </p>
      )}
      <BackToLobbyLink />
    </Panel>
  )
}
