import { jokerPowerHandlers } from '../handlers/jokerPowers'

export interface JokerPowerConfig {
  id: string
  name: string
  popupText: string
  handler: string
  weight?: number
  params?: Record<string, unknown>
}

type MaybeDefault<T> = T | { default: T }

const jokerPowerModules = import.meta.glob('../content/jokerPowers/*/config.json', {
  eager: true
}) as Record<string, MaybeDefault<JokerPowerConfig>>

function unwrapModule<T>(raw: MaybeDefault<T>): T {
  if (raw && typeof raw === 'object' && 'default' in raw) return raw.default
  return raw
}

export const jokerPowers = Object.values(jokerPowerModules).map(unwrapModule)

export function chooseWeightedJokerPower(pool = jokerPowers): JokerPowerConfig | null {
  if (pool.length === 0) return null
  const total = pool.reduce((sum, power) => sum + Math.max(0, Number(power.weight ?? 1)), 0)
  if (total <= 0) return pool[0]
  let roll = Math.random() * total
  for (const power of pool) {
    roll -= Math.max(0, Number(power.weight ?? 1))
    if (roll <= 0) return power
  }
  return pool[pool.length - 1]
}

export function resolveJokerPowerHandler(handlerId: string) {
  return jokerPowerHandlers[handlerId]
}
