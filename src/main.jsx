import React, { useEffect, useMemo, useRef, useState } from 'react'
import ReactDOM from 'react-dom/client'
import { AnimatePresence, motion } from 'framer-motion'
import './style.css'
import './bet.css'
import './combo.css'
import { levelConfigs, levelsRegistry } from './engine/contentLoaders'
import { createAchievementRuntime, evaluateAchievements } from './engine/progression/achievements'
import { getStarModel } from './engine/progression/stars'
import { AnimatedMetric, StarDisplay, StarPopup } from './components/rewards'
import { chooseWeightedJokerPower, resolveJokerPowerHandler } from './engine/jokerPowers'

const COMBO_LABELS = { 2: 'GREAT', 3: 'AMAZING', 4: 'IMPRESSIVE', 5: 'AWESOME', 6: 'GOD IS PLAYING' }
const POST_GOD_LABELS = ['HAPPY BIRTHDAY', 'MY LORD', 'CHIRURGICAL', 'FIN LIMIER', 'OISEAU RARE', 'RENARD', 'LOUP', 'TIGRE', 'LION', 'DINOSAURE', 'METEORITE', 'SOLEIL', 'GALAXIE', 'COSMOS', 'UNIVERS', 'MULTIVERS', 'TROU NOIR', 'BIG BANG']
const SCORE_SCREEN_DELAY_MS = 2000
const STAR_POPUP_DURATION_MS = 2500
const STAR_POPUP_ACCELERATION_FACTOR = 3
const GAME_OVER_BANNER_LEAD_MS = 1000
const WIN_OVERLAY_DURATION_MS = 1500

const THEME_BY_INDEX = ['green', 'blue', 'purple', 'orange', 'red', 'cyan', 'gold']

function cardTypesFromLevel(levelConfig) {
  return Object.entries(levelConfig.startingDeck).map(([rawLabel], index) => {
    if (rawLabel === 'joker') return { label: 'JOKER', value: 0, count: levelConfig.startingDeck[rawLabel], theme: 'joker', icon: '♛' }
    const value = Number(rawLabel)
    return { label: rawLabel, value, count: levelConfig.startingDeck[rawLabel], theme: THEME_BY_INDEX[index % THEME_BY_INDEX.length], icon: '◆' }
  })
}

function buildDeckForLevel(levelConfig) {
  const types = cardTypesFromLevel(levelConfig)
  return shuffle(types.flatMap((type) => Array.from({ length: type.count }, (_, index) => ({ ...type, id: `${type.label}-${index}` }))))
}
const countRemaining = (deck, label) => deck.filter((card) => card.label === label).length
const getCardType = (cardTypes, label) => cardTypes.find((card) => card.label === label)
function comboText(combo) {
  if (combo <= 6) return COMBO_LABELS[combo]
  return POST_GOD_LABELS[(combo - 7) % POST_GOD_LABELS.length]
}

function shuffle(cards) {
  const copy = [...cards]
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
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
    return { id, isMain, deck: isMain ? mainCards : shuffle(mainCards), lastCard: previous?.lastCard || null, lastHit: previous?.lastHit || false, lastMiss: previous?.lastMiss || false, revealId: previous?.revealId || 0, showCombo: false }
  })
}

function scoreShareText(score, best, stats) {
  return `60game\nScore ${score}\nBest ${best}\nHits ${stats.hits}\nBest combo x${Math.max(1, stats.bestCombo)}\nMax decks ${stats.maxDecks}\nJokers ${stats.jokers}`
}

