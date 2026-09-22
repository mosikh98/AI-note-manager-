import { Plus, Search, Settings, Moon, Sun, NotebookText } from 'lucide-react'

export default function Sidebar({
  notes,
  selectedId,
  onSelect,
  onCreate,
  query,
  onQueryChange,
  onOpenSettings,
  darkMode,
  onToggleDark
}) {
  return (
    <aside className="flex h-full w-full max-w-xs flex-col border-e border-ink/10 bg-paper-soft dark:bg-paper-darksoft dark:border-ink-light/10">
      <div className="flex items-center gap-2 px-5 pt-6 pb-4">
        <NotebookText className="text-pine dark:text-pine-light" size={22} strokeWidth={1.8} />
        <h1 className="text-lg font-extrabold text-ink dark:text-ink-light">دفترچه</h1>
        <div className="flex-1" />
        <button
          onClick={onToggleDark}
          aria-label="تغییر حالت تاریک/روشن"
          className="rounded-full p-1.5 text-ink-soft hover:bg-ink/5 dark:text-ink-dim dark:hover:bg-white/5"
        >
          {darkMode ? <Sun size={17} /> : <Moon size={17} />}
        </button>
        <button
          onClick={onOpenSettings}
          aria-label="تنظیمات"
          className="rounded-full p-1.5 text-ink-soft hover:bg-ink/5 dark:text-ink-dim dark:hover:bg-white/5"
        >
          <Settings size={17} />
        </button>
      </div>

      <div className="px-5 pb-3">
        <div className="flex items-center gap-2 rounded-xl border border-ink/10 bg-paper px-3 py-2 dark:bg-paper-dark dark:border-ink-light/10">
          <Search size={15} className="text-ink-dim shrink-0" />
          <input
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder="جست‌وجو در نوت‌ها…"
            className="w-full bg-transparent text-sm text-ink outline-none placeholder:text-ink-dim dark:text-ink-light"
          />
        </div>
      </div>

      <div className="px-5 pb-3">
        <button
          onClick={onCreate}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-pine px-4 py-2.5 text-sm font-semibold text-paper transition-colors hover:bg-pine-dark"
        >
          <Plus size={16} />
          نوت جدید
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto px-2 pb-6">
        {notes.length === 0 && (
          <p className="px-3 py-8 text-center text-sm text-ink-dim">
            هنوز نوتی نیست. یکی بساز و شروع کن.
          </p>
        )}
        <ul className="space-y-1">
          {notes.map((note) => {
            const active = note.id === selectedId
            const preview = (note.content || '').replace(/[#*_`>-]/g, '').trim().slice(0, 60)
            return (
              <li key={note.id}>
                <button
                  onClick={() => onSelect(note.id)}
                  className={`group flex w-full items-start gap-3 rounded-lg px-3 py-2.5 text-start transition-colors ${
                    active
                      ? 'bg-paper dark:bg-paper-dark'
                      : 'hover:bg-ink/5 dark:hover:bg-white/5'
                  }`}
                >
                  <span
                    className={`mt-1 h-8 w-[3px] shrink-0 rounded-full ${
                      active ? 'bg-seal' : 'bg-transparent group-hover:bg-ink/10'
                    }`}
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold text-ink dark:text-ink-light">
                      {note.title || 'نوت بدون عنوان'}
                    </span>
                    <span className="block truncate text-xs text-ink-dim">
                      {preview || 'بدون محتوا'}
                    </span>
                  </span>
                </button>
              </li>
            )
          })}
        </ul>
      </nav>
    </aside>
  )
}
