export function shuffle(cards) {
  const copy = [...cards]
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

export function drawCard(deck) {
  return { drawnCard: deck.pop(), nextDeck: deck }
}

export class DeckReconciliationError extends Error {
  constructor(predictedLabel) {
    super(`Cannot reconcile deck: missing predicted label ${predictedLabel}.`)
    this.name = 'DeckReconciliationError'
  }
}

// drawCard pops from the top at the end of the array, so index 0 is the logical bottom.
export function reconcileDeckAfterWinningDraw(deck, drawnCard, predictedLabel) {
  if (!drawnCard) throw new DeckReconciliationError(predictedLabel)
  if (drawnCard.label === predictedLabel) return deck
  const reconciledDeck = [drawnCard, ...deck]
  const predictedIndex = reconciledDeck.findIndex((card) => card.label === predictedLabel)
  if (predictedIndex < 0) throw new DeckReconciliationError(predictedLabel)
  reconciledDeck.splice(predictedIndex, 1)
  return reconciledDeck
}

export function resyncDeckFromPromoted(promotedDeck) {
  return [...promotedDeck]
}

export function haveSameDeckComposition(leftDeck, rightDeck) {
  if (leftDeck.length !== rightDeck.length) return false
  const leftCounts = countCardsByLabel(leftDeck)
  const rightCounts = countCardsByLabel(rightDeck)
  const labels = new Set([...Object.keys(leftCounts), ...Object.keys(rightCounts)])
  return Array.from(labels).every((label) => leftCounts[label] === rightCounts[label])
}

export function applyDeckMutationToTables(tables, promotedId, mutateDeck) {
  const mutatedTables = tables.map((table) => ({ ...table, deck: mutateDeck(table.deck, table) }))
  const promotedDeck = mutatedTables.find((table) => table.id === promotedId)?.deck
  if (!promotedDeck) return mutatedTables
  return mutatedTables.map((table) => table.id !== promotedId && !haveSameDeckComposition(table.deck, promotedDeck)
    ? { ...table, deck: resyncDeckFromPromoted(promotedDeck) }
    : table)
}

export function countCardsByLabel(cards, labels = []) {
  const counts = Object.fromEntries(labels.map((label) => [label, 0]))
  return cards.reduce((groupedCounts, card) => {
    groupedCounts[card.label] = (groupedCounts[card.label] || 0) + 1
    return groupedCounts
  }, counts)
}

export function makeTables(mainCards, count, previousTables = [], mainId = 'main') {
  const hasSelectedMain = previousTables.some((table) => table.id === mainId)

  return Array.from({ length: count }, (_, index) => {
    const previous = previousTables[index]
    const id = previous?.id || (index === 0 ? 'main' : `combo-${index}`)
    const isMain = id === mainId || (!hasSelectedMain && index === 0)
    const deck = isMain ? mainCards : previous?.deck || shuffle(mainCards)

    return { id, isMain, deck, lastCard: previous?.lastCard || null, lastHit: previous?.lastHit || false, lastMiss: previous?.lastMiss || false, revealId: previous?.revealId || 0, showCombo: false }
  })
}
