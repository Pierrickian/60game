import React, { useEffect, useMemo, useRef, useState } from 'react'
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

function useCanvasFx() {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const context = canvas.getContext('2d')
    const particles = Array.from({ length: 48 }, () => ({
      x: Math.random(),
      y: Math.random(),
      r: 0.8 + Math.random() * 2.4,
      speed: 0.0004 + Math.random() * 0.0012,
      alpha: 0.16 + Math.random() * 0.5
    }))

    let animationFrame = 0

    function resize() {
      canvas.width = window.innerWidth * window.devicePixelRatio
      canvas.height = window.innerHeight * window.devicePixelRatio
    }

    function draw() {
      context.clearRect(0, 0, canvas.width, canvas.height)

      particles.forEach((particle) => {
        particle.y -= particle.speed
        if (particle.y < -0.05) particle.y = 1.05

        const x = particle.x * canvas.width
        const y = particle.y * canvas.height
        const gradient = context.createRadialGradient(x, y, 0, x, y, particle.r * 8)
        gradient.addColorStop(0, `rgba(255, 226, 120, ${particle.alpha})`)
        gradient.addColorStop(1, 'rgba(120, 90, 255, 0)')

        context.fillStyle = gradient
        context.beginPath()
        context.arc(x, y, particle.r * 8, 0, Math.PI * 2)
        context.fill()
      })

      animationFrame = requestAnimationFrame(draw)
    }

    resize()
    draw()
    window.addEventListener('resize', resize)

    return () => {
      cancelAnimationFrame(animationFrame)
      window.removeEventListener('resize', resize)
    }
  }, [])

  return canvasRef
}

function Stat({ tone, icon, label, value }) {
  return (
    <motion.div className={`stat-card ${tone}`} layout>
      <span className="stat-icon">{icon}</span>
      <span className="stat-label">{label}</span>
      <motion.strong key={value} initial={{ scale: 0.72 }} animate={{ scale: 1 }}>
        {value}
      </motion.strong>
    </motion.div>
  )
}

function DeckStack({ remaining }) {
  return (
    <div className="deck-zone">
      <div className="plate plate-blue" />
      <motion.div
        className="deck-stack"
        animate={{ y: [0, -8, 0], rotateZ: [-1, 1, -1] }}
        transition={{ repeat: Infinity, duration: 3.2, ease: 'easeInOut' }}
      >
        <div className="deck-shadow-card card-layer-3" />
        <div className="deck-shadow-card card-layer-2" />
        <div className="deck-back">
          <div className="card-border" />
          <span className="deck-logo">60</span>
          <span className="deck-subtitle">GAME</span>
          <small>{remaining}</small>
        </div>
      </motion.div>
    </div>
  )
}

function FaceCard({ card, empty = false }) {
  if (!card || empty) {
    return (
      <div className="face-card empty-face">
        <strong>?</strong>
      </div>
    )
  }

  return (
    <div className={`face-card theme-${card.theme}`}>
      <span className="face-corner top">{card.label}</span>
      <strong>{card.label}</strong>
      <span className="face-icon">{card.icon}</span>
      <span className="face-corner bottom">{card.label}</span>
    </div>
  )
}

function DiscardPile({ card, won, points }) {
  return (
    <div className="discard-zone">
      <div className="plate plate-purple" />
      <motion.div
        className="discard-card-wrap"
        animate={won ? { scale: [1, 1.08, 1] } : { scale: 1 }}
        transition={{ duration: 0.38 }}
      >
        <FaceCard card={card} empty={!card} />
        <AnimatePresence>
          {points ? (
            <motion.div
              className="gain-pop"
              initial={{ opacity: 0, y: 30, scale: 0.45 }}
              animate={{ opacity: 1, y: -44, scale: 1 }}
              exit={{ opacity: 0, y: -88, scale: 1.15 }}
              transition={{ duration: 0.42 }}
            >
              +{points}
            </motion.div>
          ) : null}
        </AnimatePresence>
      </motion.div>
    </div>
  )
}

function PredictionCard({ card, remaining, disabled, onGuess }) {
  return (
    <motion.button
      className={`prediction-card theme-${card.theme}`}
      disabled={disabled || remaining <= 0}
      onClick={() => onGuess(card.label)}
      whileTap={{ scale: 0.94 }}
      whileHover={{ scale: 1.03, y: -4 }}
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
      initial={{ x: '-38vw', y: 30, rotate: -18, scale: 0.72, opacity: 0.98 }}
      animate={{ x: '36vw', y: -36, rotate: 12, scale: 0.96, opacity: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.58, ease: [0.2, 0.85, 0.25, 1] }}
    >
      <FaceCard card={card} />
    </motion.div>
  )
}

function App() {
  const canvasRef = useCanvasFx()
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

    if (navigator.vibrate) navigator.vibrate(isWin ? [18, 24, 18] : 10)

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
      }, 720)
    }, 610)
  }

  const gameOver = started && deck.length === 0 && !flyingCard

  return (
    <main className="game-shell">
      <canvas ref={canvasRef} className="fx-canvas" />
      <div className="cinematic-bg" />

      {!started ? (
        <motion.button
          className="start-screen"
          onClick={newGame}
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <span>60game</span>
          <strong>Card Arcade</strong>
          <em>Tap to play</em>
        </motion.button>
      ) : gameOver ? (
        <motion.section className="end-screen" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <span>Congrats!</span>
          <strong>{score}</strong>
          <em>Best {best}</em>
          <button onClick={newGame}>New Game</button>
        </motion.section>
      ) : (
        <>
          <header className="top-stats">
            <Stat tone="gold" icon="🏆" label="Score" value={score} />
            <Stat tone="purple" icon="♛" label="Best" value={best} />
            <Stat tone="green" icon="★" label="Left" value={deck.length} />
          </header>

          <section className="quick-info">
            <div><span>LAST CARD</span><strong>{lastCard?.label || '-'}</strong></div>
            <div><span>CARDS LEFT</span><strong>{deck.length}</strong></div>
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
