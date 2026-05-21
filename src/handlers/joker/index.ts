import type { JokerHandler } from '../../engine/types'
import { classicJoker } from './classicJoker'

export const jokerHandlers: Record<string, JokerHandler> = {
  [classicJoker.id]: classicJoker
}
