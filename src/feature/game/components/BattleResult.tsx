import type { BattleReport } from '../useGameActions'

/** The dice of the last roll and what the whole attack cost each side. */
export default function BattleResult({ report }: { report: BattleReport }) {
  const lastRound = report.rounds.at(-1)
  const lost = (side: 'attackerLosses' | 'defenderLosses') =>
    report.rounds.reduce((sum, round) => sum + round[side], 0)

  return (
    <div className="rounded bg-stone-700/70 p-2 text-xs">
      {lastRound && (
        <p>
          Dig: {lastRound.attackerDice.join(' ')} · Forsvarer: {lastRound.defenderDice.join(' ')}
        </p>
      )}
      <p>
        Du mistede {lost('attackerLosses')}, forsvareren mistede {lost('defenderLosses')}
        {report.rounds.length > 1 && ` over ${report.rounds.length} runder`}.
      </p>
      {report.conquered && (
        <p className="font-semibold text-emerald-300">Territoriet er erobret!</p>
      )}
    </div>
  )
}
