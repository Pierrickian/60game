const SCORE_THRESHOLDS = { 'Super Easy': 100, Easy: 200, Medium: 300, Hard: 400 }
const PRECISION_THRESHOLDS = { 'Super Easy': 0.1, Easy: 0.2, Medium: 0.3, Hard: 0.4 }

export function getStarModel(level, runtime) {
  const difficulty = level?.difficulty || 'Hard'
  const scoreTarget = SCORE_THRESHOLDS[difficulty] ?? 400
  const precisionTarget = PRECISION_THRESHOLDS[difficulty] ?? 0.4
  const minCardValue = Math.min(...Object.keys(level.startingDeck).filter((v) => v !== 'joker').map(Number))
  const precision = runtime.totalDrawn > 0 ? runtime.precisionHits / runtime.totalDrawn : 0
  return [
    { id: 'success', name: 'Success', targetText: '1 Success', target: 1, value: runtime.achievementCount, unlocked: runtime.achievementCount >= 1 },
    { id: 'score', name: 'Score', targetText: `${scoreTarget} Score`, target: scoreTarget, value: runtime.score, unlocked: runtime.score >= scoreTarget },
    { id: 'precision', name: 'Precision', targetText: `${Math.round(precisionTarget * 100)}% Precision`, target: precisionTarget, value: precision, valueText: `${Math.round(precision * 100)}%`, unlocked: precision >= precisionTarget, minCardValue }
  ]
}
