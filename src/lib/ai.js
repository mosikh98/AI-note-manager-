// انتزاع سرویس هوش مصنوعی: از سه شکل رایج API پشتیبانی می‌کند
// - openrouter / openai / custom  → فرمت سازگار با OpenAI (chat/completions)
// - anthropic                     → فرمت پیام‌های Anthropic

export const PROVIDER_PRESETS = {
  openrouter: {
    label: 'OpenRouter',
    baseUrl: 'https://openrouter.ai/api/v1',
    kind: 'openai-compatible',
    defaultModel: 'google/gemini-2.5-flash'
  },
  opencode: {
    label: 'OpenCode Zen (رایگان)',
    baseUrl: 'https://opencode.ai/zen/v1',
    kind: 'openai-compatible',
    defaultModel: 'mimo-v2.5-free'
  },
  openai: {
    label: 'OpenAI',
    baseUrl: 'https://api.openai.com/v1',
    kind: 'openai-compatible',
    defaultModel: 'gpt-4o-mini'
  },
  anthropic: {
    label: 'Anthropic',
    baseUrl: 'https://api.anthropic.com/v1',
    kind: 'anthropic',
    defaultModel: 'claude-3-5-haiku-latest'
  },
  custom: {
    label: 'کاستوم (URL و کلید دلخواه)',
    baseUrl: '',
    kind: 'openai-compatible',
    defaultModel: ''
  }
}

const SYSTEM_PROMPT = `تو یک دستیار مرتب‌سازی یادداشت هستی. متن خام و به‌هم‌ریخته‌ای که کاربر می‌دهد را بدون حذف یا اضافه‌کردن اطلاعات، به یک یادداشت تمیز و ساخت‌یافته با فرمت Markdown تبدیل کن:
- یک عنوان کوتاه و دقیق برای یادداشت پیشنهاد بده.
- محتوا را به بخش‌های منطقی با عنوان‌های ##  تقسیم کن (فقط در صورتی که محتوا واقعاً چند بخش دارد).
- از فهرست‌های نقطه‌ای یا شماره‌دار برای موارد فهرست‌مانند استفاده کن.
- نکات مهم را در صورت لزوم Bold کن.
- هیچ اطلاعات جدیدی اختراع نکن؛ فقط همان محتوا را مرتب کن.
- زبان خروجی همان زبان متن ورودی باشد.

فقط و فقط یک JSON خام با همین شکل برگردان، بدون هیچ توضیح یا Markdown fence اضافه:
{"title": "...", "content": "..."}`

function extractJson(text) {
  const cleaned = text.trim().replace(/^```json/i, '').replace(/^```/, '').replace(/```$/, '').trim()
  const start = cleaned.indexOf('{')
  const end = cleaned.lastIndexOf('}')
  const jsonSlice = start !== -1 && end !== -1 ? cleaned.slice(start, end + 1) : cleaned
  return JSON.parse(jsonSlice)
}

async function callOpenAiCompatible({ baseUrl, apiKey, model, rawText }) {
  const res = await fetch(`${baseUrl.replace(/\/$/, '')}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: rawText }
      ],
      temperature: 0.3
    })
  })
  if (!res.ok) {
    const errText = await res.text().catch(() => '')
    throw new Error(`خطای سرویس (${res.status}): ${errText.slice(0, 300) || res.statusText}`)
  }
  const data = await res.json()
  const text = data?.choices?.[0]?.message?.content
  if (!text) throw new Error('پاسخ خالی از سرویس دریافت شد.')
  return extractJson(text)
}

async function callAnthropic({ baseUrl, apiKey, model, rawText }) {
  const res = await fetch(`${baseUrl.replace(/\/$/, '')}/messages`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true'
    },
    body: JSON.stringify({
      model,
      max_tokens: 4096,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: rawText }]
    })
  })
  if (!res.ok) {
    const errText = await res.text().catch(() => '')
    throw new Error(`خطای سرویس (${res.status}): ${errText.slice(0, 300) || res.statusText}`)
  }
  const data = await res.json()
  const text = data?.content?.find((b) => b.type === 'text')?.text
  if (!text) throw new Error('پاسخ خالی از سرویس دریافت شد.')
  return extractJson(text)
}

export async function organizeText(rawText, settings) {
  if (!rawText || !rawText.trim()) {
    throw new Error('متنی برای مرتب‌سازی وجود ندارد.')
  }
  if (!settings.apiKey) {
    throw new Error('ابتدا کلید API را در تنظیمات وارد کن.')
  }
  const preset = PROVIDER_PRESETS[settings.provider] || PROVIDER_PRESETS.custom
  const baseUrl = settings.baseUrl || preset.baseUrl
  const args = { baseUrl, apiKey: settings.apiKey, model: settings.model, rawText }

  const result =
    preset.kind === 'anthropic' ? await callAnthropic(args) : await callOpenAiCompatible(args)

  if (!result || typeof result.content !== 'string') {
    throw new Error('پاسخ سرویس در قالب مورد انتظار نبود.')
  }
  return {
    title: typeof result.title === 'string' && result.title.trim() ? result.title.trim() : null,
    content: result.content.trim()
  }
}
