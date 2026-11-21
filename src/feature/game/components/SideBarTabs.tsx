import { CountBadge } from './ui'

export interface SideBarTab<T extends string> {
  id: T
  label: string
  /** Shown in a badge after the label, e.g. how many cards the player holds. */
  count?: number
}

interface SideBarTabsProps<T extends string> {
  tabs: SideBarTab<T>[]
  openId: T | null
  /** Called with the tab to open, or null when the open tab is clicked again to close it. */
  onChange: (id: T | null) => void
}

/** The row of tabs in the side bar. At most one is open, and clicking it again closes it. */
export default function SideBarTabs<T extends string>({
  tabs,
  openId,
  onChange,
}: SideBarTabsProps<T>) {
  return (
    <nav className="flex gap-1 rounded-xl border border-white/10 bg-black/30 p-1">
      {tabs.map((tab) => {
        const isOpen = tab.id === openId
        return (
          <button
            key={tab.id}
            type="button"
            aria-expanded={isOpen}
            onClick={() => onChange(isOpen ? null : tab.id)}
            className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg px-2 py-1.5 text-sm transition ${
              isOpen
                ? 'bg-amber-400/90 font-semibold text-stone-950 shadow'
                : 'text-stone-300 hover:bg-white/10 hover:text-stone-100'
            }`}
          >
            {tab.label}
            {tab.count !== undefined && <CountBadge>{tab.count}</CountBadge>}
          </button>
        )
      })}
    </nav>
  )
}
