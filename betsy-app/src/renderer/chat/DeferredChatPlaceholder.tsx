/**
 * Placeholder for the main chat window.
 *
 * The chat window through WSS (P1.B Tasks 14 + 17 in the original plan) is
 * deferred — `src/multi/` does not yet have a WebSocket/desktop channel.
 * That addition needs its own design spec. For now, users chat with Бетси
 * via Telegram (already wired in the multi-mode engine).
 */
export function DeferredChatPlaceholder(): JSX.Element {
  return (
    <div className="p-8 max-w-xl mx-auto text-center">
      <h2 className="text-2xl mb-3">Чат-окно</h2>
      <p className="text-neutral-400 mb-4">
        Окно чата появится с релизом desktop-channel.
        А пока — пиши Бетси в Telegram.
      </p>
      <p className="text-sm text-neutral-500">
        (Coming with desktop-channel rollout. For now use Telegram.)
      </p>
    </div>
  )
}
