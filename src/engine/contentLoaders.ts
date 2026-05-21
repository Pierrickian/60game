import levelRegistryData from '../content/registry/levels.json'
import type { LevelConfig, LevelRules, LevelsRegistry } from './types'

const levelConfigModules = import.meta.glob('../content/levels/*/config.json', {
  eager: true
}) as Record<string, LevelConfig>

const levelRulesModules = import.meta.glob('../content/levels/*/rules.json', {
  eager: true
}) as Record<string, LevelRules>

function extractLevelId(path: string): string {
  const match = path.match(/\/levels\/([^/]+)\//)
  if (!match) throw new Error(`Invalid level path: ${path}`)
  return match[1]
}

function indexLevelsById<T>(modules: Record<string, T>): Record<string, T> {
  return Object.entries(modules).reduce<Record<string, T>>((acc, [path, module]) => {
    acc[extractLevelId(path)] = module
    return acc
  }, {})
}

export const levelsRegistry = levelRegistryData as LevelsRegistry
export const levelConfigs = indexLevelsById(levelConfigModules)
export const levelRules = indexLevelsById(levelRulesModules)
