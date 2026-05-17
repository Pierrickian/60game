import React, { useMemo, useRef, useState } from 'react'
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

function makeTables(mainCards, count, previousTables = [], mainId = 'main') {
  return Array.from({ length: count }, (_, index) => {
    const previous = previousTables[index]
    const id = previous?.id || (index === 0 ? 'main' : `combo-${index}`)
    const isMain = id === mainId || (!previousTables.some((table) => table.id === mainId) && index === 0)
    return {
      id,
      isMain,
      deck: isMain ? mainCards : shuffle(mainCards),
      lastCard: previous?.lastCard || null,
      lastHit: previous?.lastHit || false,
      lastMiss: previous?.lastMiss || false,
      revealId: previous?.revealId || 0,
      showCombo: false
    }
  })
}

function Stat({ tone, icon, label, value, bumpKey }) {
  return <motion.div key={`${label}-${bumpKey || 0}`} className={`stat-card ${tone}`} initial={{ scale: 1 }} animate={{ scale: bumpKey ? [1, 1.1, 1] : 1 }} transition={{ duration: .24 }}><span className="stat-icon">{icon}</span><span className="stat-label">{label}</span><strong>{value}</strong></motion.div>
}

function ComboStatus({ combo }) {
  return <div className="combo-status"><span>{combo >= 2 ? `${activeTableCount(combo)} DECKS` : '1 DECK'}</span></div>
}

function DeckStack({ remaining, isMain }) {
  return <div className="deck-zone"><div className="plate plate-blue" /><div className="deck-stack"><div className="deck-shadow-card card-layer-4" /><div className="deck-shadow-card card-layer-3" /><div className="deck-shadow-card card-layer-2" /><div className={`deck-back ${isMain ? 'primary-deck' : ''}`}><span className="deck-logo">60</span><span className="deck-subtitle">GAME</span>{isMain ? <small>{remaining}</small> : null}</div></div></div>
}

function FaceCard({ card, empty = false }) {
  if (!card || empty) return <div className="face-card empty-face"><strong>?</strong></div>
  return <div className={`face-card theme-${card.theme}`}><strong className={card.theme === 'joker' ? 'joker-face-text' : ''}>{card.label}</strong><span className="face-icon">{card.icon}</span></div>
}

function DiscardPile({ card, won, miss, points, revealId, showCombo }) {
  const stateClass = won ? 'impact-lite' : miss ? 'miss-shake' : ''
  return <div className="discard-zone"><div className="plate plate-purple" /><div className={`discard-card-wrap ${stateClass}`}><div key={revealId} className="discard-drop"><FaceCard card={card} empty={!card} /></div><AnimatePresence>{showCombo ? <motion.div className="local-combo-label" initial={{ opacity: 0, y: 14, scale: .7 }} animate={{ opacity: 1, y: -18, scale: 1 }} exit={{ opacity: 0, y: -32, scale: .8 }} transition={{ duration: .25 }}>COMBO</motion.div> : null}{points ? <motion.div className="gain-pop" initial={{ opacity: 0, y: 18, scale: .7 }} animate={{ opacity: 1, y: -36, scale: [1, 1.15, 1] }} exit={{ opacity: 0, y: -58, scale: .85 }} transition={{ duration: .36 }}>+{points}</motion.div> : null}</AnimatePresence></div></div>
}

function PredictionCard({ card, index, remaining, onGuess }) {
  const unavailable = remaining <= 0
  function handlePress(event) {
    if (unavailable) {
      event.preventDefault()
      if (navigator.vibrate) navigator.vibrate([90, 35, 90])
      return
    }
    onGuess(card.label, index)
  }
  return <motion.button className={`prediction-card theme-${card.theme} ${card.theme === 'joker' ? 'joker-prediction-card' : ''}`} aria-disabled={unavailable} onClick={handlePress} whileTap={{ scale: unavailable ? 1 : 0.96 }}><span className="prediction-value">{card.label}</span><span className="prediction-icon">{card.icon}</span><span className="prediction-left">{remaining} LEFT</span></motion.button>
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
  return <motion.div className={`bet-clone theme-${bet.card.theme} bet-${bet.result}`} initial={{ x: startX, y: startY, scale: 0.66, opacity: 0.94 }} animate={animate} exit={{ opacity: 0, scale: 0.45 }} transition={{ duration: bet.result === 'pending' ? 0.18 : 0.32, ease: 'easeOut' }}><span>{bet.card.label}</span><small>{bet.card.icon}</small></motion.div>
}

