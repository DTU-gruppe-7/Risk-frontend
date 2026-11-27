import type { BattleReport } from '../useGameActions'

/** One die, in red for the attacker and white for the defender as on the board game. */
function Die({ value, side }: { value: number; side: 'attacker' | 'defender' }) {
  return (
    <span
      className={`grid h-6 w-6 place-items-center rounded-md text-sm font-bold tabular-nums shadow ${
        side === 'attacker' ? 'bg-red-600 text-white' : 'bg-stone-100 text-stone-900'
      }`}
    >
      {value}
    </span>
  )
}

function DiceRow({
  label,
  dice,
  side,
}: {
  label: string
  dice: number[]
  side: 'attacker' | 'defender'
}) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-stone-400">{label}</span>
      <span className="flex gap-1">
        {dice.map((value, index) => (
          <Die key={index} value={value} side={side} />
        ))}
      </span>
    </div>
  )
}

/** The dice of the last roll and what the whole attack cost each side. */
export default function BattleResult({ report }: { report: BattleReport }) {
  const lastRound = report.rounds.at(-1)
  const lost = (side: 'attackerLosses' | 'defenderLosses') =>
    report.rounds.reduce((sum, round) => sum + round[side], 0)

  return (
    <div className="flex flex-col gap-1.5 rounded-xl border border-white/10 bg-black/30 p-2.5 text-xs">
      {lastRound && (
        <>
          <DiceRow label="Dig" dice={lastRound.attackerDice} side="attacker" />
          <DiceRow label="Forsvarer" dice={lastRound.defenderDice} side="defender" />
        </>
      )}
      <p className="text-stone-300">
        Du mistede <span className="font-semibold text-red-300">{lost('attackerLosses')}</span>,
        forsvareren mistede{' '}
        <span className="font-semibold text-emerald-300">{lost('defenderLosses')}</span>
        {report.rounds.length > 1 && ` over ${report.rounds.length} runder`}.
      </p>
      {report.conquered && (
        <p className="rounded-lg bg-emerald-500/15 px-2 py-1 text-center font-semibold text-emerald-300">
          Territoriet er erobret!
        </p>
      )}
    </div>
  )
}
