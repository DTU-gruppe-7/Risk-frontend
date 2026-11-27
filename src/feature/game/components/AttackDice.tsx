import { useEffect, useState, type CSSProperties } from 'react'
import type { Player, PlayerId } from '../../map/types'
import {
  IMPACT_MS,
  LEAVE_MS,
  PAIR_DELAY_MS,
  type AttackReveal,
  type DuelDie,
  type RollStep,
} from '../useAttackReveal'
import Die from './Die'

/** The attacker's dice lie above the defender's. */
type Side = 'attacker' | 'defender'

/** The colour of a die whose player is not known. */
const UNKNOWN_PLAYER_COLOR = 'gray'

const DIE_SIZE = 'h-12 w-12'
/** How far a winning die moves towards the losing one: past the gap between the rows (gap-6). */
const STRIKE_DISTANCE = '2.6rem'

/** The losing die breaks into four pieces, cut from the centre, that fly off each their way. */
const SHARDS = [
  { clip: 'polygon(0 0, 100% 0, 50% 50%)', x: '0.3rem', y: '-1.8rem', r: '-40deg' },
  { clip: 'polygon(100% 0, 100% 100%, 50% 50%)', x: '1.8rem', y: '0.2rem', r: '55deg' },
  { clip: 'polygon(100% 100%, 0 100%, 50% 50%)', x: '-0.4rem', y: '1.8rem', r: '35deg' },
  { clip: 'polygon(0 100%, 0 0, 50% 50%)', x: '-1.8rem', y: '-0.3rem', r: '-60deg' },
] as const

const randomFace = () => Math.floor(Math.random() * 6) + 1
const randomFaces = (count: number) => Array.from({ length: count }, randomFace)

/** Faces that keep changing at random, for as long as the dice are shown rolling. */
function useTumblingFaces(count: number) {
  const [faces, setFaces] = useState(() => randomFaces(count))
  useEffect(() => {
    const timer = setInterval(() => setFaces(randomFaces(count)), 90)
    return () => clearInterval(timer)
  }, [count])
  return faces
}

/** A die that is struck by the winning die and breaks. Without movement, it just fades. */
function BreakingDie({ value, color, delay }: { value: number; color: string; delay: string }) {
  return (
    <span className={`relative ${DIE_SIZE}`}>
      <span className="motion-reduce:hidden">
        {SHARDS.map((shard) => (
          <span
            key={shard.clip}
            className="absolute inset-0 animate-dice-shard"
            style={
              {
                clipPath: shard.clip,
                animationDelay: delay,
                '--shard-x': shard.x,
                '--shard-y': shard.y,
                '--shard-r': shard.r,
              } as CSSProperties
            }
          >
            <Die value={value} color={color} className={DIE_SIZE} />
          </span>
        ))}
      </span>
      <span className="hidden opacity-30 motion-reduce:block">
        <Die value={value} color={color} className={DIE_SIZE} />
      </span>
    </span>
  )
}

/** One side's dice after they have landed, playing their part in the step the roll is at. */
function LandedDice({
  dice,
  side,
  color,
  step,
}: {
  dice: DuelDie[]
  side: Side
  color: string
  step: RollStep
}) {
  // The attacker's dice lie above the defender's, so they strike downwards and the defender's up.
  const strikeY = side === 'attacker' ? STRIKE_DISTANCE : `-${STRIKE_DISTANCE}`

  return dice.map((die, index) => {
    const pairDelay = (index * PAIR_DELAY_MS) / 1000
    if (step !== 'landed' && die.outcome === 'lost') {
      return (
        <BreakingDie
          key={index}
          value={die.value}
          color={color}
          delay={`${pairDelay + IMPACT_MS / 1000}s`}
        />
      )
    }
    const animation =
      step === 'landed'
        ? 'motion-safe:animate-dice-land'
        : die.outcome === 'won'
          ? // Above the die it hits, so it is not drawn behind the pieces.
            'relative z-10 motion-safe:animate-dice-strike'
          : 'opacity-40 transition-opacity duration-300'
    return (
      <span
        key={index}
        className={animation}
        style={
          step === 'landed'
            ? undefined
            : ({ '--strike-y': strikeY, animationDelay: `${pairDelay}s` } as CSSProperties)
        }
      >
        <Die value={die.value} color={color} className={DIE_SIZE} />
      </span>
    )
  })
}

function TumblingDice({ count, color }: { count: number; color: string }) {
  const faces = useTumblingFaces(count)
  return faces.map((value, index) => (
    // Out of step with each other, so they do not turn as one.
    <span
      key={index}
      className="motion-safe:animate-dice-tumble"
      style={{ animationDelay: `${index * -0.13}s` }}
    >
      <Die value={value} color={color} className={DIE_SIZE} />
    </span>
  ))
}

/**
 * The player's latest attack roll, in the middle of the map: the dice tumble until the server has
 * rolled them, land on their values, and then the winning die of each pair smashes the one it
 * beat. Then the dice fade away. The steps are timed by useAttackReveal, which also holds the
 * result back on the board until the dice have shown it. A blitz is only shown in the side bar.
 * Place it in the announcement layer on top of the map.
 */
export default function AttackDice({
  reveal,
  players,
  scale,
}: {
  reveal: AttackReveal
  players: Player[]
  scale: number
}) {
  const { roll, duel, step } = reveal
  if (!roll || step === 'done') return null

  // Each side's dice in the colour of the player who rolls them.
  const colorOf = (playerId: PlayerId | null) =>
    players.find((player) => player.id === playerId)?.color ?? UNKNOWN_PLAYER_COLOR
  const attackerColor = colorOf(roll.from.ownerId)
  const defenderColor = colorOf(roll.to.ownerId)

  return (
    <div
      role="status"
      aria-label="Terningkast"
      className={`flex flex-col items-center gap-6 rounded-3xl bg-stone-950/35 px-8 py-6 shadow-2xl shadow-black/40 backdrop-blur-[2px] transition-opacity ${
        step === 'leaving' ? 'opacity-0' : 'opacity-100'
      }`}
      style={{ zoom: scale, transitionDuration: `${LEAVE_MS}ms` }}
    >
      {step === 'rolling' || !duel ? (
        <>
          <div className="flex gap-3">
            <TumblingDice count={roll.attackerDiceCount} color={attackerColor} />
          </div>
          <div className="flex min-h-12 gap-3">
            {/* The server decides the defender's dice, so they only start rolling once it has
                answered. Keyed by the count, so they start with the right number of faces. */}
            <TumblingDice
              key={roll.defenderDiceCount ?? 0}
              count={roll.defenderDiceCount ?? 0}
              color={defenderColor}
            />
          </div>
        </>
      ) : (
        <>
          <div className="flex gap-3">
            <LandedDice dice={duel.attacker} side="attacker" color={attackerColor} step={step} />
          </div>
          <div className="flex gap-3">
            <LandedDice dice={duel.defender} side="defender" color={defenderColor} step={step} />
          </div>
        </>
      )}
    </div>
  )
}
