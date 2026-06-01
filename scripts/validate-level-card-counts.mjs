import { readdir, readFile } from 'node:fs/promises'
import { join } from 'node:path'

const levelsDirectory = new URL('../src/content/levels/', import.meta.url)
const levelDirectories = (await readdir(levelsDirectory, { withFileTypes: true }))
  .filter((entry) => entry.isDirectory())
const registry = JSON.parse(await readFile(new URL('../src/content/registry/levels.json', import.meta.url), 'utf8'))
const configuredLevelIds = new Set(levelDirectories.map((directory) => directory.name))
const registryLevelIds = registry.levels.map(({ id }) => id)
const errors = []

if (!configuredLevelIds.has(registry.startingLevel)) errors.push(`registry: missing starting level config ${registry.startingLevel}`)
if (new Set(registryLevelIds).size !== registryLevelIds.length) errors.push('registry: level ids must be unique')
for (const id of registryLevelIds) {
  if (!configuredLevelIds.has(id)) errors.push(`registry: missing level config ${id}`)
}

for (const directory of levelDirectories) {
  const configPath = join(levelsDirectory.pathname, directory.name, 'config.json')
  const config = JSON.parse(await readFile(configPath, 'utf8'))
  if (config.id !== directory.name) errors.push(`${directory.name}: config id must match its directory name`)
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
