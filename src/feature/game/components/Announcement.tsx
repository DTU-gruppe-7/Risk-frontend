import type { ReactNode } from 'react'

interface AnnouncementProps {
  /** The colour of the frame, e.g. the colour of the player it is about. */
  borderColor?: string
  /** How much to scale the box, following the width the map is drawn at. */
  scale: number
  /** Called when the box has faded out. */
  onDone: () => void
  children: ReactNode
}

/**
 * A box that briefly pops up in the middle of the map and fades out by itself, e.g. whose turn it
 * now is. Place it in an announcement layer on top of the map (see GamePage); it never blocks the
 * clicks on the map. Give it a new key to start the animation over.
 */
export default function Announcement({ borderColor, scale, onDone, children }: AnnouncementProps) {
  return (
    <div
      role="status"
      className="flex animate-announcement flex-col items-center gap-2 rounded-2xl border-2 border-amber-100/20 bg-stone-950/85 px-10 py-5 text-stone-100 shadow-2xl ring-1 ring-white/5 backdrop-blur-sm ring-inset"
      style={{ borderColor, zoom: scale }}
      onAnimationEnd={(event) => {
        // Only the box's own animation, not one inside it.
        if (event.target === event.currentTarget) onDone()
      }}
    >
      {children}
    </div>
  )
}
