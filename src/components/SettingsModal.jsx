import { useState } from 'react'
import { X } from 'lucide-react'
import { PROVIDER_PRESETS } from '../lib/ai.js'

export default function SettingsModal({ settings, onSave, onClose }) {
  const [form, setForm] = useState(settings)

  function update(patch) {
    setForm((f) => ({ ...f, ...patch }))
  }

  function handleProviderChange(provider) {
    const preset = PROVIDER_PRESETS[provider]
    update({
      provider,
      baseUrl: preset.baseUrl,
      model: preset.defaultModel || form.model
    })
  }

  function handleSubmit(e) {
    e.preventDefault()
    onSave(form)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 px-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-ink/10 bg-paper p-6 shadow-2xl dark:border-ink-light/10 dark:bg-paper-darksoft">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-lg font-extrabold text-ink dark:text-ink-light">تنظیمات هوش مصنوعی</h2>
          <button
            onClick={onClose}
            className="rounded-full p-1 text-ink-dim hover:bg-ink/5 dark:hover:bg-white/5"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-ink-soft dark:text-ink-dim">
              سرویس
            </label>
            <div className="grid grid-cols-1 gap-2">
              {Object.entries(PROVIDER_PRESETS).map(([key, preset]) => (
                <button
                  type="button"
                  key={key}
                  onClick={() => handleProviderChange(key)}
                  className={`rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                    form.provider === key
                      ? 'border-pine bg-pine/10 text-pine dark:text-pine-light'
                      : 'border-ink/10 text-ink-soft hover:bg-ink/5 dark:border-ink-light/10 dark:text-ink-dim dark:hover:bg-white/5'
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold text-ink-soft dark:text-ink-dim">
              آدرس پایه API {form.provider === 'custom' && '(الزامی — هر endpoint سازگار با OpenAI)'}
            </label>
            <input
              value={form.baseUrl}
              onChange={(e) => update({ baseUrl: e.target.value })}
              placeholder="https://openrouter.ai/api/v1"
              className="w-full rounded-lg border border-ink/10 bg-paper px-3 py-2 text-sm text-ink outline-none focus:border-pine dark:border-ink-light/10 dark:bg-paper-dark dark:text-ink-light"
              dir="ltr"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold text-ink-soft dark:text-ink-dim">
              کلید API
            </label>
            <input
              type="password"
              value={form.apiKey}
              onChange={(e) => update({ apiKey: e.target.value })}
              placeholder="sk-…"
              className="w-full rounded-lg border border-ink/10 bg-paper px-3 py-2 text-sm text-ink outline-none focus:border-pine dark:border-ink-light/10 dark:bg-paper-dark dark:text-ink-light"
              dir="ltr"
            />
            <p className="mt-1 text-[11px] text-ink-dim">
              فقط در مرورگر خودت (localStorage) ذخیره می‌شود و به هیچ سروری جز سرویس انتخابی ارسال نمی‌شود.
            </p>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold text-ink-soft dark:text-ink-dim">
              مدل
            </label>
            <input
              value={form.model}
              onChange={(e) => update({ model: e.target.value })}
              placeholder="google/gemini-2.5-flash"
              className="w-full rounded-lg border border-ink/10 bg-paper px-3 py-2 text-sm text-ink outline-none focus:border-pine dark:border-ink-light/10 dark:bg-paper-dark dark:text-ink-light"
              dir="ltr"
            />
            <p className="mt-1 text-[11px] text-ink-dim">
              با انتخاب هر سرویس، یک مدل پیش‌فرض خودش پر می‌شود؛ می‌توانی عوضش کنی. مثلاً «OpenCode Zen» با مدل mimo-v2.5-free کاملاً رایگان است.
            </p>
          </div>

          <div className="border-t border-ink/10 pt-4 dark:border-ink-light/10">
            <h3 className="mb-3 text-sm font-bold text-ink dark:text-ink-light">
              اتصال به فضای ابری (اختیاری)
            </h3>

            <label className="mb-1.5 block text-xs font-semibold text-ink-soft dark:text-ink-dim">
              Google Client ID
            </label>
            <input
              value={form.googleClientId}
              onChange={(e) => update({ googleClientId: e.target.value })}
              placeholder="xxxxxxxx.apps.googleusercontent.com"
              className="mb-1 w-full rounded-lg border border-ink/10 bg-paper px-3 py-2 text-sm text-ink outline-none focus:border-pine dark:border-ink-light/10 dark:bg-paper-dark dark:text-ink-light"
              dir="ltr"
            />
            <p className="mb-3 text-[11px] text-ink-dim">
              از Google Cloud Console یک OAuth Client از نوع Web بساز، Drive API را فعال کن و آدرس همین سایت را به Authorized JavaScript origins اضافه کن.
            </p>

            <label className="mb-1.5 block text-xs font-semibold text-ink-soft dark:text-ink-dim">
              Dropbox App Key
            </label>
            <input
              value={form.dropboxAppKey}
              onChange={(e) => update({ dropboxAppKey: e.target.value })}
              placeholder="xxxxxxxxxxxxxxx"
              className="mb-1 w-full rounded-lg border border-ink/10 bg-paper px-3 py-2 text-sm text-ink outline-none focus:border-pine dark:border-ink-light/10 dark:bg-paper-dark dark:text-ink-light"
              dir="ltr"
            />
            <p className="text-[11px] text-ink-dim">
              از Dropbox App Console یک اپ بساز و آدرس همین سایت را به Redirect URIs اضافه کن.
            </p>
          </div>

          <button
            type="submit"
            className="w-full rounded-lg bg-pine py-2.5 text-sm font-semibold text-paper hover:bg-pine-dark"
          >
            ذخیره تنظیمات
          </button>
        </form>
      </div>
    </div>
  )
}