function makeScoreImage(score, best, stats) {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas')
    const width = 900
    const height = 1200
    canvas.width = width
    canvas.height = height
    const context = canvas.getContext('2d')
    if (!context) {
      resolve(null)
      return
    }

    const gradient = context.createLinearGradient(0, 0, width, height)
    gradient.addColorStop(0, '#1b2250')
    gradient.addColorStop(0.58, '#090d1b')
    gradient.addColorStop(1, '#050711')
    context.fillStyle = gradient
    context.fillRect(0, 0, width, height)

    context.fillStyle = 'rgba(255, 218, 104, 0.18)'
    context.beginPath()
    context.arc(width * 0.82, height * 0.18, 250, 0, Math.PI * 2)
    context.fill()
    context.fillStyle = 'rgba(76, 129, 255, 0.2)'
    context.beginPath()
    context.arc(width * 0.18, height * 0.78, 290, 0, Math.PI * 2)
    context.fill()

    context.strokeStyle = 'rgba(255, 255, 255, 0.22)'
    context.lineWidth = 4
    context.beginPath()
    context.roundRect(72, 80, width - 144, height - 160, 44)
    context.stroke()

    context.textAlign = 'center'
    context.fillStyle = 'rgba(255, 255, 255, 0.72)'
    context.font = '700 34px system-ui, sans-serif'
    context.fillText('60GAME SCORE', width / 2, 190)

    context.fillStyle = '#ffffff'
    context.font = '900 180px system-ui, sans-serif'
    context.fillText(String(score), width / 2, 390)

    context.fillStyle = '#ffe680'
    context.font = '900 54px system-ui, sans-serif'
    context.fillText(`BEST ${best}`, width / 2, 480)

    const rows = [
      ['Hits', stats.hits],
      ['Best combo', `x${Math.max(1, stats.bestCombo)}`],
      ['Max decks', stats.maxDecks],
      ['Jokers', stats.jokers]
    ]
    context.textAlign = 'left'
    rows.forEach(([label, value], index) => {
      const y = 620 + index * 106
      context.fillStyle = 'rgba(255, 255, 255, 0.1)'
      context.beginPath()
      context.roundRect(150, y - 58, 600, 78, 28)
      context.fill()
      context.fillStyle = 'rgba(255, 255, 255, 0.66)'
      context.font = '700 30px system-ui, sans-serif'
      context.fillText(label, 190, y - 8)
      context.fillStyle = '#ffffff'
      context.textAlign = 'right'
      context.font = '900 40px system-ui, sans-serif'
      context.fillText(String(value), 710, y - 10)
      context.textAlign = 'left'
    })

    context.textAlign = 'center'
    context.fillStyle = 'rgba(255, 255, 255, 0.54)'
    context.font = '700 28px system-ui, sans-serif'
    context.fillText('Shared from 60game', width / 2, 1080)

    canvas.toBlob((blob) => {
      if (!blob) {
        resolve(null)
        return
      }
      resolve(new File([blob], '60game-score.png', { type: 'image/png' }))
    }, 'image/png')
  })
}

async function shareScore(score, best, stats) {
  const file = await makeScoreImage(score, best, stats)
  if (file && navigator.canShare?.({ files: [file] }) && navigator.share) {
    try {
      await navigator.share({ files: [file] })
      return
    } catch {
      return
    }
  }

  const text = scoreShareText(score, best, stats)
  if (navigator.share) {
    try {
      await navigator.share({ title: '60game score', text })
      return
    } catch {
      return
    }
  }

  window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank')
}


function WhatsAppIcon() {
  return <svg width="22" height="22" viewBox="0 0 32 32" aria-hidden="true"><path fill="currentColor" d="M16.03 4C9.4 4 4 9.35 4 15.93c0 2.1.55 4.13 1.6 5.92L4 28l6.32-1.56a12.1 12.1 0 0 0 5.71 1.44C22.66 27.88 28 22.53 28 15.93S22.66 4 16.03 4Zm0 21.84c-1.82 0-3.6-.5-5.16-1.45l-.37-.22-3.75.93.96-3.64-.24-.38a9.83 9.83 0 0 1-1.47-5.15c0-5.45 4.5-9.89 10.03-9.89 5.51 0 9.99 4.44 9.99 9.89 0 5.47-4.48 9.91-9.99 9.91Zm5.5-7.4c-.3-.15-1.78-.87-2.06-.97-.28-.1-.48-.15-.68.15-.2.3-.78.97-.96 1.17-.18.2-.35.23-.65.08-.3-.15-1.27-.46-2.42-1.48a9.06 9.06 0 0 1-1.67-2.06c-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.53.15-.18.2-.3.3-.5.1-.2.05-.38-.03-.53-.08-.15-.68-1.63-.93-2.23-.25-.58-.5-.5-.68-.51l-.58-.01c-.2 0-.53.08-.8.38-.28.3-1.05 1.02-1.05 2.48s1.08 2.88 1.23 3.08c.15.2 2.13 3.23 5.16 4.53.72.31 1.29.5 1.73.64.73.23 1.39.2 1.91.12.58-.09 1.78-.72 2.03-1.42.25-.7.25-1.3.18-1.42-.08-.13-.28-.2-.58-.35Z" /></svg>
}

function Stat({ tone, icon, label, value, bumpKey }) {
  return <motion.div key={`${label}-${bumpKey || 0}`} className={`stat-card ${tone}`} initial={{ scale: 1 }} animate={{ scale: bumpKey ? [1, 1.1, 1] : 1 }} transition={{ duration: .24 }}><span className="stat-icon">{icon}</span><span className="stat-label">{label}</span><strong>{value}</strong></motion.div>
}

function ComboStatus({ combo }) {
  return <div className="combo-status"><span>{combo >= 2 ? `${activeTableCount(combo)} DECKS` : '1 DECK'}</span></div>
}

function DeckStack({ remaining, isMain, totalCards }) {
  return <div className="deck-zone"><div className="plate plate-blue" /><div className="deck-stack"><div className="deck-shadow-card card-layer-4" /><div className="deck-shadow-card card-layer-3" /><div className="deck-shadow-card card-layer-2" /><div className={`deck-back ${isMain ? 'primary-deck' : ''}`}><span className="deck-logo">{totalCards}</span><span className="deck-subtitle">GAME</span>{isMain ? <small>{remaining}</small> : null}</div></div></div>
}

