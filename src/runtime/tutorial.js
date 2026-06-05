export const TUTORIAL_STORAGE_KEY = '60game-tutorial-settings'

export const TUTORIAL_HOME_KEYS = {
  homeTitle: 'home.tutorial.title',
  homeStart: 'home.tutorial.start',
  homeHint: 'home.tutorial.hint',
  pause: 'tutorial.pause',
  waiting: 'tutorial.waiting',
  next: 'tutorial.next',
  finish: 'tutorial.finish',
  close: 'tutorial.close'
}

export const TUTORIAL_STEPS = [
  {
    id: 'mode',
    titleKey: 'tutorial.mode.title',
    bodyKey: 'tutorial.mode.body',
    target: 'level-intro',
    action: 'choose-mode'
  },
  {
    id: 'table',
    titleKey: 'tutorial.table.title',
    bodyKey: 'tutorial.table.body',
    target: 'table',
    action: 'next'
  },
  {
    id: 'guess_win',
    titleKey: 'tutorial.guessWin.title',
    bodyKey: 'tutorial.guessWin.body',
    target: 'prediction-grid',
    action: 'guess',
    outcome: 'win'
  },
  {
    id: 'result_win',
    titleKey: 'tutorial.resultWin.title',
    bodyKey: 'tutorial.resultWin.body',
    target: 'discard',
    action: 'next'
  },
  {
    id: 'guess_combo',
    titleKey: 'tutorial.guessCombo.title',
    bodyKey: 'tutorial.guessCombo.body',
    target: 'prediction-grid',
    action: 'guess',
    outcome: 'win'
  },
  {
    id: 'combo_multideck',
    titleKey: 'tutorial.comboMultideck.title',
    bodyKey: 'tutorial.comboMultideck.body',
    target: 'table',
    action: 'next'
  },
  {
    id: 'guess_loss',
    titleKey: 'tutorial.guessLoss.title',
    bodyKey: 'tutorial.guessLoss.body',
    target: 'prediction-grid',
    action: 'guess',
    outcome: 'loss'
  },
  {
    id: 'loss_result',
    titleKey: 'tutorial.lossResult.title',
    bodyKey: 'tutorial.lossResult.body',
    target: 'discard',
    action: 'next'
  },
  {
    id: 'info_button',
    titleKey: 'tutorial.infoButton.title',
    bodyKey: 'tutorial.infoButton.body',
    target: 'info-button',
    action: 'next'
  },
  {
    id: 'logs_after_action',
    titleKey: 'tutorial.logsAfterAction.title',
    bodyKey: 'tutorial.logsAfterAction.body',
    target: 'logs',
    action: 'next'
  },
  {
    id: 'status',
    titleKey: 'tutorial.status.title',
    bodyKey: 'tutorial.status.body',
    target: 'hud',
    action: 'next'
  },
  {
    id: 'done',
    titleKey: 'tutorial.done.title',
    bodyKey: 'tutorial.done.body',
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
