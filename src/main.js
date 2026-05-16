const root = document.querySelector('#app')

const CARD_TYPES = [
  { label: '2', value: 2, count: 30, theme: 'green', gem: '◆' },
  { label: '5', value: 5, count: 12, theme: 'blue', gem: '◆' },
  { label: '10', value: 10, count: 6, theme: 'purple', gem: '◆' },
  { label: '15', value: 15, count: 4, theme: 'orange', gem: '◆' },
  { label: '20', value: 20, count: 3, theme: 'red', gem: '◆' },
  { label: '30', value: 30, count: 2, theme: 'cyan', gem: '◆' },
  { label: '60', value: 60, count: 1, theme: 'gold', gem: '◆' },
  { label: 'JOKER', value: 0, count: 2, theme: 'black', gem: '♛' }
]

const PARTICLES = Array.from({ length: 22 }, (_, index) => ({
  id: index,
  left: Math.round(Math.random() * 100),
  top: Math.round(Math.random() * 100),
  delay: (Math.random() * 5).toFixed(2),
  size: Math.round(2 + Math.random() * 4)
}))

function shuffle(array) {
  const copy = [...array]

  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }

  return copy
}

function buildDeck() {
  const deck = []

  CARD_TYPES.forEach((card) => {
    for (let i = 0; i < card.count; i += 1) {
      deck.push({ ...card })
    }
  })

  return shuffle(deck)
}

function countRemaining(deck, label) {
  return deck.filter((card) => card.label === label).length
}

function getCardType(label) {
  return CARD_TYPES.find((card) => card.label === label)
}

function playTapFeedback(isWin) {
  if (navigator.vibrate) {
    navigator.vibrate(isWin ? [18, 30, 18] : 12)
  }
}

function renderParticles() {
  return PARTICLES.map((particle) => `
    <span
      class="sparkle"
      style="left:${particle.left}%; top:${particle.top}%; animation-delay:${particle.delay}s; width:${particle.size}px; height:${particle.size}px;"
    ></span>
  `).join('')
}

function renderHome() {
  root.innerHTML = `
    <main class="app-shell home-shell">
      <div class="ambient-layer">${renderParticles()}</div>
      <button class="hero-card interactive-card pulse-card" id="start-button">
        <p class="eyebrow">60game</p>
        <h1>Card Game</h1>
        <span class="start-chip">Tap to play</span>
      </button>
    </main>
  `

  document.querySelector('#start-button').addEventListener('click', startGame)
}

