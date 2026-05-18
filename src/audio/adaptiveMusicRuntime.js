import { createAdaptiveMusicSystem } from './adaptiveMusicSystem'

const PLAY_STAGE_SELECTOR = '.play-stage'
const WIN_SELECTOR = '.bet-clone.bet-win'
const LOSS_SELECTOR = '.bet-clone.bet-loss'
const FRONT_COMBO_SELECTOR = '.front-combo'
const BREAK_SELECTOR = '.combo-break-overlay'
const END_SCREEN_SELECTOR = '.end-screen'

let music = null
let started = false
let currentCombo = 0
let seenWinCount = 0
let seenLossCount = 0
let lastComboText = ''

function getMusic() {
  if (!music) music = createAdaptiveMusicSystem()
  return music
}

function readMultiplier(text) {
  const match = /x(\d+)/i.exec(text || '')
  return match ? Number(match[1]) : 0
}

function startMusic() {
  if (started) return
  started = true
  const audio = getMusic()
  audio.start()
  audio.setIntensity(0)
}

function syncComboOverlay(root) {
  const comboNode = root.querySelector(FRONT_COMBO_SELECTOR)
  if (!comboNode) return

  const comboText = comboNode.textContent || ''
  if (comboText === lastComboText) return

  lastComboText = comboText
  const multiplier = readMultiplier(comboText)
  if (multiplier > 0) {
    currentCombo = multiplier
    getMusic().setIntensity(Math.min(4, multiplier))
  }
}

function syncBreakOverlay(root) {
  const breakNode = root.querySelector(BREAK_SELECTOR)
  if (!breakNode) return

  const previousCombo = readMultiplier(breakNode.textContent || '')
  currentCombo = 0
  getMusic().onFailure(previousCombo)
  getMusic().setIntensity(previousCombo >= 2 ? 1 : 0)
}

function syncBetResults(root) {
  const wins = root.querySelectorAll(WIN_SELECTOR).length
  const losses = root.querySelectorAll(LOSS_SELECTOR).length

  if (wins > seenWinCount) {
    startMusic()
    currentCombo += 1
    getMusic().onSuccess(currentCombo)
    getMusic().setIntensity(Math.min(4, currentCombo))
  }

  if (losses > seenLossCount) {
    startMusic()
    getMusic().onFailure(currentCombo)
    getMusic().setIntensity(currentCombo >= 2 ? 1 : 0)
    currentCombo = 0
  }

  seenWinCount = wins
  seenLossCount = losses
}

function syncEndScreen(root) {
  if (!root.querySelector(END_SCREEN_SELECTOR)) return
  getMusic().setIntensity(1)
}

function syncFromDom() {
  const root = document.getElementById('app') || document.body
  syncBetResults(root)
  syncComboOverlay(root)
  syncBreakOverlay(root)
  syncEndScreen(root)
}

function resetTransientCounters() {
  seenWinCount = 0
  seenLossCount = 0
  lastComboText = ''
}

function installAdaptiveMusicRuntime() {
  const root = document.getElementById('app') || document.body
  const observer = new MutationObserver(() => {
    syncFromDom()
    const stage = document.querySelector(PLAY_STAGE_SELECTOR)
    if (!stage) resetTransientCounters()
  })

  window.addEventListener('pointerdown', startMusic, { once: true, passive: true })
  window.addEventListener('keydown', startMusic, { once: true })
  observer.observe(root, { childList: true, subtree: true, characterData: true })
}

installAdaptiveMusicRuntime()
