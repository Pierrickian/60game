import type { JokerHandler } from '../../engine/types'

export const classicJoker: JokerHandler = {
  id: 'classicJoker',
  resolveCard(card) {
    return card
  }
}
