import { marked } from 'marked'
import DOMPurify from 'dompurify'
import { jsPDF } from 'jspdf'
import { Document, Packer, Paragraph, HeadingLevel } from 'docx'
import { saveAs } from 'file-saver'

function safeFileName(title) {
  return (title || 'نوت').replace(/[\\/:*?"<>|]/g, '').trim().slice(0, 80) || 'نوت'
}

function stripMarkdown(md) {
  return md
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/\*(.*?)\*/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/^>\s?/gm, '')
    .replace(/^[-*+]\s+/gm, '• ')
    .replace(/\[(.*?)\]\((.*?)\)/g, '$1 ($2)')
}

export function buildMarkdownString(note) {
  return `# ${note.title}\n\n${note.content}\n`
}

export function exportMarkdown(note) {
  const blob = new Blob([buildMarkdownString(note)], { type: 'text/markdown;charset=utf-8' })
  saveAs(blob, `${safeFileName(note.title)}.md`)
}

export function exportText(note) {
  const body = `${note.title}\n${'='.repeat(note.title.length)}\n\n${stripMarkdown(note.content)}\n`
  const blob = new Blob([body], { type: 'text/plain;charset=utf-8' })
  saveAs(blob, `${safeFileName(note.title)}.txt`)
}

export function exportHtml(note) {
  const bodyHtml = DOMPurify.sanitize(marked.parse(note.content || ''))
  const doc = `<!doctype html>
<html lang="fa" dir="rtl">
<head>
<meta charset="utf-8" />
<title>${note.title}</title>
<style>
  body { font-family: 'Vazirmatn', Tahoma, sans-serif; max-width: 720px; margin: 3rem auto; padding: 0 1.5rem; line-height: 1.9; color: #1E231F; background: #FBF7EF; }
  h1 { font-size: 1.9rem; margin-bottom: 1.5rem; }
  h2, h3 { margin-top: 1.6rem; }
  blockquote { border-inline-start: 3px solid #2E6F62; padding-inline-start: 1rem; color: #4A524C; }
  code { background: #EDEAE2; padding: 0.1em 0.4em; border-radius: 4px; }
  pre { background: #1E231F; color: #FBF7EF; padding: 1rem; border-radius: 10px; overflow-x: auto; }
</style>
</head>
<body>
<h1>${note.title}</h1>
${bodyHtml}
</body>
</html>`
  const blob = new Blob([doc], { type: 'text/html;charset=utf-8' })
  saveAs(blob, `${safeFileName(note.title)}.html`)
}

export function exportPdf(note) {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' })
  const marginX = 48
  let y = 64
  const pageWidth = doc.internal.pageSize.getWidth()
  const maxWidth = pageWidth - marginX * 2

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(18)
  const titleLines = doc.splitTextToSize(note.title || 'نوت', maxWidth)
  doc.text(titleLines, marginX, y)
  y += titleLines.length * 22 + 12

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(11)
  const plain = stripMarkdown(note.content || '')
  const paragraphs = plain.split(/\n{2,}/)

  paragraphs.forEach((para) => {
    const lines = doc.splitTextToSize(para, maxWidth)
    lines.forEach((line) => {
      if (y > doc.internal.pageSize.getHeight() - 56) {
        doc.addPage()
        y = 56
      }
      doc.text(line, marginX, y)
      y += 16
    })
    y += 8
  })

  doc.save(`${safeFileName(note.title)}.pdf`)
}

export async function exportDocx(note) {
  const plain = stripMarkdown(note.content || '')
  const paragraphs = plain
    .split(/\n+/)
    .filter((line) => line.trim().length > 0)
    .map((line) => new Paragraph({ text: line }))

  const doc = new Document({
    sections: [
      {
        children: [
          new Paragraph({ text: note.title || 'نوت', heading: HeadingLevel.HEADING_1 }),
          ...paragraphs
        ]
      }
    ]
  })

  const blob = await Packer.toBlob(doc)
  saveAs(blob, `${safeFileName(note.title)}.docx`)
}

export const EXPORT_FORMATS = [
  { id: 'md', label: 'Markdown (.md)', run: exportMarkdown },
  { id: 'txt', label: 'متن ساده (.txt)', run: exportText },
  { id: 'html', label: 'صفحه وب (.html)', run: exportHtml },
  { id: 'pdf', label: 'PDF', run: exportPdf },
  { id: 'docx', label: 'Word (.docx)', run: exportDocx }
]
