import { DeckEngine } from './DeckEngine'
import { levelConfigs, levelRules, levelsRegistry } from './contentLoaders'
import { RuleEngine } from './RuleEngine'
import { ScoreEngine } from './ScoreEngine'
import type { DrawResolution, RuntimeGameState } from './types'

export class GameEngine {
  private readonly rules
  readonly state: RuntimeGameState

  constructor(levelId?: string) {
    const currentLevelId = levelId ?? levelsRegistry.startingLevel
    const config = levelConfigs[currentLevelId]
    const rulesForLevel = levelRules[currentLevelId]

    if (!config) throw new Error(`Missing level config for ${currentLevelId}`)
    if (!rulesForLevel) throw new Error(`Missing level rules for ${currentLevelId}`)

    this.rules = RuleEngine.resolve(rulesForLevel)
    this.state = {
      currentLevelId,
      deck: DeckEngine.buildDeck(config),
      discard: [],
      score: 0,
      lastCard: null,
      cardTypes: DeckEngine.getCardTypes(config),
      remainingCounts: DeckEngine.getRemainingCounts(config)
    }
  }

  draw(guess: string): DrawResolution | null {
    const drawnCard = this.state.deck.shift()
    if (!drawnCard) return null

    this.state.remainingCounts[drawnCard.label] = Math.max((this.state.remainingCounts[drawnCard.label] ?? 0) - 1, 0)

    const resolvedCard = this.rules.jokerHandler.resolveCard(drawnCard)
    const isWin = guess === resolvedCard.label
    const resolution: DrawResolution = { card: resolvedCard, isWin, pointsAwarded: 0 }

    this.state.lastCard = resolvedCard
    this.state.discard.push(resolvedCard)

    if (isWin) {
      resolution.pointsAwarded = ScoreEngine.applyScore(this.state, this.rules.scoreHandler, resolution)
    }

    this.rules.comboHandler.onDraw(this.state, resolution)
    return resolution
  }

  isFinished(): boolean {
    return this.state.deck.length === 0
  }
}
