export interface LevelConfig {
  id: string
  name: string
  startingDeck: Record<string, number>
}

export interface LevelRules {
  jokerHandler: string
  comboHandler: string
  scoreHandler: string
}

export interface RuntimeGameState {
  currentLevelId: string
  deck: EngineCard[]
  discard: EngineCard[]
  score: number
  lastCard: EngineCard | null
  cardTypes: EngineCard[]
  remainingCounts: Record<string, number>
}

export interface EngineCard {
  label: string
  value: number
  theme: string
  gem: string
}

export interface DrawResolution {
  card: EngineCard
  isWin: boolean
  pointsAwarded: number
}

export interface JokerHandler {
  id: string
  resolveCard(card: EngineCard): EngineCard
}

export interface ComboHandler {
  id: string
  onDraw(state: RuntimeGameState, resolution: DrawResolution): void
}

export interface ScoreHandler {
  id: string
  scoreDraw(state: RuntimeGameState, resolution: DrawResolution): number
}

export interface LevelRegistryEntry {
  id: string
  next?: string
}

export interface LevelsRegistry {
  startingLevel: string
  levels: LevelRegistryEntry[]
}
