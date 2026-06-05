export const TUTORIAL_STORAGE_KEY = '60game-tutorial-settings'

export const TUTORIAL_TEXT = {
  homeTitle: 'Tutorial',
  homeStart: 'Start tutorial',
  homeHint: 'Launch a guided run before playing freely.',
  pause: 'Tutorial',
  waiting: 'Your turn…',
  next: 'Next',
  finish: 'Play',
  stop: 'Forever',
  close: 'Close tutorial'
}

export const TUTORIAL_STEPS = [
  {
    id: 'mode',
    title: 'Choose your run',
    body: 'Pick Classic for the normal game, or More or less for hints after each draw.',
    target: 'level-intro',
    action: 'choose-mode'
  },
  {
    id: 'table',
    title: 'Deck and reveal',
    body: 'The blue stack is your deck. The purple slot shows the card that was just drawn.',
    target: 'table',
    action: 'next'
  },
  {
    id: 'guess_one',
    title: 'Predict a card',
    body: 'Use the card buttons below. Pick one card you think will come next.',
    target: 'prediction-grid',
    action: 'guess'
  },
  {
    id: 'result_one',
    title: 'Read the reveal',
    body: 'The card appears in the purple slot. A correct prediction adds points and keeps momentum.',
    target: 'discard',
    action: 'next'
  },
  {
    id: 'guess_two',
    title: 'Try another prediction',
    body: 'Card counts changed after the draw. Use what remains to choose again.',
    target: 'prediction-grid',
    action: 'guess'
  },
  {
    id: 'logs_after_action',
    title: 'Check the feedback',
    body: 'The recent messages are held on screen now, so you can see what your last action triggered.',
    target: 'logs',
    action: 'next'
  },
  {
    id: 'guess_three',
    title: 'Play one more turn',
    body: 'Make another prediction. Combos can add more active decks after repeated hits.',
    target: 'prediction-grid',
    action: 'guess'
  },
  {
    id: 'status',
    title: 'Watch your run',
    body: 'Score, best score, precision, level and cards update as the deck goes down.',
    target: 'hud',
    action: 'next'
  },
  {
    id: 'done',
    title: 'You are ready',
    body: 'Keep playing until the deck is empty. Replay the tutorial from Home whenever you want.',
    target: 'controls',
    action: 'finish'
  }
]

export function getTutorialStep(stepId) {
  return TUTORIAL_STEPS.find((step) => step.id === stepId) || TUTORIAL_STEPS[0]
}

export function getNextTutorialStepId(stepId) {
  const index = TUTORIAL_STEPS.findIndex((step) => step.id === stepId)
  return TUTORIAL_STEPS[Math.min(index + 1, TUTORIAL_STEPS.length - 1)]?.id || TUTORIAL_STEPS[0].id
}

export function isTutorialDisabled(settings) {
  return settings?.disabled === true
}