function startGame() {
  const state = {
    deck: buildDeck(),
    discard: [],
    score: 0,
    best: Number(localStorage.getItem('60game-best') || 0),
    lastCard: null,
    pointsPopup: null,
    movingCard: null,
    hitBurst: false,
    scorePulse: false,
    isLocked: false
  }

  function render() {
    if (state.deck.length === 0) {
      state.best = Math.max(state.best, state.score)
      localStorage.setItem('60game-best', String(state.best))

      root.innerHTML = `
        <main class="app-shell home-shell">
          <div class="ambient-layer">${renderParticles()}</div>
          <section class="hero-card end-screen animated-in finale-card">
            <p class="eyebrow">Congrats!</p>
            <h1>${state.score}</h1>
            <p class="final-best">Best ${state.best}</p>
            <button class="new-game-button" id="restart-button">New Game</button>
          </section>
        </main>
      `

      document.querySelector('#restart-button').addEventListener('click', startGame)
      return
    }

    const lastCard = state.lastCard || { label: '?', theme: 'neutral', gem: '◆' }
    const lastCardType = getCardType(lastCard.label) || lastCard

    root.innerHTML = `
      <main class="app-shell game-layout ${state.scorePulse ? 'score-hit' : ''}">
        <div class="ambient-layer">${renderParticles()}</div>

        <div class="hud-row premium-hud">
          <div class="hud-stat score-stat">
            <span class="hud-icon">🏆</span>
            <span class="hud-label">Score</span>
            <strong>${state.score}</strong>
          </div>

          <div class="hud-stat best-stat">
            <span class="hud-icon">♛</span>
            <span class="hud-label">Best</span>
            <strong>${state.best}</strong>
          </div>

          <div class="hud-stat left-stat">
            <span class="hud-icon">★</span>
            <span class="hud-label">Left</span>
            <strong>${state.deck.length}</strong>
          </div>
        </div>

        <section class="info-row">
          <div class="info-panel last-panel">
            <span>Last card</span>
            <strong>${state.lastCard ? state.lastCard.label : '-'}</strong>
          </div>
          <div class="info-panel left-panel">
            <span>Cards left</span>
            <strong>${state.deck.length}</strong>
          </div>
        </section>

        <section class="table-layout split-layout">
          <div class="table-half left-half">
            <div class="glow-ring blue-ring"></div>
            <div class="deck-stack floating">
              <div class="deck-card-3d deck-face"><span>60</span><small>GAME</small></div>
              <div class="deck-card-3d layer-2"></div>
              <div class="deck-card-3d layer-3"></div>
              <div class="deck-shine"></div>
            </div>
          </div>

          <div class="arc-trail ${state.movingCard ? 'trail-on' : ''}"></div>

          <div class="table-half right-half">
            <div class="glow-ring purple-ring ${state.hitBurst ? 'ring-hit' : ''}"></div>
            <div class="discard-wrapper fixed-discard ${state.hitBurst ? 'impact-hit' : ''}">
              <div class="discard-card solid-card theme-${lastCardType.theme}">
                <span class="corner top-left">${state.lastCard ? state.lastCard.label : ''}</span>
                <span class="revealed-value">${state.lastCard ? state.lastCard.label : '?'}</span>
                <span class="corner bottom-right">${state.lastCard ? state.lastCard.label : ''}</span>
              </div>

              ${state.pointsPopup ? `
                <div class="points-popup pop-anim">+${state.pointsPopup}</div>
                <div class="star-burst burst-anim"></div>
              ` : ''}
            </div>
          </div>

          ${state.movingCard ? `
            <div class="moving-card travel-card theme-${state.movingCard.theme}">
              <span class="corner top-left">${state.movingCard.label}</span>
              <span class="revealed-value">${state.movingCard.label}</span>
              <span class="corner bottom-right">${state.movingCard.label}</span>
            </div>
          ` : ''}
        </section>

        <div class="guess-grid big-grid">
          ${CARD_TYPES.map((card) => `
            <button class="guess-button arcade-button theme-${card.theme}" data-guess="${card.label}" ${state.isLocked ? 'disabled' : ''}>
              <span class="button-label">${card.label}</span>
              <span class="button-gem">${card.gem}</span>
              <span class="remaining-text">${countRemaining(state.deck, card.label)} left</span>
            </button>
          `).join('')}
        </div>

        <button class="new-game-button bottom-new-game" id="new-game-button">New Game</button>
      </main>
    `

    document.querySelector('#new-game-button').addEventListener('click', startGame)

    document.querySelectorAll('[data-guess]').forEach((button) => {
      button.addEventListener('click', () => {
        if (state.isLocked) return

        const guess = button.dataset.guess
        const drawnCard = state.deck.shift()

        state.isLocked = true
        state.movingCard = drawnCard
        state.pointsPopup = null
        state.hitBurst = false
        state.scorePulse = false
        render()

        setTimeout(() => {
          const isWin = guess === drawnCard.label

          state.lastCard = drawnCard
          state.discard.push(drawnCard)
          state.movingCard = null
          state.hitBurst = true

          if (isWin) {
            state.score += drawnCard.value
            state.pointsPopup = drawnCard.value
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
          }, 820)
        }, 620)
      })
    })
  }

  render()
}

renderHome()
