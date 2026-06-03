const JOKER_LABEL = 'JOKER'

export function getMoreLessHintDirection(drawnCard, nextCard) {
  if (!drawnCard || !nextCard) return null
  if (drawnCard.label === JOKER_LABEL || nextCard.label === JOKER_LABEL) return null
  if (drawnCard.value === nextCard.value) return null
  return nextCard.value > drawnCard.value ? 'MORE' : 'LESS'
}
