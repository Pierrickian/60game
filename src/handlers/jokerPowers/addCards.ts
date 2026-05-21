import type { JokerPowerHandler } from './types'

function numericLabels(levelConfig: { startingDeck: Record<string, number> }): number[] {
  return Object.keys(levelConfig.startingDeck).filter((key) => key !== 'joker').map(Number).filter(Number.isFinite).sort((a, b) => a - b)
}

function addCards(deck: ReturnType<JokerPowerHandler['apply']>, count: number, label: string, makeCardFromLabel: (label: string) => ReturnType<JokerPowerHandler['apply']>[number]) {
  const additions = Array.from({ length: Math.max(0, count) }, () => makeCardFromLabel(label))
  return [...deck, ...additions]
}

export const addHighestCard: JokerPowerHandler = {
  id: 'addHighestCard',
  apply({ deck, levelConfig, makeCardFromLabel }, params) {
    const labels = numericLabels(levelConfig)
    if (labels.length === 0) return deck
    return addCards(deck, Number(params?.count ?? 0), String(labels[labels.length - 1]), makeCardFromLabel)
  }
}

export const addLowestCard: JokerPowerHandler = {
  id: 'addLowestCard',
  apply({ deck, levelConfig, makeCardFromLabel }, params) {
    const labels = numericLabels(levelConfig)
    if (labels.length === 0) return deck
    return addCards(deck, Number(params?.count ?? 0), String(labels[0]), makeCardFromLabel)
  }
}

export const addRankedHighestCard: JokerPowerHandler = {
  id: 'addRankedHighestCard',
  apply({ deck, levelConfig, makeCardFromLabel }, params) {
    const labels = numericLabels(levelConfig)
    if (labels.length === 0) return deck
    const rank = Math.max(1, Number(params?.rank ?? 1))
    const index = Math.max(0, labels.length - rank)
    return addCards(deck, Number(params?.count ?? 0), String(labels[index]), makeCardFromLabel)
  }
}

export const addJoker: JokerPowerHandler = {
  id: 'addJoker',
  apply({ deck, makeCardFromLabel }, params) {
    return addCards(deck, Number(params?.count ?? 1), 'JOKER', makeCardFromLabel)
  }
}
