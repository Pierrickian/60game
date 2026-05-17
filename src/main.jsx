import React, { useMemo, useState } from 'react'
import ReactDOM from 'react-dom/client'
import { AnimatePresence, motion } from 'framer-motion'
import './style.css'
import './bet.css'

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
  const cards = CARD_TYPES.flatMap((type) => Array.from({ length: type.count }, (_, index) => ({ ...type, id: `${type.label}-${index}` })))
  for (let i = cards.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[cards[i], cards[j]] = [cards[j], cards[i]]
  }
  return cards
}

const countRemaining = (deck, label) => deck.filter((card) => card.label === label).length
const getCardType = (label) => CARD_TYPES.find((card) => card.label === label)

function Stat({ tone, icon, label, value }) {
  return <div className={`stat-card ${tone}`}><span className="stat-icon">{icon}</span><span className="stat-label">{label}</span><strong>{value}</strong></div>
}

function DeckStack({ remaining }) {
  return <div className="deck-zone"><div className="plate plate-blue" /><div className="deck-stack"><div className="deck-shadow-card card-layer-4" /><div className="deck-shadow-card card-layer-3" /><div className="deck-shadow-card card-layer-2" /><div className="deck-back"><span className="deck-logo">60</span><span className="deck-subtitle">GAME</span><small>{remaining}</small></div></div></div>
}

function FaceCard({ card, empty = false }) {
  if (!card || empty) return <div className="face-card empty-face"><strong>?</strong></div>
  return <div className={`face-card theme-${card.theme}`}><strong>{card.label}</strong><span className="face-icon">{card.icon}</span></div>
}

function DiscardPile({ card, won, points }) {
  return <div className="discard-zone"><div className="plate plate-purple" /><div className={`discard-card-wrap ${won ? 'impact-lite' : ''}`}><FaceCard card={card} empty={!card} /><AnimatePresence>{points ? <motion.div className="gain-pop" initial={{ opacity: 0, y: 20, scale: 0.75 }} animate={{ opacity: 1, y: -34, scale: 1 }} exit={{ opacity: 0, y: -56, scale: 1 }} transition={{ duration: 0.28 }}>+{points}</motion.div> : null}</AnimatePresence></div></div>
}

function PredictionCard({ card, index, remaining, onGuess }) {
  return <motion.button className={`prediction-card theme-${card.theme}`} disabled={remaining <= 0} onClick={() => onGuess(card.label, index)} whileTap={{ scale: 0.96 }}><span className="prediction-value">{card.label}</span><span className="prediction-icon">{card.icon}</span><span className="prediction-left">{remaining} LEFT</span></motion.button>
}

function FlyingCard({ card }) {
  return <motion.div className="flying-card" initial={{ x: '-34vw', y: 18, rotate: -14, scale: 0.74, opacity: 0.98 }} animate={{ x: '34vw', y: -18, rotate: 10, scale: 0.9, opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.42, ease: 'easeOut' }}><FaceCard card={card} /></motion.div>
}

function BetClone({ bet }) {
  const col = bet.buttonIndex % 4
  const row = Math.floor(bet.buttonIndex / 4)
  const startX = `${(col - 1.5) * 24}vw`
  const startY = `${36 + row * 9}dvh`
  const animate = bet.result === 'win'
    ? { x: '24vw', y: ['18dvh', '12dvh', '18dvh'], rotate: [-4, 4, -2], scale: [0.78, 0.94, 0.82], opacity: 1 }
    : bet.result === 'loss'
      ? { x: '24vw', y: '38dvh', rotate: 28, scale: 0.64, opacity: 0 }
      : { x: '24vw', y: '18dvh', rotate: -2, scale: 0.78, opacity: 1 }
  return <motion.div className={`bet-clone theme-${bet.card.theme} bet-${bet.result}`} initial={{ x: startX, y: startY, scale: 0.66, opacity: 0.94 }} animate={animate} exit={{ opacity: 0, scale: 0.45 }} transition={{ duration: bet.result === 'pending' ? 0.34 : 0.5, ease: 'easeOut' }}><span>{bet.card.label}</span><small>{bet.card.icon}</small></motion.div>
}

