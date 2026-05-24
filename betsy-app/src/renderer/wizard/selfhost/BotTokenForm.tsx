import { useState } from 'react'
import { api } from '../../ipc'
import type { CachedPreset } from '../../../main/persona-cache'

interface BotTokenFormProps {
  preset: CachedPreset
  publicUrl: string
}

export function BotTokenForm({ preset, publicUrl }: BotTokenFormProps): JSX.Element {
  const lines = preset.wizardLines as Record<string, string | string[]>
  const prompt = typeof lines.bot_token_prompt === 'string' ? lines.bot_token_prompt : ''
  const [token, setToken] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const submit = async (): Promise<void> => {
    setBusy(true)
    setError(null)
    await api.invoke('wizard:dispatch', { type: 'bot-token-submitted', token })
    const r = await api.invoke('ssh:setBotWebhook', token, publicUrl)
    setBusy(false)
    if (!r.ok) setError(r.error ?? 'unknown')
  }

  return (
    <div>
      {prompt && <p className="text-amber-300 italic mb-6">«{prompt}»</p>}
      <div className="space-y-3 max-w-md">
        <input
          className="w-full bg-neutral-900 p-2 rounded border border-neutral-800 font-mono"
          placeholder="123456:ABC-DEF..."
          value={token}
          onChange={(e) => setToken(e.target.value)}
        />
        {error && <div className="text-red-400 text-sm">{error}</div>}
        <button
          onClick={() => void submit()}
          disabled={busy || !token}
          className="px-6 py-2 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 rounded"
        >
          {busy ? 'Настраиваю…' : 'Подключить бота'}
        </button>
        <p className="text-xs text-neutral-500">
          Создай бота в @BotFather и вставь токен сюда.
        </p>
      </div>
    </div>
  )
}
