import type { ComboHandler } from '../../engine/types'
import { noDeckMultiply } from './noDeckMultiply'

export const comboHandlers: Record<string, ComboHandler> = {
  [noDeckMultiply.id]: noDeckMultiply
}
