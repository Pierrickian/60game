export const TUTORIAL_STORAGE_KEY = '60game-tutorial-settings'

export const TUTORIAL_TEXT = {
  homeTitle: 'Tutorial',
  homeStart: 'Start tutorial',
  homeHint: 'Launch a guided run before playing freely.',
  pause: 'Tutorial',
  waiting: 'Your turn…',
  next: 'Next',
  finish: 'Play',
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
    id: 'guess_win',
    title: 'Make a winning prediction',
    body: 'Tap the highlighted card. This illustrates a good prediction and the reward feedback.',
    target: 'prediction-grid',
    action: 'guess',
    outcome: 'win'
  },
  {
    id: 'result_win',
    title: 'Points pop on the reveal',
    body: 'The reveal shows the drawn card, and the point popup shows what was added to your score.',
    target: 'discard',
    action: 'next'
  },
  {
    id: 'guess_combo',
    title: 'Chain another success',
    body: 'Tap the highlighted card again. A second success creates a combo.',
    target: 'prediction-grid',
    action: 'guess',
    outcome: 'win'
  },
  {
    id: 'combo_multideck',
    title: 'Combo opens multidecks',
    body: 'The combo duplicates the active table. More decks mean a prediction can be checked in several places at once.',
    target: 'table',
    action: 'next'
  },
  {
    id: 'guess_loss',
    title: 'See a miss too',
    body: 'Tap the highlighted card. This illustrates a miss so you can see how a combo breaks.',
    target: 'prediction-grid',
    action: 'guess',
    outcome: 'loss'
  },
  {
    id: 'loss_result',
    title: 'Miss and combo break',
    body: 'A wrong prediction marks the reveal as a miss and collapses the combo back toward one deck.',
    target: 'discard',
    action: 'next'
  },
  {
    id: 'info_button',
    title: 'Recent messages',
    body: 'The i button opens the latest feedback when you want to review what just happened.',
    target: 'info-button',
    action: 'next'
  },
  {
    id: 'logs_after_action',
    title: 'Check the feedback',
    body: 'The recent messages are held on screen now, so you can see what your last action triggered.',
    target: 'logs',
    action: 'next'
  },
  {
    id: 'status',
    title: 'Star targets',
    body: 'The three cards show your Success, Score and Precision progress: the same three criteria used for stars.',
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
