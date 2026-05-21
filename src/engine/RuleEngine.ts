import type { ComboHandler, JokerHandler, LevelRules, ScoreHandler } from './types'
import { jokerHandlers } from '../handlers/joker'
import { comboHandlers } from '../handlers/combo'
import { scoreHandlers } from '../handlers/score'

export interface ResolvedRules {
  jokerHandler: JokerHandler
  comboHandler: ComboHandler
  scoreHandler: ScoreHandler
}

export class RuleEngine {
  static resolve(rules: LevelRules): ResolvedRules {
    const jokerHandler = jokerHandlers[rules.jokerHandler]
    const comboHandler = comboHandlers[rules.comboHandler]
    const scoreHandler = scoreHandlers[rules.scoreHandler]

    if (!jokerHandler) throw new Error(`Unknown joker handler: ${rules.jokerHandler}`)
    if (!comboHandler) throw new Error(`Unknown combo handler: ${rules.comboHandler}`)
    if (!scoreHandler) throw new Error(`Unknown score handler: ${rules.scoreHandler}`)

    return { jokerHandler, comboHandler, scoreHandler }
  }
}