function FaceCard({ card, empty = false }) {
  if (!card || empty) return <div className="face-card empty-face"><strong>?</strong></div>
  return <div className={`face-card theme-${card.theme}`}><strong className={card.theme === 'joker' ? 'joker-face-text' : ''}>{card.label}</strong><span className="face-icon">{card.icon}</span></div>
}

function DiscardPile({ card, won, miss, points, revealId, showCombo }) {
  const stateClass = won ? 'impact-lite' : miss ? 'miss-shake' : ''
  return <div className="discard-zone"><div className="plate plate-purple" /><div className={`discard-card-wrap ${stateClass}`}><div key={revealId} className="discard-drop"><FaceCard card={card} empty={!card} /></div><AnimatePresence>{showCombo ? <motion.div className="local-combo-label" initial={{ opacity: 0, y: 14, scale: .7 }} animate={{ opacity: 1, y: -18, scale: 1 }} exit={{ opacity: 0, y: -32, scale: .8 }} transition={{ duration: .25 }}>COMBO</motion.div> : null}{points ? <motion.div className="gain-pop" initial={{ opacity: 0, y: 18, scale: .7 }} animate={{ opacity: 1, y: -36, scale: [1, 1.15, 1] }} exit={{ opacity: 0, y: -58, scale: .85 }} transition={{ duration: .36 }}>+{points}</motion.div> : null}</AnimatePresence></div></div>
}

function PredictionCard({ card, index, remaining, onGuess, bumpKey }) {
  const unavailable = remaining <= 0
  function handlePress(event) {
    if (unavailable) {
      event.preventDefault()
      if (navigator.vibrate) navigator.vibrate([90, 35, 90])
      return
    }
    onGuess(card, index)
  }
  return <motion.button key={`${card.label}-${bumpKey || 0}`} className={`prediction-card theme-${card.theme} ${card.theme === 'joker' ? 'joker-prediction-card' : ''}`} aria-disabled={unavailable} onClick={handlePress} whileTap={{ scale: unavailable ? 1 : 0.96 }} initial={{ scale: 1 }} animate={{ scale: bumpKey ? [1, 1.12, 0.96, 1] : 1 }} transition={{ duration: 0.34 }}><span className="prediction-value">{card.label}</span><span className="prediction-icon">{card.icon}</span><span className="prediction-left">{remaining} LEFT</span></motion.button>
}

function BetClone({ bet }) {
  if (!bet?.card) return null
  const col = bet.buttonIndex % 4
  const row = Math.floor(bet.buttonIndex / 4)
  const startX = `${(col - 1.5) * 24}vw`
  const startY = `${36 + row * 9}dvh`
  const animate = bet.result === 'win' ? { x: '24vw', y: ['18dvh', '12dvh', '18dvh'], rotate: [-4, 4, -2], scale: [0.78, 0.94, 0.82], opacity: 1 } : bet.result === 'loss' ? { x: '24vw', y: '38dvh', rotate: 28, scale: 0.64, opacity: 0 } : { x: '24vw', y: '18dvh', rotate: -2, scale: 0.78, opacity: 1 }
  return <motion.div className={`bet-clone theme-${bet.card.theme} bet-${bet.result}`} initial={{ x: startX, y: startY, scale: 0.66, opacity: 0.94 }} animate={animate} exit={{ opacity: 0, scale: 0.45 }} transition={{ duration: bet.result === 'pending' ? 0.18 : 0.32, ease: 'easeOut' }}><span>{bet.card.label}</span><small>{bet.card.icon}</small></motion.div>
}

