import type { ScoreHandler } from '../../engine/types'

const handlerModules = import.meta.glob('./*.ts', { eager: true })

export const scoreHandlers = Object.values(handlerModules).reduce<Record<string, ScoreHandler>>((acc, mod) => {
  const handler = Object.values(mod as Record<string, unknown>).find(
    (entry): entry is ScoreHandler =>
      Boolean(entry) && typeof entry === 'object' && 'id' in entry && 'scoreDraw' in entry
  )

  if (handler) {
    acc[handler.id] = handler
  }

  return acc
}, {})
