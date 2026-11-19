import { useQuery } from '@tanstack/react-query'
import { missionsQuery } from '../queries'
import { Hint, Panel } from './ui'

/** The player's secret mission. Only rendered in games that are played with missions. */
export default function MissionPanel({ gameId }: { gameId: string }) {
  const { data: missions = [] } = useQuery(missionsQuery(gameId))

  return (
    <Panel title="Din mission">
      {missions.map((mission) => (
        <div key={mission.id}>
          <p className="text-sm font-semibold">{mission.title}</p>
          <Hint>{mission.description}</Hint>
        </div>
      ))}
    </Panel>
  )
}
