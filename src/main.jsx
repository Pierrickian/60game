import React, { useMemo, useState } from 'react'
import ReactDOM from 'react-dom/client'
import { AnimatePresence, motion } from 'framer-motion'
import './style.css'

const CARD_TYPES = [
  { label: '2', value: 2, count: 30, theme: 'green', icon: '◆' },
  { label: '5', value: 5, count: 12, theme: 'blue', icon: '◆' },
  { label: '10', value: 10, count: 6, theme: 'purple', icon: '◆' },
  { label: '15', value: 15, count: 4, theme: 'orange', icon: '◆' },
  { label: '20', value: 20, count: 3, theme: 'red', icon: '◆' },
  { label: '30', value: 30, count: 2, theme: 'cyan', icon: '◆' },
  { label: '60', value: 60, count: 1, theme: 'gold', icon: '◆' },
  { label: 'JOKER', value: 0, count: 2, theme: 'joker', icon: '♛' }
]

function buildDeck() {
  const cards = CARD_TYPES.flatMap((type) =>
    Array.from({ length: type.count }, (_, index) => ({
      ...type,
      id: `${type.label}-${index}-${Math.random().toString(36).slice(2)}`
    }))
  )

  for (let i = cards.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[cards[i], cards[j]] = [cards[j], cards[i]]
  }

  return cards
}

function countRemaining(deck, label) {
  return deck.filter((card) => card.label === label).length
}

function Stat({ tone, icon, label, value }) {
  return (
    <div className={`stat-card ${tone}`}>
      <span className="stat-icon">{icon}</span>
      <span className="stat-label">{label}</span>
      <strong>{value}</strong>
    </div>
  )
}

function DeckStack({ remaining }) {
  return (
    <div className="deck-zone">
      <div className="plate plate-blue" />
      <div className="deck-stack">
        <div className="deck-shadow-card card-layer-4" />
        <div className="deck-shadow-card card-layer-3" />
        <div className="deck-shadow-card card-layer-2" />
        <div className="deck-back">
          <span className="deck-logo">60</span>
          <span className="deck-subtitle">GAME</span>
          <small>{remaining}</small>
        </div>
      </div>
    </div>
  )
}

function FaceCard({ card, empty = false }) {
  if (!card || empty) {
    return <div className="face-card empty-face"><strong>?</strong></div>
  }

  return (
    <div className={`face-card theme-${card.theme}`}>
      <strong>{card.label}</strong>
      <span className="face-icon">{card.icon}</span>
    </div>
  )
}

function DiscardPile({ card, won, points }) {
  return (
    <div className="discard-zone">
      <div className="plate plate-purple" />
      <div className={`discard-card-wrap ${won ? 'impact-lite' : ''}`}>
        <FaceCard card={card} empty={!card} />
        <AnimatePresence>
          {points ? (
            <motion.div
              className="gain-pop"
              initial={{ opacity: 0, y: 20, scale: 0.75 }}
              animate={{ opacity: 1, y: -34, scale: 1 }}
              exit={{ opacity: 0, y: -56, scale: 1 }}
              transition={{ duration: 0.28 }}
            >
              +{points}
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    </div>
  )
}

function PredictionCard({ card, remaining, disabled, onGuess }) {
  return (
    <motion.button
      className={`prediction-card theme-${card.theme}`}
      disabled={disabled || remaining <= 0}
      onClick={() => onGuess(card.label)}
      whileTap={{ scale: 0.96 }}
    >
      <span className="prediction-value">{card.label}</span>
      <span className="prediction-icon">{card.icon}</span>
      <span className="prediction-left">{remaining} LEFT</span>
    </motion.button>
  )
}

function FlyingCard({ card }) {
  if (!card) return null

  return (
    <motion.div
      key={card.id}
      className="flying-card"
      initial={{ x: '-34vw', y: 18, rotate: -14, scale: 0.74, opacity: 0.98 }}
      animate={{ x: '34vw', y: -18, rotate: 10, scale: 0.9, opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.42, ease: 'easeOut' }}
    >
      <FaceCard card={card} />
    </motion.div>
  )
}

function App() {
  const [started, setStarted] = useState(false)
  const [deck, setDeck] = useState(() => buildDeck())
  const [discard, setDiscard] = useState([])
  const [score, setScore] = useState(0)
  const [best, setBest] = useState(() => Number(localStorage.getItem('60game-best') || 0))
  const [flyingCard, setFlyingCard] = useState(null)
  const [points, setPoints] = useState(null)
  const [won, setWon] = useState(false)
  const [locked, setLocked] = useState(false)

  const lastCard = discard.at(-1)
  const remainingByType = useMemo(() => {
    return Object.fromEntries(CARD_TYPES.map((type) => [type.label, countRemaining(deck, type.label)]))
  }, [deck])

  function newGame() {
    setDeck(buildDeck())
    setDiscard([])
    setScore(0)
    setFlyingCard(null)
    setPoints(null)
    setWon(false)
    setLocked(false)
    setStarted(true)
  }

  function guess(label) {
    if (locked || deck.length === 0) return

    const [drawnCard, ...nextDeck] = deck
    const isWin = label === drawnCard.label

    setLocked(true)
    setDeck(nextDeck)
    setFlyingCard(drawnCard)
    setPoints(null)
    setWon(false)

    if (navigator.vibrate) navigator.vibrate(isWin ? 18 : 8)

    setTimeout(() => {
      setDiscard((cards) => [...cards, drawnCard])
      setFlyingCard(null)
      setWon(isWin)

      if (isWin) {
        const nextScore = score + drawnCard.value
        setScore(nextScore)
        setPoints(drawnCard.value)

        if (nextScore > best) {
          setBest(nextScore)
          localStorage.setItem('60game-best', String(nextScore))
        }
      }

      setLocked(false)

      setTimeout(() => {
        setPoints(null)
        setWon(false)
      }, 520)
    }, 460)
  }

  const gameOver = started && deck.length === 0 && !flyingCard

  return (
    <main className="game-shell">
      <div className="cinematic-bg" />

      {!started ? (
        <button className="start-screen" onClick={newGame}>
          <span>60game</span>
          <strong>Card Arcade</strong>
          <em>Tap to play</em>
        </button>
      ) : gameOver ? (
        <section className="end-screen">
          <span>Congrats!</span>
          <strong>{score}</strong>
          <em>Best {best}</em>
          <button onClick={newGame}>New Game</button>
        </section>
      ) : (
        <>
          <header className="top-stats">
            <Stat tone="gold" icon="🏆" label="Score" value={score} />
            <Stat tone="purple" icon="♛" label="Best" value={best} />
            <Stat tone="green" icon="★" label="Left" value={deck.length} />
          </header>

          <section className="quick-info">
            <div><span>LAST</span><strong>{lastCard?.label || '-'}</strong></div>
            <div><span>CARDS</span><strong>{deck.length}</strong></div>
          </section>

          <section className="play-stage">
            <DeckStack remaining={deck.length} />
            <div className={`arc-ribbon ${flyingCard ? 'active' : ''}`} />
            <DiscardPile card={lastCard} won={won} points={points} />
            <AnimatePresence>{flyingCard ? <FlyingCard card={flyingCard} /> : null}</AnimatePresence>
          </section>

          <section className="prediction-grid">
            {CARD_TYPES.map((card) => (
              <PredictionCard
                key={card.label}
                card={card}
                remaining={remainingByType[card.label]}
                disabled={locked}
                onGuess={guess}
              />
            ))}
          </section>
        </>
      )}
    </main>
  )
}

ReactDOM.createRoot(document.getElementById('app')).render(<App />)
