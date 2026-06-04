export function getCardProbabilityModel(remainingCounts, totalRemaining, enabled) {
  if (!enabled || totalRemaining <= 0) return { percentages: {}, mostLikelyLabels: new Set() }

  const labels = Object.keys(remainingCounts)
  const highestRemaining = labels.reduce((highest, label) => Math.max(highest, remainingCounts[label] || 0), 0)
  const percentages = Object.fromEntries(labels.map((label) => [label, ((remainingCounts[label] || 0) / totalRemaining) * 100]))
  const mostLikelyLabels = new Set(highestRemaining > 0 ? labels.filter((label) => remainingCounts[label] === highestRemaining) : [])

  return { percentages, mostLikelyLabels }
}

export function formatCardProbability(probability) {
  if (!Number.isFinite(probability)) return '0%'
  const rounded = probability >= 10 ? Math.round(probability) : Math.round(probability * 10) / 10
  return `${rounded}%`
}
