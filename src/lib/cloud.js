import { dataUrlToBlob } from './attachments.js'

const APP_FOLDER_NAME = 'دفترچه'

/* ------------------------- Google Drive ------------------------- */

const GOOGLE_SCOPE = 'https://www.googleapis.com/auth/drive.file'
let googleTokenClient = null
let googleTokenClientId = null

function waitForGoogleScript() {
  return new Promise((resolve, reject) => {
    if (window.google?.accounts?.oauth2) return resolve()
    const interval = setInterval(() => {
      if (window.google?.accounts?.oauth2) {
        clearInterval(interval)
        resolve()
      }
    }, 150)
    setTimeout(() => {
      clearInterval(interval)
      if (!window.google?.accounts?.oauth2) {
        reject(new Error('اسکریپت Google بارگذاری نشد — اتصال اینترنت و اینکه سایت بلاک نشده را بررسی کن.'))
      }
    }, 8000)
  })
}

export async function getGoogleAccessToken(clientId) {
  if (!clientId) throw new Error('اول Client ID گوگل را در تنظیمات وارد کن.')
  await waitForGoogleScript()
  return new Promise((resolve, reject) => {
    if (!googleTokenClient || googleTokenClientId !== clientId) {
      googleTokenClient = window.google.accounts.oauth2.initTokenClient({
        client_id: clientId,
        scope: GOOGLE_SCOPE,
        callback: () => {}
      })
      googleTokenClientId = clientId
    }
    googleTokenClient.callback = (resp) => {
      if (resp.error) reject(new Error('ورود به گوگل لغو شد یا با خطا مواجه شد.'))
      else resolve(resp.access_token)
    }
    googleTokenClient.requestAccessToken({ prompt: '' })
  })
}

async function findOrCreateDriveFolder(accessToken) {
  const q = encodeURIComponent(
    `name='${APP_FOLDER_NAME}' and mimeType='application/vnd.google-apps.folder' and trashed=false`
  )
  const res = await fetch(`https://www.googleapis.com/drive/v3/files?q=${q}&fields=files(id,name)`, {
    headers: { Authorization: `Bearer ${accessToken}` }
  })
  const data = await res.json()
  if (data.files?.length) return data.files[0].id

  const createRes = await fetch('https://www.googleapis.com/drive/v3/files', {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: APP_FOLDER_NAME, mimeType: 'application/vnd.google-apps.folder' })
  })
  if (!createRes.ok) throw new Error('ساخت پوشه در گوگل‌درایو ناموفق بود.')
  const created = await createRes.json()
  return created.id
}

async function uploadFileToDrive({ accessToken, folderId, filename, blob }) {
  const metadata = { name: filename, parents: folderId ? [folderId] : undefined }
  const form = new FormData()
  form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }))
  form.append('file', blob)
  const res = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}` },
    body: form
  })
  if (!res.ok) throw new Error(`آپلود به گوگل‌درایو ناموفق بود (${res.status})`)
  return res.json()
}

export async function uploadNoteToGoogleDrive({ clientId, note, markdownContent }) {
  const accessToken = await getGoogleAccessToken(clientId)
  const folderId = await findOrCreateDriveFolder(accessToken)
  const mdBlob = new Blob([markdownContent], { type: 'text/markdown' })
  await uploadFileToDrive({ accessToken, folderId, filename: `${note.title}.md`, blob: mdBlob })
  for (const att of note.attachments) {
    await uploadFileToDrive({ accessToken, folderId, filename: att.name, blob: dataUrlToBlob(att.dataUrl) })
  }
}

/* --------------------------- Dropbox ----------------------------- */

const DROPBOX_TOKEN_KEY = 'notes-app:dropboxToken'

function dropboxRedirectUri() {
  return window.location.origin + window.location.pathname
}

export function getDropboxAuthUrl(appKey) {
  const redirectUri = dropboxRedirectUri()
  return `https://www.dropbox.com/oauth2/authorize?client_id=${encodeURIComponent(
    appKey
  )}&response_type=token&redirect_uri=${encodeURIComponent(redirectUri)}`
}

// در بارگذاری اولیه‌ی اپ صدا زده می‌شود تا توکن برگشتی از صفحه‌ی ورود دراپ‌باکس را بگیرد
export function captureDropboxTokenFromUrl() {
  if (!window.location.hash) return
  const params = new URLSearchParams(window.location.hash.slice(1))
  const token = params.get('access_token')
  if (token) {
    sessionStorage.setItem(DROPBOX_TOKEN_KEY, token)
    window.history.replaceState(null, '', window.location.pathname + window.location.search)
  }
}

export function getStoredDropboxToken() {
  return sessionStorage.getItem(DROPBOX_TOKEN_KEY)
}

export function startDropboxLogin(appKey) {
  if (!appKey) throw new Error('اول App Key دراپ‌باکس را در تنظیمات وارد کن.')
  window.location.href = getDropboxAuthUrl(appKey)
}

async function uploadFileToDropbox({ accessToken, path, blob }) {
  const res = await fetch('https://content.dropboxapi.com/2/files/upload', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Dropbox-API-Arg': JSON.stringify({ path, mode: 'overwrite', mute: true }),
      'Content-Type': 'application/octet-stream'
    },
    body: blob
  })
  if (!res.ok) {
    if (res.status === 401) {
      sessionStorage.removeItem(DROPBOX_TOKEN_KEY)
      throw new Error('نشست دراپ‌باکس منقضی شده — دوباره وصل شو.')
    }
    throw new Error(`آپلود به دراپ‌باکس ناموفق بود (${res.status})`)
  }
  return res.json()
}

export async function uploadNoteToDropbox({ note, markdownContent }) {
  const accessToken = getStoredDropboxToken()
  if (!accessToken) throw new Error('اول به دراپ‌باکس وصل شو.')
  const safeTitle = note.title.replace(/[\\/:*?"<>|]/g, '').trim() || 'نوت'
  const folder = `/${APP_FOLDER_NAME}/${safeTitle}`
  await uploadFileToDropbox({
    accessToken,
    path: `${folder}/${safeTitle}.md`,
    blob: new Blob([markdownContent], { type: 'text/markdown' })
  })
  for (const att of note.attachments) {
    await uploadFileToDropbox({
      accessToken,
      path: `${folder}/${att.name}`,
      blob: dataUrlToBlob(att.dataUrl)
    })
  }
}
