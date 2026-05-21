import type { ComboHandler } from '../../engine/types'

export const noDeckMultiply: ComboHandler = {
  id: 'noDeckMultiply',
  onDraw() {
    // Classic behavior: no combo mutation.
  }
}
