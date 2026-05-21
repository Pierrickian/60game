import levelRegistryData from '../content/registry/levels.json'
import level1Config from '../content/levels/level_1/config.json'
import level1Rules from '../content/levels/level_1/rules.json'
import { DeckEngine } from './DeckEngine'
import { RuleEngine } from './RuleEngine'
import { ScoreEngine } from './ScoreEngine'
import type { DrawResolution, LevelConfig, LevelRules, LevelsRegistry, RuntimeGameState } from './types'

const levelConfigs: Record<string, LevelConfig> = {
  level_1: level1Config as LevelConfig
}

const levelRulesMap: Record<string, LevelRules> = {
  level_1: level1Rules as LevelRules
}

export class GameEngine {
  private readonly registry: LevelsRegistry
  private readonly rules
  readonly state: RuntimeGameState

  constructor(levelId?: string) {
    this.registry = levelRegistryData as LevelsRegistry
    const currentLevelId = levelId ?? this.registry.startingLevel
    const config = levelConfigs[currentLevelId]
    const levelRules = levelRulesMap[currentLevelId]

    if (!config) throw new Error(`Missing level config for ${currentLevelId}`)
    if (!levelRules) throw new Error(`Missing level rules for ${currentLevelId}`)

    this.rules = RuleEngine.resolve(levelRules)
    this.state = {
      currentLevelId,
      deck: DeckEngine.buildDeck(config),
      discard: [],
      score: 0,
      lastCard: null
    }
  }

  draw(guess: string): DrawResolution | null {
    const drawnCard = this.state.deck.shift()
    if (!drawnCard) return null

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