function App() {
  const [started, setStarted] = useState(false)
  const [deck, setDeck] = useState(() => buildDeck())
  const [discard, setDiscard] = useState([])
  const [score, setScore] = useState(0)
  const [best, setBest] = useState(() => Number(localStorage.getItem('60game-best') || 0))
  const [flyingCards, setFlyingCards] = useState([])
  const [bets, setBets] = useState([])
  const [points, setPoints] = useState(null)
  const [won, setWon] = useState(false)
  const lastCard = discard.at(-1)
  const remainingByType = useMemo(() => Object.fromEntries(CARD_TYPES.map((type) => [type.label, countRemaining(deck, type.label)])), [deck])

  function newGame() {
    setDeck(buildDeck()); setDiscard([]); setScore(0); setFlyingCards([]); setBets([]); setPoints(null); setWon(false); setStarted(true)
  }

  function guess(label, buttonIndex) {
    setDeck((currentDeck) => {
      if (currentDeck.length === 0) return currentDeck
      const [drawnCard, ...nextDeck] = currentDeck
      const isWin = label === drawnCard.label
      const id = `${drawnCard.id}-${currentDeck.length}-${buttonIndex}`
      const betId = `bet-${id}`
      setFlyingCards((cards) => [...cards, { ...drawnCard, flightId: id }])
      setBets((items) => [...items, { id: betId, card: getCardType(label), buttonIndex, result: 'pending' }])
      setPoints(null); setWon(false)
      if (navigator.vibrate) navigator.vibrate(isWin ? 18 : 8)
      setTimeout(() => {
        setDiscard((cards) => [...cards, drawnCard])
        setFlyingCards((cards) => cards.filter((card) => card.flightId !== id))
        setBets((items) => items.map((bet) => bet.id === betId ? { ...bet, result: isWin ? 'win' : 'loss' } : bet))
        setWon(isWin)
        if (isWin) {
          setScore((currentScore) => {
            const nextScore = currentScore + drawnCard.value
            setBest((currentBest) => { const nextBest = Math.max(currentBest, nextScore); localStorage.setItem('60game-best', String(nextBest)); return nextBest })
            return nextScore
          })
          setPoints(drawnCard.value)
        }
        setTimeout(() => { setPoints(null); setWon(false); setBets((items) => items.filter((bet) => bet.id !== betId)) }, 720)
      }, 460)
      return nextDeck
    })
  }

  const gameOver = started && deck.length === 0 && flyingCards.length === 0
  return <main className="game-shell"><div className="cinematic-bg" />{!started ? <button className="start-screen" onClick={newGame}><span>60game</span><strong>Card Arcade</strong><em>Tap to play</em></button> : gameOver ? <section className="end-screen"><span>Congrats!</span><strong>{score}</strong><em>Best {best}</em><button onClick={newGame}>New Game</button></section> : <><header className="top-stats"><Stat tone="gold" icon="🏆" label="Score" value={score} /><Stat tone="purple" icon="♛" label="Best" value={best} /><Stat tone="green" icon="★" label="Left" value={deck.length} /></header><section className="quick-info"><div><span>LAST</span><strong>{lastCard?.label || '-'}</strong></div><div><span>CARDS</span><strong>{deck.length}</strong></div></section><section className="play-stage"><DeckStack remaining={deck.length} /><div className={`arc-ribbon ${flyingCards.length > 0 ? 'active' : ''}`} /><DiscardPile card={lastCard} won={won} points={points} /><AnimatePresence>{flyingCards.map((card) => <FlyingCard key={card.flightId} card={card} />)}</AnimatePresence><AnimatePresence>{bets.map((bet) => <BetClone key={bet.id} bet={bet} />)}</AnimatePresence></section><section className="prediction-grid">{CARD_TYPES.map((card, index) => <PredictionCard key={card.label} card={card} index={index} remaining={remainingByType[card.label]} onGuess={guess} />)}</section></>}</main>
}

ReactDOM.createRoot(document.getElementById('app')).render(<App />)
