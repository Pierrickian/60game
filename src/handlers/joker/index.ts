import type { JokerHandler } from '../../engine/types'

const handlerModules = import.meta.glob('./*.ts', { eager: true })

export const jokerHandlers = Object.entries(handlerModules).reduce<Record<string, JokerHandler>>((acc, [path, mod]) => {
  if (path.endsWith('index.ts')) return acc
  const handler = Object.values(mod as Record<string, unknown>).find(
    (entry): entry is JokerHandler =>
      Boolean(entry) && typeof entry === 'object' && 'id' in entry && 'resolveCard' in entry
  )

  if (handler) {
    acc[handler.id] = handler
  }

  return acc
}, {})
