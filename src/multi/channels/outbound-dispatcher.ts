/**
 * OutboundDispatcher — cross-channel live mirror coordinator.
 *
 * Single coordination point so the engine can fire-and-forget "I just sent
 * a message via channel X" and have all registered DesktopAdapters reflect
 * it as a `message-from-other-channel` frame.
 *
 * Adapters do not import each other — Telegram/Max never know about Desktop;
 * Desktop never knows about Telegram. Both only know about this dispatcher
 * (or rather, the dispatcher knows about them).
 *
 * P1.5 — wired by server.ts and invoked from bot-router/agents/runner after
 * a successful primary-channel send. See plan task 11.
 */
import { randomUUID } from 'node:crypto'
import type { Message, MessageChannel, MessageRole } from '../chat/types.js'

export interface DesktopMirrorTarget {
  readonly name: 'desktop'
  mirror(workspaceId: string, message: Message): Promise<void>
}

export interface AfterPrimarySendInput {
  workspaceId: string
  primaryChannel: MessageChannel
  role: MessageRole
  text: string
}

export class OutboundDispatcher {
  private desktops: DesktopMirrorTarget[] = []

  registerDesktop(target: DesktopMirrorTarget): void {
    this.desktops.push(target)
  }

  async afterPrimarySend(input: AfterPrimarySendInput): Promise<void> {
    if (input.primaryChannel === 'desktop') return // already in desktop; would echo
    if (this.desktops.length === 0) return
    const message: Message = {
      id: randomUUID(),
      role: input.role,
      text: input.text,
      channel: input.primaryChannel,
      createdAt: new Date().toISOString(),
    }
    await Promise.all(this.desktops.map((d) => d.mirror(input.workspaceId, message)))
  }
}
