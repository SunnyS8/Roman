import { useState } from 'react'
import { api } from '../../ipc'
import type { CachedPreset } from '../../../main/persona-cache'

interface HostedLoginProps {
  preset: CachedPreset
}

export function HostedLogin({ preset }: HostedLoginProps): JSX.Element {
  const lines = preset.wizardLines as Record<string, string | string[]>
  const intro = typeof lines.tg_login_intro === 'string' ? lines.tg_login_intro : ''
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const click = async (): Promise<void> => {
    setBusy(true)
    setError(null)
    try {
      const r = await api.invoke('hosted:startLogin', preset.id)
      await api.invoke('hosted:openExternal', r.deepLink)
    } catch (e) {
      setError(String((e as Error).message ?? e))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div>
      {intro && <p className="text-blue-300 italic mb-6">«{intro}»</p>}
      <button
        onClick={() => void click()}
        disabled={busy}
        className="px-6 py-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 rounded-lg"
      >
        {busy ? 'Открываю Telegram…' : 'Войти через Telegram'}
      </button>
      {error && <div className="text-red-400 text-sm mt-3">{error}</div>}
    </div>
  )
}
