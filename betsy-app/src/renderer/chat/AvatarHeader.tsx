import type { ConnectionStatus } from './chat-reducer'

interface Props {
  personaName: string
  avatarUrl: string | null
  status: ConnectionStatus
}

const STATUS_COLORS: Record<ConnectionStatus, string> = {
  open: '#10b981',
  'auth-failed': '#ef4444',
  connecting: '#fbbf24',
  reconnecting: '#fbbf24',
}

const STATUS_LABELS: Record<ConnectionStatus, string> = {
  open: 'онлайн',
  'auth-failed': 'сессия истекла',
  connecting: 'подключаюсь…',
  reconnecting: 'переподключаюсь…',
}

export function AvatarHeader({ personaName, avatarUrl, status }: Props): JSX.Element {
  return (
    <header className="flex items-center gap-3 px-4 py-3 border-b border-neutral-800 bg-neutral-950">
      {avatarUrl ? (
        <img
          src={`file://${avatarUrl}`}
          alt=""
          className="w-9 h-9 rounded-full object-cover"
        />
      ) : (
        <div className="w-9 h-9 rounded-full bg-neutral-700" />
      )}
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-neutral-200 truncate">{personaName}</div>
        <div
          className="text-xs flex items-center gap-1.5"
          style={{ color: STATUS_COLORS[status] }}
        >
          <span>●</span>
          <span>{STATUS_LABELS[status]}</span>
        </div>
      </div>
    </header>
  )
}
