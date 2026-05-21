import { achievementHandlers } from '../../handlers/achievement'

const modules = import.meta.glob('../../content/achievements/*/config.json', { eager: true })

function unwrap(raw) {
  return raw && typeof raw === 'object' && 'default' in raw ? raw.default : raw
}

export const achievementConfigs = Object.values(modules).map(unwrap)

export function createAchievementRuntime(levelConfig) {
  const banned = new Set(levelConfig?.bannedAchievements || [])
  const difficulty = levelConfig?.difficulty
  return achievementConfigs
    .filter((config) => !banned.has(config.id))
    .filter((config) => !(config.bannedDifficulties || []).includes(difficulty))
    .filter((config) => !(config.bannedLevels || []).includes(levelConfig?.id))
    .map((config) => ({ config, unlocked: false, state: {} }))
}

export function evaluateAchievements(runtimeItems, draw) {
  const unlocked = []
  runtimeItems.forEach((item) => {
    if (item.unlocked) return
    const handler = achievementHandlers[item.config.handler]
    if (!handler) return
    if (handler(item, item.config.params || {}, draw)) {
      item.unlocked = true
      unlocked.push(item.config)
    }
  })
  return unlocked
}
