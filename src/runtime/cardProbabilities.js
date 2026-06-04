export function getMostLikelyCardLabels(remainingCounts, candidateLabels = Object.keys(remainingCounts)) {
  const labels = candidateLabels.filter((label) => Object.hasOwn(remainingCounts, label))
  const highestRemaining = labels.reduce((highest, label) => Math.max(highest, remainingCounts[label] || 0), 0)
  return new Set(highestRemaining > 0 ? labels.filter((label) => remainingCounts[label] === highestRemaining) : [])
}

export function getCardProbabilityModel(remainingCounts, totalRemaining, enabled) {
  if (!enabled || totalRemaining <= 0) return { percentages: {}, mostLikelyLabels: new Set() }

  const labels = Object.keys(remainingCounts)
  const percentages = Object.fromEntries(labels.map((label) => [label, ((remainingCounts[label] || 0) / totalRemaining) * 100]))

  return { percentages, mostLikelyLabels: getMostLikelyCardLabels(remainingCounts, labels) }
}

export function formatCardProbability(probability) {
  if (!Number.isFinite(probability)) return '0%'
  const rounded = probability >= 10 ? Math.round(probability) : Math.round(probability * 10) / 10
  return `${rounded}%`
}
