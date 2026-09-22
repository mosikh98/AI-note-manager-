import { useEffect, useMemo, useState } from 'react'
import { NotebookPen } from 'lucide-react'
import Sidebar from './components/Sidebar.jsx'
import NoteEditor from './components/NoteEditor.jsx'
import SettingsModal from './components/SettingsModal.jsx'
import { loadNotes, saveNotes, loadSettings, saveSettings, newNote } from './lib/storage.js'
import { captureDropboxTokenFromUrl } from './lib/cloud.js'

export default function App() {
  const [notes, setNotes] = useState(() => loadNotes())
  const [selectedId, setSelectedId] = useState(() => loadNotes()[0]?.id ?? null)
  const [query, setQuery] = useState('')
  const [settings, setSettings] = useState(() => loadSettings())
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [darkMode, setDarkMode] = useState(
    () => window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false
  )

  useEffect(() => {
    captureDropboxTokenFromUrl()
  }, [])

  useEffect(() => {
    saveNotes(notes)
  }, [notes])

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode)
  }, [darkMode])

  const filteredNotes = useMemo(() => {
    const sorted = [...notes].sort((a, b) => b.updatedAt - a.updatedAt)
    if (!query.trim()) return sorted
    const q = query.trim().toLowerCase()
    return sorted.filter(
      (n) => n.title.toLowerCase().includes(q) || n.content.toLowerCase().includes(q)
    )
  }, [notes, query])

  const selectedNote = notes.find((n) => n.id === selectedId) || null

  function handleCreate() {
    const note = newNote()
    setNotes((prev) => [note, ...prev])
    setSelectedId(note.id)
    setQuery('')
  }

  function handleChangeNote(updated) {
    setNotes((prev) =>
      prev.map((n) => (n.id === updated.id ? { ...updated, updatedAt: Date.now() } : n))
    )
  }

  function handleDeleteNote(id) {
    if (!confirm('این نوت برای همیشه حذف شود؟')) return
    setNotes((prev) => prev.filter((n) => n.id !== id))
    if (selectedId === id) setSelectedId(null)
  }

  function handleSaveSettings(newSettings) {
    setSettings(newSettings)
    saveSettings(newSettings)
    setSettingsOpen(false)
  }

  return (
    <div className="flex h-screen w-full overflow-hidden bg-paper text-ink dark:bg-paper-dark dark:text-ink-light">
      <Sidebar
        notes={filteredNotes}
        selectedId={selectedId}
        onSelect={setSelectedId}
        onCreate={handleCreate}
        query={query}
        onQueryChange={setQuery}
        onOpenSettings={() => setSettingsOpen(true)}
        darkMode={darkMode}
        onToggleDark={() => setDarkMode((v) => !v)}
      />

      {selectedNote ? (
        <NoteEditor
          key={selectedNote.id}
          note={selectedNote}
          settings={settings}
          onChange={handleChangeNote}
          onDelete={handleDeleteNote}
          onOpenSettings={() => setSettingsOpen(true)}
        />
      ) : (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 text-ink-dim">
          <NotebookPen size={40} strokeWidth={1.3} />
          <p className="text-sm">نوتی انتخاب نشده — یکی از فهرست کنار انتخاب کن یا یک نوت جدید بساز.</p>
        </div>
      )}

      {settingsOpen && (
        <SettingsModal
          settings={settings}
          onSave={handleSaveSettings}
          onClose={() => setSettingsOpen(false)}
        />
      )}
    </div>
  )
}
