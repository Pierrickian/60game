import { GameEngine } from './engine/GameEngine'
import { levelConfigs, levelsRegistry } from './engine/contentLoaders'

const root = document.querySelector('#app')

const PARTICLES = Array.from({ length: 18 }, (_, index) => ({
  id: index,
  left: Math.round(Math.random() * 100),
  top: Math.round(Math.random() * 100),
  delay: (Math.random() * 5).toFixed(2),
  size: Math.round(2 + Math.random() * 4)
}))

const difficultyClass = {
  'Super Easy': 'difficulty-super-easy',
  Easy: 'difficulty-easy',
  Medium: 'difficulty-medium',
  Hard: 'difficulty-hard'
}

function getLevels() {
  return levelsRegistry.levels.map(({ id }) => ({ id, ...levelConfigs[id] })).filter((level) => level.id)
}

function playTapFeedback(isWin) {
  if (navigator.vibrate) navigator.vibrate(isWin ? [18, 24, 18] : 10)
}

function renderParticles() {
  return PARTICLES.map((particle) => `
    <span class="sparkle" style="left:${particle.left}%; top:${particle.top}%; animation-delay:${particle.delay}s; width:${particle.size}px; height:${particle.size}px;"></span>
  `).join('')
}

function renderCardFace(card, extraClass = '') {
  if (!card) return `<div class="play-card empty-card ${extraClass}"><span class="revealed-value">?</span></div>`
  return `<div class="play-card theme-${card.theme} ${extraClass}"><span class="corner top-left">${card.label}</span><span class="revealed-value">${card.label}</span><span class="card-gem">${card.gem}</span><span class="corner bottom-right">${card.label}</span></div>`
}

function renderHome(selectedLevelId = levelsRegistry.startingLevel) {
  const levels = getLevels()

  root.innerHTML = `
    <main class="app-shell home-shell level-select-shell">
      <div class="ambient-layer">${renderParticles()}</div>
      <section class="hero-card level-selector animated-in">
        <p class="eyebrow">60game</p>
        <h1>Choose Level</h1>
        <div class="level-grid">
          ${levels.map((level) => {
            const cardsPreview = Object.keys(level.startingDeck).filter((label) => label !== 'joker').join(' / ')
            const deckSize = Object.values(level.startingDeck).reduce((sum, amount) => sum + amount, 0)
            const jokerCount = level.startingDeck.joker ?? 0
            const difficulty = level.difficulty ?? 'Hard'
            const selected = level.id === selectedLevelId
            return `
              <button class="level-card interactive-card ${difficultyClass[difficulty] ?? 'difficulty-hard'} ${selected ? 'selected-level' : ''}" data-level-id="${level.id}">
                <div class="level-card-top"><strong>${level.name}</strong><span>${difficulty}</span></div>
                <div class="level-card-meta"><small>${deckSize} cards</small><small>${jokerCount} jokers</small></div>
                <p>${cardsPreview}</p>
              </button>
            `
          }).join('')}
        </div>
      </section>
    </main>
  `

  document.querySelectorAll('[data-level-id]').forEach((button) => {
    button.addEventListener('click', () => {
      const levelId = button.dataset.levelId
      if (!levelId) return
      renderHome(levelId)
      window.setTimeout(() => startGame(levelId), 120)
    })
  })
}

