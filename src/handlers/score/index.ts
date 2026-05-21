import type { ScoreHandler } from '../../engine/types'
import { classicScore } from './classicScore'

export const scoreHandlers: Record<string, ScoreHandler> = {
  [classicScore.id]: classicScore
}
