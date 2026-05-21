import type { ComboHandler } from '../../engine/types'

const handlerModules = import.meta.glob('./*.ts', { eager: true })

export const comboHandlers = Object.values(handlerModules).reduce<Record<string, ComboHandler>>((acc, mod) => {
  const handler = Object.values(mod as Record<string, unknown>).find(
    (entry): entry is ComboHandler =>
      Boolean(entry) && typeof entry === 'object' && 'id' in entry && 'onDraw' in entry
  )

  if (handler) {
    acc[handler.id] = handler
  }

  return acc
}, {})
