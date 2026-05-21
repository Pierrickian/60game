function getNumericValues(levelConfig) {
  return Object.entries(levelConfig?.startingDeck || {})
    .filter(([label]) => label !== 'joker')
    .map(([label, count]) => ({ value: Number(label), count: Number(count) || 0 }))
    .filter((item) => Number.isFinite(item.value))
}

function getValueRanks(levelConfig) {
  return getNumericValues(levelConfig)
    .sort((a, b) => (b.count - a.count) || (a.value - b.value))
    .map((item) => item.value)
}

export function evaluateUniqueStreak(runtime, params, draw) {
  const targetCount = Math.max(1, Number(params?.count || 3))
  const state = runtime?.state || { streak: [] }
  if (!draw?.isWin) {
    state.streak = []
    runtime.state = state
    return false
  }
  const value = Number(draw?.card?.value || 0)
  state.streak = [...state.streak, value].slice(-targetCount)
  runtime.state = state
  return state.streak.length >= targetCount && new Set(state.streak).size === targetCount
}

export function evaluateComboThreshold(runtime, params, draw) {
  if (!draw?.isWin) return false
  return Number(draw?.combo || 0) >= Number(params?.target || 2)
}

export function evaluateTopValuePair(runtime, params, draw) {
  const targetRank = Number(params?.rank || 1)
  const state = runtime.state || { streak: 0 }
  if (!draw?.isWin) {
    state.streak = 0
    runtime.state = state
    return false
  }
  const ranks = getNumericValues(draw?.levelConfig).sort((a, b) => b.value - a.value)
  const target = ranks[targetRank - 1]?.value
  if (target == null) return false
  state.streak = draw.card?.value === target ? state.streak + 1 : 0
  runtime.state = state
  return state.streak >= Number(params?.count || 2)
}

export function evaluateRankStreak(runtime, params, draw) {
  const rankIndex = Number(params?.rankIndex || 2) - 1
  const need = Number(params?.count || 2)
  const state = runtime.state || { streak: 0 }
  if (!draw?.isWin) {
    state.streak = 0
    runtime.state = state
    return false
  }
  const rankedValues = getValueRanks(draw?.levelConfig)
  const target = rankedValues[rankIndex]
  if (target == null) return false
  state.streak = draw.card?.value === target ? state.streak + 1 : 0
  runtime.state = state
  return state.streak >= need
}

export function evaluateStraightThree(runtime, params, draw) {
  const state = runtime.state || { values: [] }
  if (!draw?.isWin) {
    state.values = []
    runtime.state = state
    return false
  }
  const value = Number(draw?.card?.value || 0)
  state.values = [...state.values, value].slice(-3)
  runtime.state = state
  if (state.values.length < 3) return false
  const [a, b, c] = state.values
  const unique = new Set(state.values).size === 3
  return unique && ((b === a + 1 && c === b + 1) || (b === a - 1 && c === b - 1))
}

export function evaluateTripletNonMin(runtime, params, draw) {
  const state = runtime.state || { streak: 0 }
  if (!draw?.isWin) {
    state.streak = 0
    runtime.state = state
    return false
  }
  const minValue = Math.min(...getNumericValues(draw?.levelConfig).map((x) => x.value))
  const value = Number(draw?.card?.value || 0)
  state.streak = state.lastValue === value ? state.streak + 1 : 1
  state.lastValue = value
  runtime.state = state
  return value > minValue && state.streak >= Number(params?.count || 3)
}
