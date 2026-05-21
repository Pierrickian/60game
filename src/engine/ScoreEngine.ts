import type { DrawResolution, RuntimeGameState, ScoreHandler } from './types'

export class ScoreEngine {
  static applyScore(state: RuntimeGameState, scoreHandler: ScoreHandler, resolution: DrawResolution): number {
    const points = scoreHandler.scoreDraw(state, resolution)
    state.score += points
    return points
  }
}
