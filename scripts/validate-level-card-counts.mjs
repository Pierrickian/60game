import { readdir, readFile } from 'node:fs/promises'
import { join } from 'node:path'

const levelsDirectory = new URL('../src/content/levels/', import.meta.url)
const levelDirectories = (await readdir(levelsDirectory, { withFileTypes: true }))
  .filter((entry) => entry.isDirectory())
const errors = []

for (const directory of levelDirectories) {
  const configPath = join(levelsDirectory.pathname, directory.name, 'config.json')
  const config = JSON.parse(await readFile(configPath, 'utf8'))
  const numericCards = Object.entries(config.startingDeck)
    .filter(([label]) => label !== 'joker')
    .map(([label, count]) => ({ value: Number(label), count }))

  if (numericCards.length === 0) {
    errors.push(`${config.id}: deck must contain at least one numeric card type`)
    continue
  }

  const targetCardCount = numericCards[0].value * numericCards[0].count
  const actualCardCount = Object.values(config.startingDeck).reduce((total, count) => total + count, 0)

  for (const { value, count } of numericCards) {
    if (!Number.isInteger(value) || value <= 0 || !Number.isInteger(count) || count <= 0) {
      errors.push(`${config.id}: numeric card values and quantities must be positive integers`)
    } else if (value * count !== targetCardCount) {
      errors.push(`${config.id}: ${count} cards with value ${value} do not match the expected ${targetCardCount} game probability`)
    }
  }

  if (actualCardCount !== targetCardCount) {
    errors.push(`${config.id}: deck contains ${actualCardCount} cards instead of ${targetCardCount}; adjust its jokers`)
  }
}

if (errors.length > 0) {
  console.error(errors.join('\n'))
  process.exitCode = 1
} else {
  console.log(`Validated card counts for ${levelDirectories.length} levels.`)
}
