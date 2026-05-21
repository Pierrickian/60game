import type { ScoreHandler } from '../../engine/types'

export const classicScore: ScoreHandler = {
  id: 'classicScore',
  scoreDraw(_, resolution) {
    return resolution.card.value
  }
}
