import type { JokerPowerHandler } from './types'

const handlerModules = import.meta.glob('./*.ts', { eager: true })

export const jokerPowerHandlers = Object.entries(handlerModules).reduce<Record<string, JokerPowerHandler>>((acc, [path, mod]) => {
  if (path.endsWith('index.ts') || path.endsWith('types.ts')) return acc
  const handlers = Object.values(mod as Record<string, unknown>).filter(
    (entry): entry is JokerPowerHandler => Boolean(entry) && typeof entry === 'object' && 'id' in entry && 'apply' in entry
  )

  handlers.forEach((handler) => {
    acc[handler.id] = handler
  })

  return acc
}, {})
