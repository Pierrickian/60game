import { readStoredNumber, readStoredObject, writeStoredValue } from '../src/runtime/browserStorage.js'

function expect(condition, message) {
  if (!condition) throw new Error(message)
}

const values = new Map([
  ['valid-number', '42'],
  ['invalid-number', 'not-a-number'],
  ['valid-object', '{"classic_60":{"stars":2}}'],
  ['invalid-json', '{broken'],
  ['invalid-shape', '[]']
])
globalThis.localStorage = {
  getItem(key) { return values.get(key) ?? null },
  setItem(key, value) { values.set(key, value) }
}

expect(readStoredNumber('valid-number') === 42, 'Expected a stored numeric value to load.')
expect(readStoredNumber('invalid-number', 7) === 7, 'Expected an invalid numeric value to fall back safely.')
expect(readStoredObject('valid-object').classic_60.stars === 2, 'Expected a stored progression object to load.')
expect(Object.keys(readStoredObject('invalid-json')).length === 0, 'Expected malformed stored JSON to fall back safely.')
expect(Object.keys(readStoredObject('invalid-shape')).length === 0, 'Expected a stored non-object shape to fall back safely.')
writeStoredValue('saved', 99)
expect(values.get('saved') === '99', 'Expected storage writes to remain available when storage works.')
Object.defineProperty(globalThis, 'localStorage', { configurable: true, get() { throw new Error('blocked') } })
expect(readStoredNumber('blocked', 3) === 3, 'Expected blocked storage reads to fall back safely.')
expect(Object.keys(readStoredObject('blocked')).length === 0, 'Expected blocked JSON storage reads to fall back safely.')
writeStoredValue('blocked', 1)

console.log('Validated browser storage fallbacks.')
