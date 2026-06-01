import { countCardsByLabel, drawCard, makeTables } from '../src/runtime/tableDecks.js'

const cards = [{ label: '2', id: 'a' }, { label: '3', id: 'b' }]
const initialTables = makeTables(cards, 2)
const secondaryDeck = initialTables[1].deck
const { drawnCard, nextDeck } = drawCard(initialTables[0].deck, initialTables[0].deck)

if (!drawnCard || nextDeck !== cards || nextDeck.length !== 1) {
  throw new Error('Expected draws to reuse the existing deck and remove one card in place.')
}

const updatedTables = makeTables(nextDeck, 2, initialTables, initialTables[0].id)
if (updatedTables[1].deck !== secondaryDeck) {
  throw new Error('Expected existing combo decks to be retained between draws.')
}

const reshuffled = drawCard([], [{ label: '2', id: 'c' }])
if (reshuffled.drawnCard?.id !== 'c' || reshuffled.nextDeck.length !== 0) {
  throw new Error('Expected an exhausted deck to reshuffle and draw from its fallback cards.')
}

const counts = countCardsByLabel([{ label: '2' }, { label: '2' }, { label: '3' }], ['2', '3', 'JOKER'])
if (counts['2'] !== 2 || counts['3'] !== 1 || counts.JOKER !== 0) {
  throw new Error('Expected cards to be counted in a single grouped pass, including exhausted labels.')
}

console.log('Validated table deck runtime optimizations.')
