import assert from 'node:assert/strict'
import { formatCardProbability, getCardProbabilityModel, getMostLikelyCardLabels } from '../src/runtime/cardProbabilities.js'

const disabled = getCardProbabilityModel({ 2: 3, 5: 1 }, 4, false)
assert.deepEqual(disabled.percentages, {})
assert.equal(disabled.mostLikelyLabels.size, 0)

const initial = getCardProbabilityModel({ 2: 3, 5: 1, JOKER: 0 }, 4, true)
assert.equal(initial.percentages['2'], 75)
assert.equal(initial.percentages['5'], 25)
assert.deepEqual([...initial.mostLikelyLabels], ['2'])

const tieAfterDraw = getCardProbabilityModel({ 2: 1, 5: 1, JOKER: 0 }, 2, true)
assert.equal(formatCardProbability(tieAfterDraw.percentages['2']), '50%')
assert.deepEqual([...tieAfterDraw.mostLikelyLabels], ['2', '5'])

const moreLessFiltered = getMostLikelyCardLabels({ 2: 8, 4: 8, 6: 8, 8: 3, 12: 3 }, ['8', '12'])
assert.deepEqual([...moreLessFiltered], ['8', '12'])

console.log('Validated optional card probability calculations and ties.')