function startGame(levelId = levelsRegistry.startingLevel) {
  const state = { engine: new GameEngine(levelId), score: 0, best: Number(localStorage.getItem('60game-best') || 0), pointsPopup: null, movingCard: null, hitBurst: false, scorePulse: false, isLocked: false }

  function render() {
    if (state.engine.isFinished()) {
      state.best = Math.max(state.best, state.score)
      localStorage.setItem('60game-best', String(state.best))
      root.innerHTML = `<main class="app-shell home-shell"><div class="ambient-layer">${renderParticles()}</div><section class="hero-card end-screen animated-in finale-card"><p class="eyebrow">Congrats!</p><h1>${state.score}</h1><p class="final-best">Best ${state.best}</p><button class="new-game-button" id="restart-button">New Game</button></section></main>`
      document.querySelector('#restart-button').addEventListener('click', () => renderHome(levelId))
      return
    }

    const cardTypes = state.engine.state.cardTypes
    const lastCardType = state.engine.state.lastCard

    root.innerHTML = `
      <main class="app-shell game-layout ${state.scorePulse ? 'score-hit' : ''}">
        <div class="ambient-layer">${renderParticles()}</div>
        <header class="top-hud"><div class="hud-stat score-stat"><span class="hud-icon">🏆</span><span class="hud-label">Score</span><strong>${state.score}</strong></div><div class="hud-stat best-stat"><span class="hud-icon">♛</span><span class="hud-label">Best</span><strong>${state.best}</strong></div><div class="hud-stat left-stat"><span class="hud-icon">★</span><span class="hud-label">Left</span><strong>${state.engine.state.deck.length}</strong></div></header>
        <section class="mini-info-row"><div class="mini-info"><span>Last</span><strong>${state.engine.state.lastCard ? state.engine.state.lastCard.label : '-'}</strong></div><div class="mini-info left-mini"><span>Cards</span><strong>${state.engine.state.deck.length}</strong></div></section>
        <section class="table-stage"><div class="card-zone deck-zone"><div class="glow-ring blue-ring"></div><div class="deck-stack floating"><div class="deck-card-3d deck-face"><span>60</span><small>GAME</small></div><div class="deck-card-3d layer-2"></div><div class="deck-card-3d layer-3"></div><div class="deck-shine"></div></div></div><div class="arc-trail ${state.movingCard ? 'trail-on' : ''}"></div><div class="card-zone discard-zone"><div class="glow-ring purple-ring ${state.hitBurst ? 'ring-hit' : ''}"></div><div class="discard-wrapper ${state.hitBurst ? 'impact-hit' : ''}">${renderCardFace(lastCardType, 'discard-card')}${state.pointsPopup ? `<div class="points-popup pop-anim">+${state.pointsPopup}</div><div class="star-burst burst-anim"></div>` : ''}</div></div>${state.movingCard ? `<div class="moving-card travel-card theme-${state.movingCard.theme}"><span class="corner top-left">${state.movingCard.label}</span><span class="revealed-value">${state.movingCard.label}</span><span class="card-gem">${state.movingCard.gem}</span><span class="corner bottom-right">${state.movingCard.label}</span></div>` : ''}</section>
        <section class="guess-grid">${cardTypes.map((card) => `<button class="guess-button arcade-button theme-${card.theme}" data-guess="${card.label}" ${state.isLocked ? 'disabled' : ''}><span class="button-label">${card.label}</span><span class="button-gem">${card.gem}</span><span class="remaining-text">${state.engine.state.remainingCounts[card.label] ?? 0} LEFT</span></button>`).join('')}</section>
      </main>`

    document.querySelectorAll('[data-guess]').forEach((button) => {
      button.addEventListener('click', () => {
        if (state.isLocked) return
        const guess = button.dataset.guess
        state.isLocked = true
        state.movingCard = state.engine.state.deck[0] || null
        state.pointsPopup = null
        state.hitBurst = false
        state.scorePulse = false
        render()
        setTimeout(() => {
          const resolution = state.engine.draw(guess)
          const isWin = Boolean(resolution?.isWin)
          state.movingCard = null
          state.hitBurst = true
          state.score = state.engine.state.score
          if (isWin && resolution) {
            state.pointsPopup = resolution.pointsAwarded
            state.scorePulse = true
          }
          playTapFeedback(isWin)
          state.isLocked = false
          render()
          setTimeout(() => {
            state.hitBurst = false
            state.scorePulse = false
            state.pointsPopup = null
            render()
          }, 760)
        }, 600)
      })
    })
  }

  render()
}

renderHome()
