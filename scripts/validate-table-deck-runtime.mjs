import {
  DeckReconciliationError,
  applyDeckMutationToTables,
  countCardsByLabel,
  drawCard,
  haveSameDeckComposition,
  makeTables,
  reconcileDeckAfterWinningDraw,
  resyncDeckFromPromoted
} from '../src/runtime/tableDecks.js'

function card(label, id) {
  return { label, id }
}

function labels(deck) {
  return deck.map(({ label }) => label).join(',')
}

function expect(condition, message) {
  if (!condition) throw new Error(message)
}

const cards = [card('2', 'a'), card('3', 'b')]
const initialTables = makeTables(cards, 2)
const secondaryDeck = initialTables[1].deck
const { drawnCard, nextDeck } = drawCard(initialTables[0].deck)
expect(drawnCard && nextDeck === cards && nextDeck.length === 1, 'Expected draws to reuse the existing deck and remove one card in place.')

const updatedTables = makeTables(nextDeck, 2, initialTables, initialTables[0].id)
expect(updatedTables[1].deck === secondaryDeck, 'Expected existing combo decks to be retained between draws.')

const exhaustedDeck = []
const exhaustedDraw = drawCard(exhaustedDeck)
expect(exhaustedDraw.drawnCard === undefined && exhaustedDraw.nextDeck === exhaustedDeck, 'Expected an exhausted deck to remain empty without regenerating cards.')

const counts = countCardsByLabel([card('2', 'a'), card('2', 'b'), card('3', 'c')], ['2', '3', 'JOKER'])
expect(counts['2'] === 2 && counts['3'] === 1 && counts.JOKER === 0, 'Expected cards to be counted in a single grouped pass, including exhausted labels.')

const promoted = { id: 'combo-1', deck: [card('5', 'a5'), card('7', 'a7'), card('3', 'a3'), card('2', 'a2')] }
const winningTables = [
  { id: 'main', deck: [card('2', 'm2'), card('3', 'm3'), card('7', 'm7'), card('5', 'm5')] },
  promoted,
  { id: 'combo-2', deck: [card('2', 'b2'), card('3', 'b3'), card('5', 'b5'), card('7', 'b7')] },
  { id: 'combo-3', deck: [card('7', 'c7'), card('5', 'c5'), card('3', 'c3'), card('2', 'c2')] }
]
const originalRandom = Math.random
let randomCalls = 0
Math.random = () => { randomCalls += 1; return 0.5 }
const revealedWinningTables = winningTables.map((table) => {
  const { drawnCard: revealedCard, nextDeck: revealedDeck } = drawCard(table.deck)
  return { ...table, deck: revealedDeck, lastCard: revealedCard, lastHit: revealedCard.label === '2' }
})
const firstWinningTable = revealedWinningTables.find((table) => table.lastHit)
expect(firstWinningTable.id === promoted.id, 'Expected the first matching secondary deck to become the promoted deck.')
const reconciledWinningTables = revealedWinningTables.map((table) => table.id === firstWinningTable.id
  ? table
  : { ...table, deck: reconcileDeckAfterWinningDraw(table.deck, table.lastCard, '2') })
expect(labels(reconciledWinningTables[0].deck) === '5,3,7', 'Expected the old main deck to restore its wrong draw at the bottom and consume the first predicted label from the bottom.')
expect(labels(reconciledWinningTables[2].deck) === '7,3,5', 'Expected another wrong secondary deck to be reconciled locally.')
expect(labels(reconciledWinningTables[3].deck) === '7,5,3', 'Expected another matching secondary deck not to consume a second card.')
expect(reconciledWinningTables.every((table) => table.deck.length === 3), 'Expected every active deck to lose exactly one card after a win.')
expect(reconciledWinningTables.every((table) => haveSameDeckComposition(table.deck, firstWinningTable.deck)), 'Expected every active deck to retain the promoted deck composition after reconciliation.')
expect(new Set(reconciledWinningTables.map((table) => labels(table.deck))).size > 1, 'Expected reconciled decks to retain independent internal orders.')
const duplicatePredictedDeck = [card('2', 'bottom-2'), card('3', 'middle-3'), card('2', 'top-2')]
const reconciledDuplicateDeck = reconcileDeckAfterWinningDraw(duplicatePredictedDeck, card('7', 'wrong-7'), '2')
expect(reconciledDuplicateDeck.map(({ id }) => id).join(',') === 'wrong-7,middle-3,top-2', 'Expected reconciliation to remove the first predicted occurrence from the logical bottom.')
expect(randomCalls === 0, 'Expected nominal reconciliation not to shuffle any deck.')

const shuffledSource = [card('2', 's2'), card('3', 's3'), card('5', 's5'), card('7', 's7')]
const tablesWithNewDeck = makeTables(shuffledSource, 2)
expect(randomCalls === shuffledSource.length - 1, 'Expected one independent shuffle when a new combo deck is created.')
makeTables(shuffledSource, 2, tablesWithNewDeck, tablesWithNewDeck[0].id)
expect(randomCalls === shuffledSource.length - 1, 'Expected an existing combo deck not to be shuffled again when it is retained.')

const losingTables = [
  { id: 'main', deck: [card('2', 'l2'), card('5', 'l5')] },
  { id: 'combo-1', deck: [card('2', 'q2'), card('7', 'q7')] }
]
const revealedLosingTables = losingTables.map((table) => ({ ...table, lastCard: drawCard(table.deck).drawnCard }))
expect(labels(revealedLosingTables[0].deck) === '2' && labels(revealedLosingTables[1].deck) === '2', 'Expected a loss to preserve the existing draw-only behavior without reconciliation.')

const promotedDeck = [card('3', 'p3'), card('5', 'p5')]
const coherentDeck = [card('5', 'c5'), card('3', 'c3')]
const inconsistentDeck = [card('3', 'i3')]
let reconciliationError = null
try {
  reconcileDeckAfterWinningDraw(inconsistentDeck, card('7', 'i7'), '2')
} catch (error) {
  reconciliationError = error
}
expect(reconciliationError instanceof DeckReconciliationError, 'Expected an incoherent deck to report an explicit reconciliation error.')
const resyncedDeck = resyncDeckFromPromoted(promotedDeck)
expect(labels(resyncedDeck) === labels(promotedDeck) && resyncedDeck !== promotedDeck, 'Expected exceptional recovery to resynchronize only the incoherent deck from the promoted deck.')
expect(labels(coherentDeck) === '5,3', 'Expected exceptional recovery not to touch coherent sibling decks.')

const jokerMutatedDecks = applyDeckMutationToTables(reconciledWinningTables, firstWinningTable.id, (deck, table) => [...deck, card('2', `joker-add-${table.id}`)])
expect(jokerMutatedDecks.every((table) => haveSameDeckComposition(table.deck, jokerMutatedDecks[0].deck)), 'Expected an explicit Joker mutation to keep every active deck synchronized by composition.')
const jokerCounts = countCardsByLabel(jokerMutatedDecks[0].deck, ['2', '3', '5', '7'])
expect(jokerCounts['2'] === 1, 'Expected an explicit Joker mutation to make an exhausted prediction label legitimately reappear.')
expect(randomCalls === shuffledSource.length - 1, 'Expected reconciliation and explicit Joker additions not to trigger extra shuffles.')
Math.random = originalRandom

console.log('Validated table deck runtime optimizations.')
