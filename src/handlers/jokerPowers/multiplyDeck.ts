import type { JokerPowerHandler } from './types'

export const multiplyDeck: JokerPowerHandler = {
  id: 'multiplyDeck',
  apply(context, params) {
    const factor = Math.max(1, Number(params?.factor ?? 1))
    if (factor <= 1) return context.deck
    const baseDeck = [...context.deck]
    const clones = Array.from({ length: factor - 1 }, () => baseDeck.map((card) => ({ ...card, id: `${card.id}-x${Math.random().toString(36).slice(2, 7)}` }))).flat()
    return [...baseDeck, ...clones]
  }
}


export const multiplyScore: JokerPowerHandler = {
  id: 'multiplyScore',
  apply(context) {
    return context.deck
  }
}
