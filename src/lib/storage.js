const NOTES_KEY = 'notes-app:notes'
const SETTINGS_KEY = 'notes-app:settings'

export function loadNotes() {
  try {
    const raw = localStorage.getItem(NOTES_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function saveNotes(notes) {
  try {
    localStorage.setItem(NOTES_KEY, JSON.stringify(notes))
    return true
  } catch (err) {
    console.error('ذخیره‌سازی نوت‌ها با خطا مواجه شد', err)
    return false
  }
}

export const DEFAULT_SETTINGS = {
  provider: 'openrouter', // 'openrouter' | 'openai' | 'anthropic' | 'custom'
  baseUrl: 'https://openrouter.ai/api/v1',
  apiKey: '',
  model: 'google/gemini-2.5-flash',
  googleClientId: '',
  dropboxAppKey: ''
}

export function loadSettings() {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY)
    if (!raw) return { ...DEFAULT_SETTINGS }
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) }
  } catch {
    return { ...DEFAULT_SETTINGS }
  }
}

export function saveSettings(settings) {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings))
    return true
  } catch (err) {
    console.error('ذخیره‌سازی تنظیمات با خطا مواجه شد', err)
    return false
  }
}

export function newNote() {
  const now = Date.now()
  return {
    id: crypto.randomUUID(),
    title: 'نوت بدون عنوان',
    content: '',
    attachments: [],
    createdAt: now,
    updatedAt: now
  }
}
