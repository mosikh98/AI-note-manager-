import { X, FileText, Download } from 'lucide-react'
import { formatBytes } from '../lib/attachments'

export default function AttachmentChip({ attachment, onRemove }) {
  const isImage = attachment.type.startsWith('image/')

  return (
    <div className="group relative flex items-center gap-2 rounded-xl border border-ink/10 bg-paper px-2.5 py-2 dark:border-ink-light/10 dark:bg-paper-dark">
      {isImage ? (
        <img
          src={attachment.dataUrl}
          alt={attachment.name}
          className="h-10 w-10 shrink-0 rounded-lg object-cover"
        />
      ) : (
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-pine/10 text-pine dark:text-pine-light">
          <FileText size={18} />
        </div>
      )}
      <div className="min-w-0 pe-5">
        <p className="max-w-[9rem] truncate text-xs font-medium text-ink dark:text-ink-light">
          {attachment.name}
        </p>
        <p className="text-[11px] text-ink-dim">{formatBytes(attachment.size)}</p>
      </div>
      <a
        href={attachment.dataUrl}
        download={attachment.name}
        className="rounded-full p-1 text-ink-dim hover:bg-ink/5 dark:hover:bg-white/5"
        title="دانلود"
      >
        <Download size={13} />
      </a>
      <button
        onClick={() => onRemove(attachment.id)}
        className="absolute -top-1.5 -end-1.5 hidden rounded-full bg-ink p-0.5 text-paper group-hover:flex dark:bg-ink-light dark:text-ink"
        title="حذف پیوست"
      >
        <X size={11} />
      </button>
    </div>
  )
}
