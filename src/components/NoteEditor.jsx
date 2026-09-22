import { useMemo, useRef, useState } from 'react'
import { marked } from 'marked'
import DOMPurify from 'dompurify'
import {
  Sparkles,
  Paperclip,
  Download,
  Eye,
  Pencil,
  Trash2,
  Undo2,
  Loader2,
  ChevronDown,
  CloudUpload,
  Check
} from 'lucide-react'
import AttachmentChip from './AttachmentChip.jsx'
import { EXPORT_FORMATS, buildMarkdownString } from '../lib/exporters.js'
import { fileToAttachment } from '../lib/attachments.js'
import { organizeText } from '../lib/ai.js'
import {
  uploadNoteToGoogleDrive,
  uploadNoteToDropbox,
  startDropboxLogin,
  getStoredDropboxToken
} from '../lib/cloud.js'

export default function NoteEditor({ note, settings, onChange, onDelete, onOpenSettings }) {
  const [mode, setMode] = useState('edit') // 'edit' | 'preview'
  const [organizing, setOrganizing] = useState(false)
  const [aiError, setAiError] = useState('')
  const [lastSnapshot, setLastSnapshot] = useState(null)
  const [exportOpen, setExportOpen] = useState(false)
  const [cloudOpen, setCloudOpen] = useState(false)
  const [cloudBusy, setCloudBusy] = useState(false)
  const [cloudMessage, setCloudMessage] = useState('')
  const fileInputRef = useRef(null)

  const renderedHtml = useMemo(
    () => DOMPurify.sanitize(marked.parse(note.content || '*این نوت هنوز خالی است.*')),
    [note.content]
  )

  async function handleOrganize() {
    setAiError('')
    if (!settings.apiKey) {
      setAiError('اول کلید API را در تنظیمات وارد کن.')
      onOpenSettings()
      return
    }
    setOrganizing(true)
    try {
      const result = await organizeText(note.content, settings)
      setLastSnapshot({ title: note.title, content: note.content })
      onChange({
        ...note,
        title: result.title || note.title,
        content: result.content
      })
      setMode('preview')
    } catch (err) {
      setAiError(err.message || 'مرتب‌سازی با خطا مواجه شد.')
    } finally {
      setOrganizing(false)
    }
  }

  function handleUndoAi() {
    if (!lastSnapshot) return
    onChange({ ...note, title: lastSnapshot.title, content: lastSnapshot.content })
    setLastSnapshot(null)
  }

  async function handleFiles(fileList) {
    const files = Array.from(fileList || [])
    if (files.length === 0) return
    try {
      const newAttachments = await Promise.all(files.map(fileToAttachment))
      onChange({ ...note, attachments: [...note.attachments, ...newAttachments] })
    } catch (err) {
      setAiError(err.message || 'افزودن پیوست با خطا مواجه شد.')
    }
  }

  function handleRemoveAttachment(id) {
    onChange({ ...note, attachments: note.attachments.filter((a) => a.id !== id) })
  }

  async function handleUploadToGoogle() {
    setCloudOpen(false)
    setAiError('')
    setCloudMessage('')
    if (!settings.googleClientId) {
      setAiError('اول Client ID گوگل را در تنظیمات وارد کن.')
      onOpenSettings()
      return
    }
    setCloudBusy(true)
    try {
      await uploadNoteToGoogleDrive({
        clientId: settings.googleClientId,
        note,
        markdownContent: buildMarkdownString(note)
      })
      setCloudMessage(`«${note.title}» در پوشه‌ی «دفترچه» روی گوگل‌درایو ذخیره شد.`)
    } catch (err) {
      setAiError(err.message || 'آپلود به گوگل‌درایو ناموفق بود.')
    } finally {
      setCloudBusy(false)
    }
  }

  async function handleUploadToDropbox() {
    setCloudOpen(false)
    setAiError('')
    setCloudMessage('')
    if (!settings.dropboxAppKey) {
      setAiError('اول App Key دراپ‌باکس را در تنظیمات وارد کن.')
      onOpenSettings()
      return
    }
    if (!getStoredDropboxToken()) {
      startDropboxLogin(settings.dropboxAppKey)
      return
    }
    setCloudBusy(true)
    try {
      await uploadNoteToDropbox({ note, markdownContent: buildMarkdownString(note) })
      setCloudMessage(`«${note.title}» در پوشه‌ی «دفترچه» روی دراپ‌باکس ذخیره شد.`)
    } catch (err) {
      setAiError(err.message || 'آپلود به دراپ‌باکس ناموفق بود.')
    } finally {
      setCloudBusy(false)
    }
  }

  return (
    <div className="flex h-full flex-1 flex-col overflow-hidden bg-paper dark:bg-paper-dark">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2 border-b border-ink/10 px-6 py-3 dark:border-ink-light/10">
        <button
          onClick={handleOrganize}
          disabled={organizing || !note.content.trim()}
          className="flex items-center gap-1.5 rounded-lg bg-seal/15 px-3 py-1.5 text-sm font-semibold text-seal transition-colors hover:bg-seal/25 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {organizing ? <Loader2 size={15} className="animate-spin" /> : <Sparkles size={15} />}
          مرتب‌سازی با هوش مصنوعی
        </button>

        {lastSnapshot && (
          <button
            onClick={handleUndoAi}
            className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-ink-soft hover:bg-ink/5 dark:text-ink-dim dark:hover:bg-white/5"
          >
            <Undo2 size={13} />
            بازگردانی نسخه قبل
          </button>
        )}

        <div className="mx-1 h-5 w-px bg-ink/10 dark:bg-ink-light/10" />

        <button
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm text-ink-soft hover:bg-ink/5 dark:text-ink-dim dark:hover:bg-white/5"
        >
          <Paperclip size={15} />
          پیوست
        </button>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          onChange={(e) => {
            handleFiles(e.target.files)
            e.target.value = ''
          }}
        />

        <button
          onClick={() => setMode(mode === 'edit' ? 'preview' : 'edit')}
          className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm text-ink-soft hover:bg-ink/5 dark:text-ink-dim dark:hover:bg-white/5"
        >
          {mode === 'edit' ? <Eye size={15} /> : <Pencil size={15} />}
          {mode === 'edit' ? 'پیش‌نمایش' : 'ویرایش'}
        </button>

        <div className="relative">
          <button
            onClick={() => setExportOpen((v) => !v)}
            className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm text-ink-soft hover:bg-ink/5 dark:text-ink-dim dark:hover:bg-white/5"
          >
            <Download size={15} />
            خروجی
            <ChevronDown size={13} />
          </button>
          {exportOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setExportOpen(false)} />
              <div className="absolute start-0 top-full z-20 mt-1 w-48 overflow-hidden rounded-xl border border-ink/10 bg-paper shadow-lg dark:border-ink-light/10 dark:bg-paper-darksoft">
                {EXPORT_FORMATS.map((fmt) => (
                  <button
                    key={fmt.id}
                    onClick={() => {
                      fmt.run(note)
                      setExportOpen(false)
                    }}
                    className="block w-full px-4 py-2.5 text-start text-sm text-ink hover:bg-ink/5 dark:text-ink-light dark:hover:bg-white/5"
                  >
                    {fmt.label}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        <div className="relative">
          <button
            onClick={() => setCloudOpen((v) => !v)}
            disabled={cloudBusy}
            className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm text-ink-soft hover:bg-ink/5 disabled:opacity-50 dark:text-ink-dim dark:hover:bg-white/5"
          >
            {cloudBusy ? <Loader2 size={15} className="animate-spin" /> : <CloudUpload size={15} />}
            آپلود در ابر
            <ChevronDown size={13} />
          </button>
          {cloudOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setCloudOpen(false)} />
              <div className="absolute start-0 top-full z-20 mt-1 w-52 overflow-hidden rounded-xl border border-ink/10 bg-paper shadow-lg dark:border-ink-light/10 dark:bg-paper-darksoft">
                <button
                  onClick={handleUploadToGoogle}
                  className="block w-full px-4 py-2.5 text-start text-sm text-ink hover:bg-ink/5 dark:text-ink-light dark:hover:bg-white/5"
                >
                  گوگل‌درایو
                </button>
                <button
                  onClick={handleUploadToDropbox}
                  className="block w-full px-4 py-2.5 text-start text-sm text-ink hover:bg-ink/5 dark:text-ink-light dark:hover:bg-white/5"
                >
                  دراپ‌باکس {!getStoredDropboxToken() && '(ورود لازم است)'}
                </button>
              </div>
            </>
          )}
        </div>

        <div className="flex-1" />

        <button
          onClick={() => onDelete(note.id)}
          className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm text-ink-dim hover:bg-red-500/10 hover:text-red-600"
        >
          <Trash2 size={15} />
          حذف نوت
        </button>
      </div>

      {aiError && (
        <div className="mx-6 mt-3 rounded-lg bg-red-500/10 px-4 py-2 text-sm text-red-600">
          {aiError}
        </div>
      )}
      {cloudMessage && (
        <div className="mx-6 mt-3 flex items-center gap-2 rounded-lg bg-pine/10 px-4 py-2 text-sm text-pine dark:text-pine-light">
          <Check size={14} />
          {cloudMessage}
        </div>
      )}

      {/* Title */}
      <div className="px-6 pt-5">
        <input
          value={note.title}
          onChange={(e) => onChange({ ...note, title: e.target.value })}
          placeholder="عنوان نوت"
          className="w-full bg-transparent text-2xl font-extrabold text-ink outline-none placeholder:text-ink-dim/60 dark:text-ink-light"
        />
        <p className="mt-1 text-xs text-ink-dim">
          آخرین ویرایش: {new Date(note.updatedAt).toLocaleString('fa-IR')}
        </p>
      </div>

      {/* Attachments */}
      {note.attachments.length > 0 && (
        <div className="flex flex-wrap gap-2 px-6 pt-4">
          {note.attachments.map((a) => (
            <AttachmentChip key={a.id} attachment={a} onRemove={handleRemoveAttachment} />
          ))}
        </div>
      )}

      {/* Content */}
      <div
        className="flex-1 overflow-y-auto px-6 pb-8 pt-4"
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault()
          handleFiles(e.dataTransfer.files)
        }}
      >
        {mode === 'edit' ? (
          <textarea
            value={note.content}
            onChange={(e) => onChange({ ...note, content: e.target.value })}
            placeholder="متن نوت را اینجا بنویس یا بچسبان — حتی اگر به‌هم‌ریخته باشد، دکمه «مرتب‌سازی با هوش مصنوعی» مرتبش می‌کند."
            className="h-full w-full resize-none bg-transparent text-[15px] leading-8 text-ink outline-none placeholder:text-ink-dim/70 dark:text-ink-light"
          />
        ) : (
          <div
            className="note-prose max-w-none"
            dangerouslySetInnerHTML={{ __html: renderedHtml }}
          />
        )}
      </div>
    </div>
  )
}
