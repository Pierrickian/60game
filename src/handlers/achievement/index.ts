import {
  evaluateComboThreshold,
  evaluateRankStreak,
  evaluateStraightThree,
  evaluateTopValuePair,
  evaluateTripletNonMin,
  evaluateUniqueStreak
} from './streakUniqueMatches'

export const achievementHandlers = {
  streakUniqueMatches: evaluateUniqueStreak,
  comboThreshold: evaluateComboThreshold,
  topValuePair: evaluateTopValuePair,
  rankStreak: evaluateRankStreak,
  straightThree: evaluateStraightThree,
  tripletNonMin: evaluateTripletNonMin
}
