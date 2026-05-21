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

  if (state.streak.length < targetCount) return false
  return new Set(state.streak).size === targetCount
}