function TableSlot({ table, totalCards }) {
  const points = table.lastHit && table.lastCard ? table.lastCard.value : null
  return <motion.div className={`combo-table ${table.isMain ? 'main-combo-table' : ''} ${table.lastMiss ? 'combo-table-miss' : ''}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: .1 }}><DeckStack remaining={table.deck.length} isMain={table.isMain} totalCards={totalCards} /><div className="arc-ribbon mini-ribbon" /><DiscardPile card={table.lastCard} won={table.lastHit} miss={table.lastMiss} points={points} revealId={table.revealId} showCombo={table.showCombo} /></motion.div>
}

function LevelIntroCard({ level, levelNumber, totalCards, onPlay }) {
  const jokerCount = level.startingDeck.joker || 0
  const nonJoker = Object.keys(level.startingDeck).filter((label) => label !== 'joker')
  return <section className="level-intro-overlay"><article className="level-intro-card"><span>Level {levelNumber}</span><em>{level.difficulty || 'Hard'} • {totalCards} cards • {jokerCount} jokers</em><p>{nonJoker.join(' / ')}</p><button className="level-intro-play" onClick={onPlay}>Play</button></article></section>
}

function ComboBreakCountdown({ from }) {
  const [value, setValue] = useState(from)
  useEffect(() => {
    setValue(from)
    const timers = []
    const stepDurationMs = Math.max(16, 2000 / Math.max(1, from))
    for (let next = from - 1, step = 1; next >= 0; next -= 1, step += 1) {
      timers.push(window.setTimeout(() => setValue(next), Math.round(step * stepDurationMs)))
    }
    return () => timers.forEach(window.clearTimeout)
  }, [from])
  return <motion.span key={value} className={value === 0 ? 'break-countdown zero' : 'break-countdown'} initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 16 }} transition={{ duration: .12 }}>x{value}</motion.span>
}

function ComboBreakOverlay({ breakFx }) {
  if (!breakFx) return null
  return <div className="combo-break-overlay"><motion.div initial={{ opacity: 0, y: 26, scale: .68 }} animate={{ opacity: 1, y: 0, scale: [1, 1.06, 1] }} exit={{ opacity: 0, y: -34, scale: .88 }} transition={{ duration: .34 }}><strong>COMBO BREAK</strong><ComboBreakCountdown from={breakFx.from} /></motion.div></div>
}

function FrontComboOverlay({ combo }) {
  if (!combo) return null
  return <div className={`front-combo ${combo.boom ? 'big-bang-combo' : ''}`}><motion.div initial={{ opacity: 0, y: 28, scale: .65 }} animate={{ opacity: 1, y: 0, scale: [1, 1.08, 1] }} exit={{ opacity: 0, y: -36, scale: .9 }} transition={{ duration: .32 }}><span className="front-combo-title">{combo.title}</span><span className="front-combo-multiplier">x{combo.multiplier}</span>{combo.boom ? <span className="front-combo-boom">BOOM</span> : null}</motion.div></div>
}

function EndPanel({ score, best, stats, levelNumber, onReplay, onNext, onHome, stars }) {
  const unlockedStarsCount = stars.filter((star) => star.unlocked).length
  const [showWinOverlay, setShowWinOverlay] = useState(unlockedStarsCount > 0)

  useEffect(() => {
    if (unlockedStarsCount <= 0) {
      setShowWinOverlay(false)
      return
    }
    setShowWinOverlay(true)
    const timer = window.setTimeout(() => setShowWinOverlay(false), WIN_OVERLAY_DURATION_MS)
    return () => window.clearTimeout(timer)
  }, [unlockedStarsCount])

  return <section className="end-screen session-panel"><AnimatePresence>{showWinOverlay ? <motion.div className="win-overlay" initial={{ opacity: 0, scale: 0.66, y: 26 }} animate={{ opacity: 1, scale: [1.12, 0.96, 1], y: 0 }} exit={{ opacity: 0, scale: 1.2, y: -28 }} transition={{ duration: 0.58, ease: 'easeOut' }}>WIN</motion.div> : null}</AnimatePresence><span>Level {levelNumber}</span><strong>{score}</strong><em>Best {best}</em><div className="star-panel">{stars.map((star, index) => <motion.div key={star.id} className={`star-row ${star.unlocked ? 'on' : ''}`} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.25 + 0.1, duration: 0.25 }}><AnimatedMetric value={star.id === 'precision' ? Math.round(Number(star.value || 0) * 100) : star.value} suffix={star.id === 'precision' ? '%' : ''} className={`metric-${star.id} ${star.id === 'score' && Number(star.value || 0) >= 1000 ? 'metric-score-fit' : ''}`} bumpKey={`${star.id}-${star.unlocked ? 'on' : 'off'}`} /><StarDisplay unlocked={star.unlocked} size="lg" /><small>{star.targetText}</small><small className="star-current">Current: {star.id === 'precision' ? (star.valueText || '0%') : star.value}</small></motion.div>)}</div><div className="session-stats"><div><small>Hits</small><b>{stats.hits}</b></div><div><small>Best combo</small><b>x{Math.max(1, stats.bestCombo)}</b></div><div><small>Max decks</small><b>{stats.maxDecks}</b></div><div><small>Jokers</small><b>{stats.jokers}</b></div></div><div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}><button onClick={onReplay}>Replay</button><button onClick={onNext}>Next</button><button onClick={onHome}>Home</button><button onClick={() => shareScore(score, best, stats)} style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: '#25D366', color: 'white' }}><WhatsAppIcon />Share</button></div></section>
}

function App() {
  const orderedLevelIds = useMemo(() => levelsRegistry.levels.map(({ id }) => id).filter((id) => levelConfigs[id]), [])
  const [selectedLevelId, setSelectedLevelId] = useState(levelsRegistry.startingLevel)
  const currentLevel = levelConfigs[selectedLevelId] ?? levelConfigs[levelsRegistry.startingLevel]
  const cardTypes = useMemo(() => cardTypesFromLevel(currentLevel), [currentLevel])
  const [started, setStarted] = useState(false)
  const [tables, setTables] = useState(() => makeTables(buildDeckForLevel(currentLevel), 1))
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
  const [showLevelIntro, setShowLevelIntro] = useState(false)
  const [stats, setStats] = useState({ hits: 0, bestCombo: 0, maxDecks: 1, jokers: 0 })
  const [achievementRuntime, setAchievementRuntime] = useState(() => createAchievementRuntime(currentLevel))
  const [achievementPopups, setAchievementPopups] = useState([])
  const [starPopups, setStarPopups] = useState([])
  const [jokerPowerPopups, setJokerPowerPopups] = useState([])
  const [cardCountBumps, setCardCountBumps] = useState({})
  const starPopupTimersRef = useRef(new Map())
  const [showGameOverBanner, setShowGameOverBanner] = useState(false)
  const [totalDrawn, setTotalDrawn] = useState(0)
  const [precisionHits, setPrecisionHits] = useState(0)
  const [progression, setProgression] = useState(() => JSON.parse(localStorage.getItem('60game-progression') || '{}'))
  const levelNumber = orderedLevelIds.indexOf(selectedLevelId) + 1
  const totalCards = useMemo(() => Object.values(currentLevel.startingDeck).reduce((sum, amount) => sum + amount, 0), [currentLevel])

  const mainTable = tables.find((table) => table.isMain) || tables[0]
  const mainDeck = mainTable.deck
  const lastCard = mainTable.lastCard
  const remainingByType = useMemo(() => Object.fromEntries(cardTypes.map((type) => [type.label, countRemaining(mainDeck, type.label)])), [mainDeck, cardTypes])

  function scheduleFxClear(token, delay = 430) {
    window.setTimeout(() => {
      if (fxTokenRef.current !== token) return
      setTables((currentTables) => currentTables.map((table) => ({ ...table, showCombo: false })))
      setFrontCombo(null)
      setBreakFx(null)
    }, delay)
  }

  function newGame(levelId = selectedLevelId) {
    const activeLevel = levelConfigs[levelId] ?? levelConfigs[levelsRegistry.startingLevel]
    comboRef.current = 0
    fxTokenRef.current += 1
    previousUnlockedStarsRef.current = new Set()
    setTables(makeTables(buildDeckForLevel(activeLevel), 1)); setCombo(0); setScore(0); setScoreBump(0); setBets([]); setFrontCombo(null); setBreakFx(null); setShowEnd(false); setShowGameOverBanner(false); setStats({ hits: 0, bestCombo: 0, maxDecks: 1, jokers: 0 }); setShowLevelIntro(true); setStarted(true); setAchievementRuntime(createAchievementRuntime(activeLevel)); setAchievementPopups([]); setStarPopups([]); setJokerPowerPopups([]); setCardCountBumps({}); setTotalDrawn(0); setPrecisionHits(0); starPopupTimersRef.current.forEach((timerMeta) => window.clearTimeout(timerMeta.timerId)); starPopupTimersRef.current.clear()
  }


  function triggerEndSequence(fxToken) {
    window.setTimeout(() => {
      if (fxTokenRef.current !== fxToken) return
      setShowGameOverBanner(true)
    }, Math.max(0, SCORE_SCREEN_DELAY_MS - GAME_OVER_BANNER_LEAD_MS))
    window.setTimeout(() => {
      if (fxTokenRef.current !== fxToken) return
      setShowGameOverBanner(false)
      setShowEnd(true)
    }, SCORE_SCREEN_DELAY_MS)
  }

  function guess(predictedCard, buttonIndex) {
    const label = predictedCard?.label
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
      setTotalDrawn((v) => v + 1)
      const isWin = hits.length > 0
      const nextCombo = isWin ? previousCombo + 1 : 0
      const referenceTable = hits[0] || revealedTables.find((table) => table.isMain) || revealedTables[0]
      let referenceDeck = referenceTable.deck
      const roundPoints = hits.reduce((total, table) => total + (table.lastCard?.value || 0), 0)
      const jokerHits = hits.filter((table) => table.lastCard?.label === 'JOKER').length
      const jokerTriggered = jokerHits > 0
      const nextCount = activeTableCount(nextCombo)
      const orderedPrevious = revealedTables.map((table) => ({ ...table, showCombo: nextCombo >= 2 && table.lastHit }))
      let jokerScoreMultiplier = 1
      setBets((items) => [...items, { id: betId, card: predictedCard || getCardType(cardTypes, label), buttonIndex, result: 'pending' }])
      window.setTimeout(() => setBets((items) => items.map((bet) => bet.id === betId ? { ...bet, result: isWin ? 'win' : 'loss' } : bet)), 80)
      window.setTimeout(() => setBets((items) => items.filter((bet) => bet.id !== betId)), 420)
      if (navigator.vibrate) navigator.vibrate(isWin ? 18 : 8)
      if (isWin) {
        const numericValues = Object.keys(currentLevel?.startingDeck || {}).filter((v) => v !== 'joker').map(Number).filter((v) => Number.isFinite(v))
        const minCardValue = numericValues.length > 0 ? Math.min(...numericValues) : null
        if (minCardValue != null && hits.some((h) => (h.lastCard?.value || 0) > minCardValue)) setPrecisionHits((v) => v + 1)
        comboRef.current = nextCombo
        setCombo(nextCombo)
        setBreakFx(null)
        setStats((currentStats) => ({ hits: currentStats.hits + hits.length, bestCombo: Math.max(currentStats.bestCombo, nextCombo), maxDecks: Math.max(currentStats.maxDecks, nextCount), jokers: currentStats.jokers + jokerHits }))
        const unlockedAchievements = evaluateAchievements(achievementRuntime, { isWin: true, card: hits[0]?.lastCard, combo: nextCombo, levelConfig: currentLevel })
        if (unlockedAchievements.length > 0) {
          const ts = Date.now()
          setAchievementPopups((items) => [...items, ...unlockedAchievements.map((a, idx) => ({ id: `${a.id}-${ts}-${idx}`, name: a.name, points: a.pointsReward }))].slice(-3))
          unlockedAchievements.forEach((a, idx) => {
            const popupId = `${a.id}-${ts}-${idx}`
            window.setTimeout(() => setAchievementPopups((items) => items.filter((p) => p.id !== popupId)), 4000 + idx * 180)
          })
        }

        if (jokerTriggered) {
          const selectedPower = chooseWeightedJokerPower()
          if (selectedPower) {
            const handler = resolveJokerPowerHandler(selectedPower.handler)
            if (handler) {
              const cardId = Date.now()
              const beforeCounts = Object.fromEntries(cardTypes.map((type) => [type.label, referenceDeck.filter((card) => card.label === type.label).length]))
              referenceDeck = handler.apply({
                deck: referenceDeck,
                levelConfig: currentLevel,
                makeCardFromLabel: (rawLabel) => {
                  if (rawLabel === 'JOKER') return { label: 'JOKER', value: 0, theme: 'joker', icon: '♛', id: `joker-${cardId}-${Math.random().toString(36).slice(2, 8)}` }
                  const value = Number(rawLabel)
                  const existingType = cardTypes.find((type) => type.label === String(rawLabel))
                  return { label: String(rawLabel), value, theme: existingType?.theme || 'green', icon: existingType?.icon || '◆', id: `num-${rawLabel}-${cardId}-${Math.random().toString(36).slice(2, 8)}` }
                }
              }, selectedPower.params)
              if (selectedPower.handler === 'multiplyScore') jokerScoreMultiplier = Number(selectedPower?.params?.factor || 2)
              const afterCounts = Object.fromEntries(cardTypes.map((type) => [type.label, referenceDeck.filter((card) => card.label === type.label).length]))
              const changed = Object.keys(afterCounts).filter((label) => afterCounts[label] !== beforeCounts[label])
              if (changed.length > 0) {
                referenceDeck = shuffle(referenceDeck)
                setCardCountBumps((current) => changed.reduce((acc, label) => ({ ...acc, [label]: (acc[label] || 0) + 1 }), { ...current }))
              }
              const popupId = `${selectedPower.id}-${Date.now()}-${Math.random().toString(36).slice(2,6)}`
              setJokerPowerPopups((items) => [...items, { id: popupId, text: selectedPower.popupText }].slice(-2))
              window.setTimeout(() => setJokerPowerPopups((items) => items.filter((p) => p.id !== popupId)), 1700)
            }
          }
        }

        setScore((currentScore) => {
          const multiplied = currentScore * jokerScoreMultiplier
          const achievementPoints = unlockedAchievements.reduce((sum, a) => sum + Number(a.pointsReward || 0), 0)
          const nextScore = multiplied + roundPoints + achievementPoints
          setBest((currentBest) => { const nextBest = Math.max(currentBest, nextScore); localStorage.setItem('60game-best', String(nextBest)); return nextBest })
          return nextScore
        })
        setScoreBump((value) => value + 1)
        if (nextCombo >= 2) {
          const title = comboText(nextCombo) || 'COMBO'
          setFrontCombo({ title, multiplier: nextCombo, boom: title === 'BIG BANG' })
        }
        if (jokerTriggered) setFrontCombo({ title: 'JOKER', multiplier: 1, boom: false })
        scheduleFxClear(fxToken, frontCombo?.boom ? 2000 : 430)
        if (fxTokenRef.current === fxToken && referenceDeck.length === 0) triggerEndSequence(fxToken)
        return makeTables(referenceDeck, nextCount, orderedPrevious, referenceTable.id)
      }
      evaluateAchievements(achievementRuntime, { isWin: false, card: referenceTable.lastCard, combo: 0, levelConfig: currentLevel })
      comboRef.current = 0
      setCombo(0)
      setFrontCombo(null)
      setBreakFx(previousCombo >= 2 ? { id: fxToken, from: previousCombo } : null)
      scheduleFxClear(fxToken, previousCombo >= 2 ? 2400 : 220)
      if (fxTokenRef.current === fxToken && referenceDeck.length === 0) triggerEndSequence(fxToken)
      return makeTables(referenceDeck, 1, [referenceTable], referenceTable.id)
    })
  }

  function nextLevel() {
    const index = orderedLevelIds.indexOf(selectedLevelId)
    const nextId = index >= 0 ? orderedLevelIds[(index + 1) % orderedLevelIds.length] : levelsRegistry.startingLevel
    setSelectedLevelId(nextId)
    newGame(nextId)
  }

  function goHome() {
    setStarted(false)
    setShowEnd(false)
    setFrontCombo(null)
    setBreakFx(null)
    setBets([])
    setShowLevelIntro(false)
    previousUnlockedStarsRef.current = new Set()
  }

  const runtimeStars = getStarModel(currentLevel, { achievementCount: achievementRuntime.filter((a) => a.unlocked).length, score, totalDrawn, precisionHits })
  const unlockedStarIds = runtimeStars.filter((s) => s.unlocked).map((s) => s.id).join(',')

  const previousUnlockedStarsRef = useRef(new Set())
  useEffect(() => {
    if (!started || showEnd) return
    const nextUnlocked = runtimeStars.filter((s) => s.unlocked)
    const prev = previousUnlockedStarsRef.current
    const freshlyUnlocked = nextUnlocked.filter((s) => !prev.has(s.id))
    const precisionIsNowUnlocked = nextUnlocked.some((s) => s.id === 'precision')
    const precisionWasUnlocked = prev.has('precision')
    const lostPrecision = precisionWasUnlocked && !precisionIsNowUnlocked
    const popupEntries = []
    const ts = Date.now()
    const hasDrawnHalfDeck = totalDrawn >= Math.ceil(totalCards / 2)
    freshlyUnlocked.forEach((star, index) => {
      if (star.id === 'precision' && !hasDrawnHalfDeck) return
      popupEntries.push({ id: `star-${star.id}-${ts}-${index}-${Math.random().toString(36).slice(2, 6)}`, name: star.name, state: 'unlocked' })
    })
    if (lostPrecision && hasDrawnHalfDeck) popupEntries.push({ id: `star-precision-lost-${ts}-${Math.random().toString(36).slice(2, 6)}`, name: 'Precision', state: 'lost' })
    if (popupEntries.length > 0) {
      const now = Date.now()
      const activePopupIds = []
      starPopupTimersRef.current.forEach((_, popupId) => activePopupIds.push(popupId))
      activePopupIds.forEach((popupId) => {
        const meta = starPopupTimersRef.current.get(popupId)
        if (!meta) return
        const remainingMs = Math.max(0, meta.endsAt - now)
        const acceleratedMs = Math.max(120, Math.round(remainingMs / STAR_POPUP_ACCELERATION_FACTOR))
        window.clearTimeout(meta.timerId)
        const timerId = window.setTimeout(() => setStarPopups((items) => items.filter((p) => p.id !== popupId)), acceleratedMs)
        starPopupTimersRef.current.set(popupId, { timerId, endsAt: now + acceleratedMs })
      })

      setStarPopups((items) => [...items, ...popupEntries].slice(-4))
      popupEntries.forEach((popup) => {
        const timerId = window.setTimeout(() => setStarPopups((items) => items.filter((p) => p.id !== popup.id)), STAR_POPUP_DURATION_MS)
        starPopupTimersRef.current.set(popup.id, { timerId, endsAt: Date.now() + STAR_POPUP_DURATION_MS })
      })
    }
    previousUnlockedStarsRef.current = new Set(nextUnlocked.map((s) => s.id))
  }, [started, showEnd, unlockedStarIds, totalDrawn, totalCards])
  useEffect(() => {
    return () => {
      starPopupTimersRef.current.forEach((timer) => window.clearTimeout(timer.timerId))
      starPopupTimersRef.current.clear()
    }
  }, [])

  useEffect(() => {
    const stars = runtimeStars.filter((s) => s.unlocked).length
    if (!showEnd) return
    setProgression((current) => {
      const next = { ...current, [selectedLevelId]: { stars: Math.max(current[selectedLevelId]?.stars || 0, stars), bestScore: Math.max(current[selectedLevelId]?.bestScore || 0, score), achievements: Math.max(current[selectedLevelId]?.achievements || 0, achievementRuntime.filter((a) => a.unlocked).length) } }
      localStorage.setItem('60game-progression', JSON.stringify(next))
      return next
    })
  }, [showEnd, selectedLevelId, score])

  useEffect(() => {
    const activeIds = new Set(starPopups.map((popup) => popup.id))
    starPopupTimersRef.current.forEach((meta, popupId) => {
      if (activeIds.has(popupId)) return
      window.clearTimeout(meta.timerId)
      starPopupTimersRef.current.delete(popupId)
    })
  }, [starPopups])

  const gameOver = started && showEnd
  return <main className={`game-shell ${started ? 'in-game' : 'home-mode'}`}><div className="cinematic-bg" />{!started ? <section className="start-screen level-select"><span>60game</span><strong>60 Game</strong><em>Select a level</em><div className="level-select-grid">{orderedLevelIds.map((id) => { const level = levelConfigs[id]; if (!level) return null; const nonJoker = Object.keys(level.startingDeck).filter((label) => label !== 'joker'); const deckSize = Object.values(level.startingDeck).reduce((sum, amount) => sum + amount, 0); const jokerCount = level.startingDeck.joker || 0; const active = selectedLevelId === id; const saved = progression[id] || {}; return <button key={id} className={`level-pick ${active ? 'active' : ''}`} onClick={() => { setSelectedLevelId(id); newGame(id) }}><b>{level.name}</b><small>{level.difficulty || 'Hard'} • {deckSize} cards • {jokerCount} jokers</small><span>{nonJoker.join(' / ')}</span><div className='mini-stars'>{[0,1,2].map((i)=><StarDisplay key={i} unlocked={(saved.stars||0)>i} size="md" className="mini-star" />)}</div></button> })}</div></section> : gameOver ? <EndPanel score={score} best={best} stats={stats} levelNumber={levelNumber} onReplay={() => newGame(selectedLevelId)} onNext={nextLevel} onHome={goHome} stars={runtimeStars} /> : <><header className="top-stats"><Stat tone="gold" icon="🏆" label="Score" value={score} bumpKey={scoreBump} /><Stat tone="purple" icon="♛" label="Best" value={best} /><Stat tone="green" icon="★" label="Left" value={mainDeck.length} /></header><ComboStatus combo={combo} /><section className="quick-info"><div><span>LEVEL</span><strong>{levelNumber}</strong></div><div><span>CARDS</span><strong>{mainDeck.length}</strong></div></section><section className={`play-stage multideck-stage ${tableLayoutClass(tables.length)}`}><AnimatePresence>{tables.map((table) => <TableSlot key={table.id} table={table} totalCards={totalCards} />)}</AnimatePresence><AnimatePresence>{bets.map((bet) => <BetClone key={bet.id} bet={bet} />)}</AnimatePresence><AnimatePresence>{frontCombo ? <FrontComboOverlay key={`${frontCombo.title}-${frontCombo.multiplier}`} combo={frontCombo} /> : null}</AnimatePresence><AnimatePresence>{breakFx ? <ComboBreakOverlay key={breakFx.id} breakFx={breakFx} /> : null}</AnimatePresence></section><section className="prediction-grid">{cardTypes.map((card, index) => <PredictionCard key={card.label} card={card} index={index} remaining={remainingByType[card.label]} onGuess={guess} bumpKey={cardCountBumps[card.label]} />)}</section><AnimatePresence>{achievementPopups.filter(Boolean).map((popup) => <motion.div key={popup.id} className='achievement-popup' initial={{ opacity: 0, y: 20, scale: 0.9 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.35 }}>★ {popup.name} +{popup.points}</motion.div>)}</AnimatePresence><AnimatePresence>{starPopups.map((popup) => <StarPopup key={popup.id} popup={popup} />)}</AnimatePresence><AnimatePresence>{jokerPowerPopups.map((popup) => <motion.div key={popup.id} className='joker-power-popup' initial={{ opacity: 0, y: 26, scale: 0.4 }} animate={{ opacity: [0, 1, 1, 0], y: [26, -4, -12, -30], scale: [0.4, 1.2, 1, 0.85] }} exit={{ opacity: 0, y: -40, scale: 0.8 }} transition={{ duration: 1.7, ease: 'easeOut' }}>{popup.text}</motion.div>)}</AnimatePresence><AnimatePresence>{showGameOverBanner ? <motion.div className='game-over-banner' initial={{ opacity: 0, scale: 0.8, y: 20 }} animate={{ opacity: 1, scale: [1.1, 1], y: 0 }} exit={{ opacity: 0, scale: 1.2, y: -26 }} transition={{ duration: 0.42, ease: 'easeOut' }}>GAME OVER</motion.div> : null}</AnimatePresence>{showLevelIntro ? <LevelIntroCard level={currentLevel} levelNumber={levelNumber} totalCards={totalCards} onPlay={() => setShowLevelIntro(false)} /> : null}</>}</main>
}

ReactDOM.createRoot(document.getElementById('app')).render(<App />)
