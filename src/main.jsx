import React, { useMemo, useState } from 'react'
import ReactDOM from 'react-dom/client'
import { AnimatePresence, motion } from 'framer-motion'
import './style.css'
import './bet.css'
import './combo.css'

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

const COMBO_LABELS = { 2: 'GREAT', 3: 'AMAZING', 4: 'IMPRESSIVE', 5: 'AWESOME' }
const countRemaining = (deck, label) => deck.filter((card) => card.label === label).length
const getCardType = (label) => CARD_TYPES.find((card) => card.label === label)
const comboText = (combo) => combo >= 6 ? 'GOD IS PLAYING' : COMBO_LABELS[combo]

function shuffle(cards) {
  const copy = [...cards]
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

function buildDeck() {
  return shuffle(CARD_TYPES.flatMap((type) => Array.from({ length: type.count }, (_, index) => ({ ...type, id: `${type.label}-${index}` }))))
}

function activeTableCount(combo) {
  if (combo < 2) return 1
  return Math.min(combo, 8)
}

function tableLayoutClass(count) {
  if (count <= 1) return 'tables-1'
  if (count <= 2) return 'tables-2'
  if (count <= 4) return 'tables-4'
  if (count <= 6) return 'tables-6'
  return 'tables-8'
}

function makeTables(mainCards, count, previousTables = []) {
  return Array.from({ length: count }, (_, index) => {
    const previous = previousTables[index]
    return {
      id: index === 0 ? 'main' : `combo-${index}`,
      isMain: index === 0,
      deck: index === 0 ? mainCards : shuffle(mainCards),
      lastCard: previous?.lastCard || null,
      lastHit: previous?.lastHit || false,
      lastMiss: previous?.lastMiss || false
    }
  })
}

function Stat({ tone, icon, label, value }) {
  return <div className={`stat-card ${tone}`}><span className="stat-icon">{icon}</span><span className="stat-label">{label}</span><strong>{value}</strong></div>
}

function ComboStatus({ combo, popup }) {
  return <div className={`combo-status ${popup === 'COMBO BREAK' ? 'combo-break' : ''}`}><span>{combo >= 2 ? `${activeTableCount(combo)} DECKS` : '1 DECK'}</span><AnimatePresence>{popup ? <motion.strong initial={{ opacity: 0, y: 12, scale: .84 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -18 }} transition={{ duration: .28 }}>{popup}</motion.strong> : null}</AnimatePresence></div>
}

function DeckStack({ remaining, isMain }) {
  return <div className="deck-zone"><div className="plate plate-blue" /><div className="deck-stack"><div className="deck-shadow-card card-layer-4" /><div className="deck-shadow-card card-layer-3" /><div className="deck-shadow-card card-layer-2" /><div className={`deck-back ${isMain ? 'primary-deck' : ''}`}><span className="deck-logo">60</span><span className="deck-subtitle">GAME</span>{isMain ? <small>{remaining}</small> : null}</div></div></div>
}

function FaceCard({ card, empty = false }) {
  if (!card || empty) return <div className="face-card empty-face"><strong>?</strong></div>
  return <div className={`face-card theme-${card.theme}`}><strong className={card.theme === 'joker' ? 'joker-face-text' : ''}>{card.label}</strong><span className="face-icon">{card.icon}</span></div>
}

function DiscardPile({ card, won, miss, points }) {
  const stateClass = won ? 'impact-lite' : miss ? 'miss-shake' : ''
  return <div className="discard-zone"><div className="plate plate-purple" /><div className={`discard-card-wrap ${stateClass}`}><FaceCard card={card} empty={!card} /><AnimatePresence>{points ? <motion.div className="gain-pop" initial={{ opacity: 0, y: 20, scale: 0.75 }} animate={{ opacity: 1, y: -34, scale: 1 }} exit={{ opacity: 0, y: -56, scale: 1 }} transition={{ duration: 0.28 }}>+{points}</motion.div> : null}</AnimatePresence></div></div>
}

function PredictionCard({ card, index, remaining, onGuess }) {
  return <motion.button className={`prediction-card theme-${card.theme} ${card.theme === 'joker' ? 'joker-prediction-card' : ''}`} disabled={remaining <= 0} onClick={() => onGuess(card.label, index)} whileTap={{ scale: 0.96 }}><span className="prediction-value">{card.label}</span><span className="prediction-icon">{card.icon}</span><span className="prediction-left">{remaining} LEFT</span></motion.button>
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

function TableSlot({ table }) {
  const points = table.lastHit && table.lastCard ? table.lastCard.value : null
  return <motion.div className={`combo-table ${table.isMain ? 'main-combo-table' : ''} ${table.lastMiss ? 'combo-table-miss' : ''}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: .18 }}><DeckStack remaining={table.deck.length} isMain={table.isMain} /><div className="arc-ribbon mini-ribbon" /><DiscardPile card={table.lastCard} won={table.lastHit} miss={table.lastMiss} points={points} /></motion.div>
}

function App() {
  const [started, setStarted] = useState(false)
  const [tables, setTables] = useState(() => makeTables(buildDeck(), 1))
  const [combo, setCombo] = useState(0)
  const [score, setScore] = useState(0)
  const [best, setBest] = useState(() => Number(localStorage.getItem('60game-best') || 0))
  const [bets, setBets] = useState([])
  const [comboPopup, setComboPopup] = useState(null)
  const [resettingCombo, setResettingCombo] = useState(false)

  const mainTable = tables[0]
  const mainDeck = mainTable.deck
  const lastCard = mainTable.lastCard
  const remainingByType = useMemo(() => Object.fromEntries(CARD_TYPES.map((type) => [type.label, countRemaining(mainDeck, type.label)])), [mainDeck])

  function newGame() {
    setTables(makeTables(buildDeck(), 1)); setCombo(0); setScore(0); setBets([]); setComboPopup(null); setResettingCombo(false); setStarted(true)
  }

  function guess(label, buttonIndex) {
    if (resettingCombo) return
    setTables((currentTables) => {
      if (currentTables[0].deck.length === 0) return currentTables
      const betId = `bet-${Date.now()}-${buttonIndex}`
      const revealedTables = currentTables.map((table) => {
        const sourceDeck = table.deck.length > 0 ? table.deck : shuffle(currentTables[0].deck)
        const [drawnCard, ...nextDeck] = sourceDeck
        const hit = drawnCard?.label === label
        return { ...table, deck: nextDeck, lastCard: drawnCard, lastHit: hit, lastMiss: !hit }
      })
      const hits = revealedTables.filter((table) => table.lastHit && table.lastCard)
      const isWin = hits.length > 0
      const nextCombo = isWin ? combo + 1 : 0
      const popup = isWin ? comboText(nextCombo) : combo > 0 ? 'COMBO BREAK' : null
      const referenceTable = hits[0] || revealedTables[0]
      const referenceDeck = referenceTable.deck
      const roundPoints = hits.reduce((total, table) => total + (table.lastCard?.value || 0), 0)
      const nextCount = activeTableCount(nextCombo)

      setBets((items) => [...items, { id: betId, card: getCardType(label), buttonIndex, result: 'pending' }])
      setTimeout(() => setBets((items) => items.map((bet) => bet.id === betId ? { ...bet, result: isWin ? 'win' : 'loss' } : bet)), 160)
      setTimeout(() => setBets((items) => items.filter((bet) => bet.id !== betId)), 780)
      setComboPopup(popup)
      if (navigator.vibrate) navigator.vibrate(isWin ? 18 : 8)

      if (isWin) {
        setCombo(nextCombo)
        setScore((currentScore) => {
          const nextScore = currentScore + roundPoints
          setBest((currentBest) => { const nextBest = Math.max(currentBest, nextScore); localStorage.setItem('60game-best', String(nextBest)); return nextBest })
          return nextScore
        })
        setTimeout(() => setComboPopup(null), 900)
        return makeTables(referenceDeck, nextCount, [referenceTable, ...revealedTables.filter((table) => table !== referenceTable)])
      }

      setResettingCombo(true)
      setTimeout(() => {
        setCombo(0)
        setComboPopup(null)
        setResettingCombo(false)
        setTables(makeTables(referenceDeck, 1, [referenceTable]))
      }, combo > 0 ? 850 : 250)
      return revealedTables
    })
  }

  const gameOver = started && mainDeck.length === 0
  return <main className="game-shell"><div className="cinematic-bg" />{!started ? <button className="start-screen" onClick={newGame}><span>60game</span><strong>Card Arcade</strong><em>Tap to play</em></button> : gameOver ? <section className="end-screen"><span>Congrats!</span><strong>{score}</strong><em>Best {best}</em><button onClick={newGame}>New Game</button></section> : <><header className="top-stats"><Stat tone="gold" icon="🏆" label="Score" value={score} /><Stat tone="purple" icon="♛" label="Best" value={best} /><Stat tone="green" icon="★" label="Left" value={mainDeck.length} /></header><ComboStatus combo={combo} popup={comboPopup} /><section className="quick-info"><div><span>LAST</span><strong>{lastCard?.label || '-'}</strong></div><div><span>CARDS</span><strong>{mainDeck.length}</strong></div></section><section className={`play-stage multideck-stage ${tableLayoutClass(tables.length)}`}><AnimatePresence>{tables.map((table) => <TableSlot key={table.id} table={table} />)}</AnimatePresence><AnimatePresence>{bets.map((bet) => <BetClone key={bet.id} bet={bet} />)}</AnimatePresence></section><section className="prediction-grid">{CARD_TYPES.map((card, index) => <PredictionCard key={card.label} card={card} index={index} remaining={remainingByType[card.label]} onGuess={guess} />)}</section></>}</main>
}

ReactDOM.createRoot(document.getElementById('app')).render(<App />)