function TableSlot({ table }) {
  const points = table.lastHit && table.lastCard ? table.lastCard.value : null
  return <motion.div className={`combo-table ${table.isMain ? 'main-combo-table' : ''} ${table.lastMiss ? 'combo-table-miss' : ''}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: .1 }}><DeckStack remaining={table.deck.length} isMain={table.isMain} /><div className="arc-ribbon mini-ribbon" /><DiscardPile card={table.lastCard} won={table.lastHit} miss={table.lastMiss} points={points} revealId={table.revealId} showCombo={table.showCombo} /></motion.div>
}

function ComboBreakOverlay({ breakFx }) {
  if (!breakFx) return null
  return <motion.div className="combo-break-overlay" initial={{ opacity: 0, y: 26, scale: .68 }} animate={{ opacity: 1, y: 0, scale: [1, 1.06, 1] }} exit={{ opacity: 0, y: -34, scale: .88 }} transition={{ duration: .34 }}><strong>COMBO BREAK</strong><motion.span initial={{ color: '#ffdf38' }} animate={{ color: '#ff3f1f' }} transition={{ duration: 2.48 }}>x{breakFx.from} → x0</motion.span></motion.div>
}

function EndPanel({ score, best, stats, onPlay }) {
  return <section className="end-screen session-panel"><span>Congrats!</span><strong>{score}</strong><em>Best {best}</em><div className="session-stats"><div><small>Hits</small><b>{stats.hits}</b></div><div><small>Best combo</small><b>x{Math.max(1, stats.bestCombo)}</b></div><div><small>Max decks</small><b>{stats.maxDecks}</b></div><div><small>Jokers</small><b>{stats.jokers}</b></div></div><button onClick={onPlay}>Play</button></section>
}

function App() {
  const [started, setStarted] = useState(false)
  const [tables, setTables] = useState(() => makeTables(buildDeck(), 1))
  const [combo, setCombo] = useState(0)
  const comboRef = useRef(0)
  const fxTokenRef = useRef(0)
  const [score, setScore] = useState(0)
  const [scoreBump, setScoreBump] = useState(0)
  const [best, setBest] = useState(() => Number(localStorage.getItem('60game-best') || 0))
  const [bets, setBets] = useState([])
  const [frontCombo, setFrontCombo] = useState(null)
  const [breakFx, setBreakFx] = useState(null)
  const [showEnd, setShowEnd] = useState(false)
  const [stats, setStats] = useState({ hits: 0, bestCombo: 0, maxDecks: 1, jokers: 0 })

  const mainTable = tables.find((table) => table.isMain) || tables[0]
  const mainDeck = mainTable.deck
  const lastCard = mainTable.lastCard
  const remainingByType = useMemo(() => Object.fromEntries(CARD_TYPES.map((type) => [type.label, countRemaining(mainDeck, type.label)])), [mainDeck])

  function scheduleFxClear(token, delay = 430) {
    window.setTimeout(() => {
      if (fxTokenRef.current !== token) return
      setTables((currentTables) => currentTables.map((table) => ({ ...table, showCombo: false })))
      setFrontCombo(null)
      setBreakFx(null)
    }, delay)
  }

  function newGame() {
    comboRef.current = 0
    fxTokenRef.current += 1
    setTables(makeTables(buildDeck(), 1)); setCombo(0); setScore(0); setScoreBump(0); setBets([]); setFrontCombo(null); setBreakFx(null); setShowEnd(false); setStats({ hits: 0, bestCombo: 0, maxDecks: 1, jokers: 0 }); setStarted(true)
  }

  function guess(label, buttonIndex) {
    if (showEnd) return
    fxTokenRef.current += 1
    const fxToken = fxTokenRef.current
    setTables((currentTables) => {
      const currentMain = currentTables.find((table) => table.isMain) || currentTables[0]
      if (!currentMain || currentMain.deck.length === 0) return currentTables

      const previousCombo = comboRef.current
      const betId = `bet-${Date.now()}-${buttonIndex}-${Math.random().toString(36).slice(2)}`
      const revealedTables = currentTables.map((table) => {
        const sourceDeck = table.deck.length > 0 ? table.deck : shuffle(currentMain.deck)
        const [drawnCard, ...nextDeck] = sourceDeck
        const hit = drawnCard?.label === label
        return { ...table, deck: nextDeck, lastCard: drawnCard, lastHit: hit, lastMiss: !hit, revealId: (table.revealId || 0) + 1, showCombo: false }
      })
      const hits = revealedTables.filter((table) => table.lastHit && table.lastCard)
      const isWin = hits.length > 0
      const nextCombo = isWin ? previousCombo + 1 : 0
      const referenceTable = hits[0] || revealedTables.find((table) => table.isMain) || revealedTables[0]
      const referenceDeck = referenceTable.deck
      const roundPoints = hits.reduce((total, table) => total + (table.lastCard?.value || 0), 0)
      const jokerHits = hits.filter((table) => table.lastCard?.label === 'JOKER').length
      const nextCount = activeTableCount(nextCombo)
      const orderedPrevious = revealedTables.map((table) => ({ ...table, showCombo: nextCombo >= 2 && table.lastHit }))

      setBets((items) => [...items, { id: betId, card: getCardType(label), buttonIndex, result: 'pending' }])
      window.setTimeout(() => setBets((items) => items.map((bet) => bet.id === betId ? { ...bet, result: isWin ? 'win' : 'loss' } : bet)), 80)
      window.setTimeout(() => setBets((items) => items.filter((bet) => bet.id !== betId)), 420)
      if (navigator.vibrate) navigator.vibrate(isWin ? 18 : 8)

      if (isWin) {
        comboRef.current = nextCombo
        setCombo(nextCombo)
        setBreakFx(null)
        setStats((currentStats) => ({ hits: currentStats.hits + hits.length, bestCombo: Math.max(currentStats.bestCombo, nextCombo), maxDecks: Math.max(currentStats.maxDecks, nextCount), jokers: currentStats.jokers + jokerHits }))
        setScore((currentScore) => {
          const multiplied = jokerHits > 0 ? currentScore * (2 ** jokerHits) : currentScore
          const nextScore = multiplied + roundPoints
          setBest((currentBest) => { const nextBest = Math.max(currentBest, nextScore); localStorage.setItem('60game-best', String(nextBest)); return nextBest })
          return nextScore
        })
        setScoreBump((value) => value + 1)
        if (nextCombo >= 2) setFrontCombo(`${comboText(nextCombo) || 'COMBO'} x${nextCombo}`)
        if (jokerHits > 0) setFrontCombo(`x${2 ** jokerHits} SCORE`)
        scheduleFxClear(fxToken)
        window.setTimeout(() => { if (fxTokenRef.current === fxToken && referenceDeck.length === 0) setShowEnd(true) }, 520)
        return makeTables(referenceDeck, nextCount, orderedPrevious, referenceTable.id)
      }

      comboRef.current = 0
      setCombo(0)
      setFrontCombo(null)
      setBreakFx(previousCombo >= 2 ? { id: fxToken, from: previousCombo } : null)
      scheduleFxClear(fxToken, previousCombo >= 2 ? 2720 : 220)
      window.setTimeout(() => { if (fxTokenRef.current === fxToken && referenceDeck.length === 0) setShowEnd(true) }, 520)
      return makeTables(referenceDeck, 1, [referenceTable], referenceTable.id)
    })
  }

  const gameOver = started && showEnd
  return <main className="game-shell"><div className="cinematic-bg" />{!started ? <button className="start-screen" onClick={newGame}><span>60game</span><strong>Card Arcade</strong><em>Tap to play</em></button> : gameOver ? <EndPanel score={score} best={best} stats={stats} onPlay={newGame} /> : <><header className="top-stats"><Stat tone="gold" icon="🏆" label="Score" value={score} bumpKey={scoreBump} /><Stat tone="purple" icon="♛" label="Best" value={best} /><Stat tone="green" icon="★" label="Left" value={mainDeck.length} /></header><ComboStatus combo={combo} /><section className="quick-info"><div><span>LAST</span><strong>{lastCard?.label || '-'}</strong></div><div><span>CARDS</span><strong>{mainDeck.length}</strong></div></section><section className={`play-stage multideck-stage ${tableLayoutClass(tables.length)}`}><AnimatePresence>{tables.map((table) => <TableSlot key={table.id} table={table} />)}</AnimatePresence><AnimatePresence>{bets.map((bet) => <BetClone key={bet.id} bet={bet} />)}</AnimatePresence><AnimatePresence>{frontCombo ? <motion.div className="front-combo" initial={{ opacity: 0, y: 28, scale: .65 }} animate={{ opacity: 1, y: 0, scale: [1, 1.08, 1] }} exit={{ opacity: 0, y: -36, scale: .9 }} transition={{ duration: .32 }}>{frontCombo}</motion.div> : null}</AnimatePresence><AnimatePresence>{breakFx ? <ComboBreakOverlay key={breakFx.id} breakFx={breakFx} /> : null}</AnimatePresence></section><section className="prediction-grid">{CARD_TYPES.map((card, index) => <PredictionCard key={card.label} card={card} index={index} remaining={remainingByType[card.label]} onGuess={guess} />)}</section></>}</main>
}

ReactDOM.createRoot(document.getElementById('app')).render(<App />)
