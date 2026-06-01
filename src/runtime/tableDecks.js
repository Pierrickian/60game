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
