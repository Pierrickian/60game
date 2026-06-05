export const TUTORIAL_STORAGE_KEY = '60game-tutorial-settings'

export const TUTORIAL_TEXT = {
  homeTitle: 'Interactive tutorial',
  homeStart: 'Start tutorial',
  homeDisabled: 'Tutorial disabled',
  homeDisable: 'Disable tutorial',
  homeEnable: 'Enable tutorial',
  homeHint: 'Launch a guided run with pauses, then turn it off forever if you want.',
  homeEnableHint: 'Turn it back on to launch the guided run.',
  pause: 'Tutorial pause',
  waiting: 'Waiting for your action…',
  next: 'Next',
  finish: 'Finish',
  disableForever: 'Disable forever',
  close: 'Close tutorial'
}

export const TUTORIAL_STEPS = [
  {
    id: 'mode',
    title: '1 · Choose a mode',
    body: 'Pick Classic or More or less. The game is paused until you choose how this run starts.',
    target: 'level-intro',
    action: 'choose-mode'
  },
  {
    id: 'table',
    title: '2 · Read the table',
    body: 'The left stack is the deck. The right slot reveals the card you draw after each prediction.',
    target: 'table',
    action: 'next'
  },
  {
    id: 'prediction',
    title: '3 · Make a prediction',
    body: 'Tap one available card at the bottom. During this step, the tutorial waits for your prediction before continuing.',
    target: 'prediction-grid',
    action: 'guess'
  },
  {
    id: 'result',
    title: '4 · Follow the result',
    body: 'A hit scores the card value and grows your combo. A miss breaks the combo, but the run continues until the deck is empty.',
    target: 'discard',
    action: 'next'
  },
  {
    id: 'status',
    title: '5 · Watch the helpers',
    body: 'Score, best score, precision, card counts and logs update after every draw so you can adjust your next choice.',
    target: 'hud',
    action: 'next'
  },
  {
    id: 'done',
    title: 'Ready',
    body: 'The tutorial is complete. You can replay it from Home or disable it completely there.',
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
