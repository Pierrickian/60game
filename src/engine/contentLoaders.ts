import levelRegistryData from '../content/registry/levels.json'
import type { LevelConfig, LevelRules, LevelsRegistry } from './types'

type MaybeDefault<T> = T | { default: T }

const levelConfigModules = import.meta.glob('../content/levels/*/config.json', {
  eager: true
}) as Record<string, MaybeDefault<LevelConfig>>

const levelRulesModules = import.meta.glob('../content/levels/*/rules.json', {
  eager: true
}) as Record<string, MaybeDefault<LevelRules>>

function unwrapModule<T>(raw: MaybeDefault<T>): T {
  if (raw && typeof raw === 'object' && 'default' in raw) {
    return raw.default
  }

  return raw
}

function extractLevelId(path: string): string {
  const segments = path.split('/')
  const levelsIndex = segments.indexOf('levels')

  if (levelsIndex < 0 || levelsIndex + 1 >= segments.length) {
    throw new Error(`Invalid level path: ${path}`)
  }

  return segments[levelsIndex + 1]
}

function indexLevelsById<T>(modules: Record<string, MaybeDefault<T>>): Record<string, T> {
  return Object.entries(modules).reduce<Record<string, T>>((acc, [path, rawModule]) => {
    acc[extractLevelId(path)] = unwrapModule(rawModule)
    return acc
  }, {})
}

export const levelsRegistry = unwrapModule(levelRegistryData as MaybeDefault<LevelsRegistry>)
export const levelConfigs = indexLevelsById(levelConfigModules)
export const levelRules = indexLevelsById(levelRulesModules)
