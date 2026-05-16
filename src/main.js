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

function renderHome() {
  root.innerHTML = `
    <main class="app-shell">
      <button class="hero-card interactive-card" id="start-button">
        <p class="eyebrow">60game</p>
        <h1>Card game playground</h1>
        <p class="description">
          Clique pour démarrer la partie.
        </p>
      </button>
    </main>
  `

  document
    .querySelector('#start-button')
    .addEventListener('click', startGame)
}

function startGame() {
  const state = {
    deck: buildDeck(),
    discard: [],
    score: 0,
    lastCard: null,
    message: 'Choisis une carte pour deviner la prochaine pioche.'
  }

  function render() {
    const remaining = state.deck.length

    if (remaining === 0) {
      root.innerHTML = `
        <main class="app-shell">
          <section class="hero-card end-screen">
            <p class="eyebrow">Congrats!</p>
            <h1>${state.score}</h1>
            <p class="description">Score final obtenu sur les 60 cartes.</p>
            <button class="guess-button" id="restart-button">
              Rejouer
            </button>
          </section>
        </main>
      `

      document
        .querySelector('#restart-button')
        .addEventListener('click', startGame)

      return
    }

    root.innerHTML = `
      <main class="app-shell game-layout">
        <section class="top-bar">
          <div class="score-panel">
            <span class="panel-label">Score</span>
            <strong>${state.score}</strong>
          </div>

          <div class="score-panel">
            <span class="panel-label">Pioche restante</span>
            <strong>${remaining}</strong>
          </div>
        </section>

        <section class="board-layout">
          <div class="deck-zone">
            <div class="deck-card">
              <span>Deck</span>
            </div>

            <div class="discard-zone">
              <div class="discard-card ${state.lastCard ? 'revealed' : ''}">
                ${state.lastCard ? state.lastCard.label : '?'}
              </div>
              <span class="discard-label">Défausse</span>
            </div>
          </div>

          <section class="controls-panel">
            <p class="description status-message">${state.message}</p>

            <div class="guess-grid">
              ${CARD_TYPES.map((card) => `
                <button class="guess-button" data-guess="${card.label}">
                  ${card.label}
                </button>
              `).join('')}
            </div>
          </section>
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
          state.message = `Bravo ! Tu as trouvé ${drawnCard.label} et gagné ${drawnCard.value} points.`
        } else {
          state.message = `Raté ! La carte était ${drawnCard.label}.`
        }

        render()
      })
    })
  }

  render()
}

renderHome()
