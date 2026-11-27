import { Link } from '@tanstack/react-router'

const VARIANT_CLASSES = {
  // A small button in the top bar, beside the turn status.
  compact:
    'flex shrink-0 items-center gap-1.5 rounded-xl border border-white/10 bg-black/30 px-3 py-1.5 text-sm text-stone-200 transition hover:border-white/20 hover:bg-white/10 hover:text-stone-50',
  // The main action once the game is over.
  full: 'rounded bg-stone-600 px-3 py-2 text-center hover:bg-stone-500',
} as const

/**
 * Takes the player back to the lobby. It only leaves the page, not the game: the game is still
 * listed in the lobby and can be opened again from there.
 */
export default function BackToLobbyLink({
  variant = 'full',
}: {
  variant?: keyof typeof VARIANT_CLASSES
}) {
  return (
    <Link to="/" className={VARIANT_CLASSES[variant]}>
      {variant === 'compact' ? (
        <>
          <span aria-hidden="true">←</span>
          Lobby
        </>
      ) : (
        'Tilbage til lobbyen'
      )}
    </Link>
  )
}
