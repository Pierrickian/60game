import type { EngineCard, LevelConfig } from './types'

const CARD_METADATA: Record<string, Omit<EngineCard, 'label'>> = {
  '2': { value: 2, theme: 'green', gem: '◆' },
  '5': { value: 5, theme: 'blue', gem: '◆' },
  '10': { value: 10, theme: 'purple', gem: '◆' },
  '15': { value: 15, theme: 'orange', gem: '◆' },
  '20': { value: 20, theme: 'red', gem: '◆' },
  '30': { value: 30, theme: 'cyan', gem: '◆' },
  '60': { value: 60, theme: 'gold', gem: '◆' },
  joker: { value: 0, theme: 'black', gem: '♛' }
}

export class DeckEngine {
  static buildDeck(levelConfig: LevelConfig): EngineCard[] {
    const deck: EngineCard[] = []

    Object.entries(levelConfig.startingDeck).forEach(([rawLabel, count]) => {
      const label = rawLabel === 'joker' ? 'JOKER' : rawLabel
      const metadata = CARD_METADATA[rawLabel]

      if (!metadata) {
        throw new Error(`Unknown card type in level config: ${rawLabel}`)
      }

      for (let i = 0; i < count; i += 1) {
        deck.push({ label, ...metadata })
      }
    })

    return DeckEngine.shuffle(deck)
  }

  static shuffle(cards: EngineCard[]): EngineCard[] {
    const copy = [...cards]
    for (let i = copy.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[copy[i], copy[j]] = [copy[j], copy[i]]
    }
    return copy
  }
}
