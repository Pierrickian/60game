const root = document.querySelector('#app')

const CARD_TYPES = [
  { label: '2', value: 2, count: 30 },
  { label: '5', value: 5, count: 12 },
  { label: '10', value: 10, count: 6 },
  { label: '15', value: 15, count: 4 },
  { label: '20', value: 20, count: 3 },
  { label: '30', value: 30, count: 2 },
  { label: '60', value: 60, count: 1 },
  { label: 'JOKER', value: 0, count: 2 }
]

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

function renderHome() {
  root.innerHTML = `
    <main class="app-shell">
      <button class="hero-card interactive-card pulse-card" id="start-button">
        <p class="eyebrow">60game</p>
        <h1>Card game playground</h1>
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
    lastCard: null,
    pointsPopup: null
  }

  function render() {
    if (state.deck.length === 0) {
      root.innerHTML = `
        <main class="app-shell">
          <section class="hero-card end-screen animated-in">
            <p class="eyebrow">Congrats!</p>
            <h1>${state.score}</h1>
            <button class="guess-button" id="restart-button">Replay</button>
          </section>
        </main>
      `

      document.querySelector('#restart-button').addEventListener('click', startGame)

      return
    }

    root.innerHTML = `
      <main class="app-shell game-layout">
        <div class="hud-row">
          <div class="hud-pill score-big">${state.score}</div>
          <div class="hud-pill">${state.deck.length} left</div>
        </div>

        <section class="table-layout">
          <div class="table-center">
            <div class="deck-stack floating">
              <div class="deck-card-3d"></div>
              <div class="deck-card-3d layer-2"></div>
              <div class="deck-card-3d layer-3"></div>
            </div>

            <div class="discard-wrapper">
              <div class="discard-card revealed flip-in">
                ${state.lastCard ? state.lastCard.label : '?'}
              </div>

              ${state.pointsPopup ? `
                <div class="points-popup pop-anim">
                  +${state.pointsPopup}
                </div>
              ` : ''}
            </div>
          </div>

          <div class="guess-grid compact-grid">
            ${CARD_TYPES.map((card) => `
              <button class="guess-button arcade-button" data-guess="${card.label}">
                <span class="remaining-badge">
                  ${countRemaining(state.deck, card.label)}
                </span>
                <span>${card.label}</span>
              </button>
            `).join('')}
          </div>
        </section>
      </main>
    `

    document.querySelectorAll('[data-guess]').forEach((button) => {
      button.addEventListener('click', () => {
        const guess = button.dataset.guess
        const drawnCard = state.deck.shift()

        state.lastCard = drawnCard
        state.discard.push(drawnCard)

        if (guess === drawnCard.label) {
          state.score += drawnCard.value
          state.pointsPopup = drawnCard.value
        } else {
          state.pointsPopup = null
        }

        render()

        if (state.pointsPopup) {
          setTimeout(() => {
            state.pointsPopup = null
            render()
          }, 900)
        }
      })
    })
  }

  render()
}

renderHome()
