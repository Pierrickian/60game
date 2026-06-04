import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import ReactDOM from 'react-dom/client'
import { AnimatePresence, motion } from 'framer-motion'
import './style.css'
import './bet.css'
import './combo.css'
import { levelConfigs, levelsRegistry } from './engine/contentLoaders'
import { createAchievementRuntime, evaluateAchievements } from './engine/progression/achievements'
import { getPrecisionHitIncrement, getStarModel } from './engine/progression/stars'
import { AnimatedMetric, StarDisplay } from './components/rewards'
import { AchievementsMenu } from './components/achievements-menu'
import { chooseWeightedJokerPower, resolveJokerPowerHandler } from './engine/jokerPowers'
import { readStoredNumber, readStoredObject, writeStoredValue } from './runtime/browserStorage'
import { DeckReconciliationError, applyDeckMutationToTables, countCardsByLabel, drawCard, makeTables, peekNextDrawCard, reconcileDeckAfterWinningDraw, resyncDeckFromPromoted, shuffle } from './runtime/tableDecks'
import { getMoreLessHintDirection } from './runtime/moreLessHints'
import { formatCardProbability, getCardProbabilityModel } from './runtime/cardProbabilities'

const COMBO_LABELS = { 2: 'GREAT', 3: 'AMAZING', 4: 'IMPRESSIVE', 5: 'AWESOME', 6: 'GOD IS PLAYING' }
const POST_GOD_LABELS = ['HAPPY BIRTHDAY', 'MY LORD', 'CHIRURGICAL', 'FIN LIMIER', 'OISEAU RARE', 'RENARD', 'LOUP', 'TIGRE', 'LION', 'DINOSAURE', 'METEORITE', 'SOLEIL', 'GALAXIE', 'COSMOS', 'UNIVERS', 'MULTIVERS', 'TROU NOIR', 'BIG BANG', 'QUANTIC AWERENESS', 'SOURCE VIBRATION', 'LOVE', 'PEACE', 'VOID', 'PURE ENERGY', 'PURE BODY', 'PURE MIND', 'PURE HEART', 'PURE SOUL', 'ANGEL', 'ARCHANGEL', 'DIVINE', 'DIVINE 2', 'DIVINE 3', 'DIVINE 4', 'DIVINE 5', 'DIVINE 6', 'DIVINE 7', 'DIVINE 8', 'DIVINE 9', 'DIVINE 10', 'DIVINE 1000', 'DIVINE 1M', 'DIVINE 1B', 'DIVINE 999T']
const SCORE_SCREEN_DELAY_MS = 2000
const GAME_OVER_BANNER_LEAD_MS = 1000
const WIN_OVERLAY_DURATION_MS = 1500
const MULTI_DECK_COMBO_BREAK_HOLD_MS = 1000
const COMBO_BREAK_COUNTDOWN_DURATION_MS = 2000
const COMBO_BREAK_COUNTDOWN_REFRESH_MS = 100
const GAMEPLAY_LOG_DURATION_MS = 2200
const POINT_REWARD_POPUP_DURATION_MS = 1600
const MORE_LESS_HINT_DURATION_MS = 1800
const PREDICTION_MISS_LABELS = ['no', 'retry', 'again']

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
const getCardType = (cardTypes, label) => cardTypes.find((card) => card.label === label)
function comboText(combo) {
  if (combo <= 6) return COMBO_LABELS[combo]
  return POST_GOD_LABELS[(combo - 7) % POST_GOD_LABELS.length]
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

function levelShareDetails(levelNumber, levelConfig) {
  const deckSize = Object.values(levelConfig.startingDeck).reduce((sum, amount) => sum + amount, 0)
  const jokerCount = levelConfig.startingDeck.joker || 0
  return {
    title: `LEVEL ${levelNumber} · ${levelConfig.name}`,
    summary: `${levelConfig.difficulty || 'Hard'} · ${deckSize} cards · ${jokerCount} jokers`
  }
}

function scoreShareMetrics(stars) {
  return {
    achievements: stars.find((star) => star.id === 'success')?.value || 0,
    precision: stars.find((star) => star.id === 'precision')?.valueText || '0%'
  }
}

function scoreShareText(score, best, stats, levelNumber, levelConfig, metrics) {
  const level = levelShareDetails(levelNumber, levelConfig)
  return `60game\n${level.title}\n${level.summary}\nScore ${score}\nBest ${best}\nHits ${stats.hits}\nBest combo x${Math.max(1, stats.bestCombo)}\nAchievements ${metrics.achievements}\nPrecision ${metrics.precision}`
}

function makeScoreImage(score, best, stats, levelNumber, levelConfig, metrics) {
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

    const level = levelShareDetails(levelNumber, levelConfig)
    context.fillStyle = '#ffffff'
    context.font = '900 32px system-ui, sans-serif'
    context.fillText(level.title, width / 2, 545)
    context.fillStyle = 'rgba(255, 255, 255, 0.66)'
    context.font = '700 26px system-ui, sans-serif'
    context.fillText(level.summary.toUpperCase(), width / 2, 585)

    const rows = [
      ['Hits', stats.hits],
      ['Best combo', `x${Math.max(1, stats.bestCombo)}`],
      ['Achievements', metrics.achievements],
      ['Precision', metrics.precision]
    ]
    context.textAlign = 'left'
    rows.forEach(([label, value], index) => {
      const y = 690 + index * 106
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

async function shareScore(score, best, stats, levelNumber, levelConfig, metrics) {
  const file = await makeScoreImage(score, best, stats, levelNumber, levelConfig, metrics)
  if (file && navigator.canShare?.({ files: [file] }) && navigator.share) {
    try {
      await navigator.share({ files: [file] })
      return
    } catch {
      return
    }
  }

  const text = scoreShareText(score, best, stats, levelNumber, levelConfig, metrics)
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

const MemoDeckStack = React.memo(DeckStack)

function FaceCard({ card, empty = false }) {
  if (!card || empty) return <div className="face-card empty-face"><strong>?</strong></div>
  return <div className={`face-card theme-${card.theme}`}><strong className={card.theme === 'joker' ? 'joker-face-text' : ''}>{card.label}</strong><span className="face-icon">{card.icon}</span></div>
}

const MemoFaceCard = React.memo(FaceCard)

function DeckGainPopup({ label, revealId, tone = 'points' }) {
  if (!label) return null
  return <motion.div key={`gain-${revealId}-${label}`} className={`gain-pop gain-pop-${tone}`} initial={{ opacity: 0, x: -8, y: 10, scale: .72 }} animate={{ opacity: [0, 1, 1, 0], x: [-8, 0, 5, 10], y: [10, -4, -14, -24], scale: [.72, 1.16, 1, .92] }} transition={{ duration: 1.05, times: [0, .18, .62, 1], ease: 'easeOut' }}>{label}</motion.div>
}

function getDeckGainPopup(card, won) {
  if (!won || !card) return null
  if (card.label === 'JOKER') return { label: 'J', tone: 'joker' }
  if (!card.value) return null
  return { label: `+${card.value}`, tone: 'points' }
}

function DiscardPile({ card, won, miss, revealId, showCombo }) {
  const stateClass = won ? 'impact-lite' : miss ? 'miss-shake' : ''
  const gainPopup = getDeckGainPopup(card, won)
  return <div className="discard-zone"><div className="plate plate-purple" /><div className={`discard-card-wrap ${stateClass}`}><div key={revealId} className="discard-drop"><MemoFaceCard card={card} empty={!card} /></div><AnimatePresence>{showCombo ? <motion.div className="local-combo-label" initial={{ opacity: 0, y: 14, scale: .7 }} animate={{ opacity: 1, y: -18, scale: 1 }} exit={{ opacity: 0, y: -32, scale: .8 }} transition={{ duration: .25 }}>COMBO</motion.div> : null}<DeckGainPopup label={gainPopup?.label} tone={gainPopup?.tone} revealId={revealId} /></AnimatePresence></div></div>
}

const MemoDiscardPile = React.memo(DiscardPile)

function PredictionCard({ card, index, remaining, onGuess, bumpKey, probability, isMostLikely }) {
  const unavailable = remaining <= 0
  function handlePress(event) {
    if (unavailable) {
      event.preventDefault()
      if (navigator.vibrate) navigator.vibrate([90, 35, 90])
      return
    }
    onGuess(card, index)
  }
  return <motion.button key={`${card.label}-${bumpKey || 0}`} className={`prediction-card theme-${card.theme} ${card.theme === 'joker' ? 'joker-prediction-card' : ''} ${isMostLikely ? 'most-likely' : ''}`} aria-disabled={unavailable} onClick={handlePress} whileTap={{ scale: unavailable ? 1 : 0.96 }} initial={{ scale: 1 }} animate={{ scale: bumpKey ? [1, 1.12, 0.96, 1] : 1 }} transition={{ duration: 0.34 }}><span className="prediction-value">{card.label}</span><span className="prediction-icon">{card.icon}</span>{probability !== undefined ? <span className="prediction-probability">{formatCardProbability(probability)}</span> : null}<span className="prediction-left">{remaining} LEFT</span></motion.button>
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
  return <motion.div className={`combo-table ${table.isMain ? 'main-combo-table' : ''} ${table.lastMiss ? 'combo-table-miss' : ''}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: .1 }}><MemoDeckStack remaining={table.deck.length} isMain={table.isMain} totalCards={totalCards} /><div className="arc-ribbon mini-ribbon" /><MemoDiscardPile card={table.lastCard} won={table.lastHit} miss={table.lastMiss} revealId={table.revealId} showCombo={table.showCombo} /></motion.div>
}

const MemoTableSlot = React.memo(TableSlot)

function LevelIntroCard({ level, levelNumber, totalCards, probabilitiesEnabled, onProbabilitiesChange, onClassic, onMoreLess }) {
  const jokerCount = level.startingDeck.joker || 0
  const nonJoker = Object.keys(level.startingDeck).filter((label) => label !== 'joker')
  return <section className="level-intro-overlay"><article className="level-intro-card"><span>Level {levelNumber}</span><em>{level.difficulty || 'Hard'} • {totalCards} cards • {jokerCount} jokers</em><p>{nonJoker.join(' / ')}</p><label className={`probability-option ${probabilitiesEnabled ? 'enabled' : ''}`}><input type="checkbox" checked={probabilitiesEnabled} onChange={(event) => onProbabilitiesChange(event.target.checked)} /><span className="probability-check" aria-hidden="true">✓</span><span className="probability-option-copy"><strong>Show draw probabilities</strong><small>Display each card's odds and highlight the best bet.</small></span></label><div className="level-intro-actions"><button className="level-intro-play level-intro-classic" onClick={onClassic}>Classic</button><button className="level-intro-play level-intro-more-less" onClick={onMoreLess}>More or less</button></div></article></section>
}


function MoreLessHintPopup({ hint }) {
  if (!hint) return null
  return <motion.div key={hint.id} className={`more-less-hint more-less-${hint.direction.toLowerCase()}`} initial={{ opacity: 0, y: 18, scale: .76 }} animate={{ opacity: [0, 1, 1, 0], y: [18, 0, -4, -18], scale: [.76, 1.08, 1, .92] }} exit={{ opacity: 0, y: -24, scale: .88 }} transition={{ duration: 1.5, times: [0, .16, .72, 1], ease: 'easeOut' }}><small>Next card</small><strong>{hint.direction}</strong></motion.div>
}

function ComboBreakCountdown({ from }) {
  const [value, setValue] = useState(from)
  useEffect(() => {
    const startedAt = performance.now()
    setValue(from)
    const timer = window.setInterval(() => {
      const elapsed = performance.now() - startedAt
      const nextValue = Math.max(0, Math.ceil(from * (1 - elapsed / COMBO_BREAK_COUNTDOWN_DURATION_MS)))
      setValue((currentValue) => currentValue === nextValue ? currentValue : nextValue)
      if (nextValue === 0) window.clearInterval(timer)
    }, COMBO_BREAK_COUNTDOWN_REFRESH_MS)
    return () => window.clearInterval(timer)
  }, [from])
  return <span className={value === 0 ? 'break-countdown zero' : 'break-countdown'}>x{value}</span>
}

function ComboBreakOverlay({ breakFx }) {
  if (!breakFx) return null
  return <div className="combo-break-overlay"><motion.div initial={{ opacity: 0, y: -26, scale: .68 }} animate={{ opacity: 1, y: 0, scale: [1, 1.06, 1] }} exit={{ opacity: 0, y: 34, scale: .88 }} transition={{ duration: .34 }}><strong>COMBO BREAK</strong><ComboBreakCountdown from={breakFx.from} /></motion.div></div>
}

function PointRewardStack({ rewards }) {
  return <div className="point-reward-stack"><AnimatePresence initial={false}>{rewards.map((reward) => <motion.div key={reward.id} className="point-reward-popup" initial={{ opacity: 0, x: 34, scale: .8 }} animate={{ opacity: [0, 1, 1, 0], x: [34, 0, 0, 18], scale: [.8, 1.08, 1, .94] }} exit={{ opacity: 0, x: 24, scale: .9 }} transition={{ duration: 1.5, times: [0, .16, .7, 1], ease: 'easeOut' }}><small>SUCCESS</small><strong>+{reward.points}</strong><span>{reward.label}</span></motion.div>)}</AnimatePresence></div>
}

function GameInfoButton({ isPressed, onPressChange }) {
  return <button className={`game-info-button ${isPressed ? 'pressed' : ''}`} type="button" aria-label="Show recent logs" aria-pressed={isPressed} onPointerDown={() => onPressChange(true)} onPointerUp={() => onPressChange(false)} onPointerLeave={() => onPressChange(false)} onPointerCancel={() => onPressChange(false)}>i</button>
}

function GameplayLogStack({ logs, onDismissOverflow }) {
  const stackRef = useRef(null)

  useLayoutEffect(() => {
    function dismissOverflowLogs() {
      const midpoint = window.innerHeight / 2
      const activeIds = new Set(logs.map((log) => log.id))
      const overflowingIds = Array.from(stackRef.current?.querySelectorAll('[data-gameplay-log-id]') || [])
        .filter((element) => activeIds.has(element.dataset.gameplayLogId) && element.getBoundingClientRect().bottom > midpoint)
        .map((element) => element.dataset.gameplayLogId)
      if (overflowingIds.length > 0) onDismissOverflow(overflowingIds)
    }

    const frameId = window.requestAnimationFrame(dismissOverflowLogs)
    window.addEventListener('resize', dismissOverflowLogs)
    return () => {
      window.cancelAnimationFrame(frameId)
      window.removeEventListener('resize', dismissOverflowLogs)
    }
  }, [logs, onDismissOverflow])

  return <div ref={stackRef} className="gameplay-log-stack"><AnimatePresence initial={false}>{logs.map((log) => <motion.div layout data-gameplay-log-id={log.id} key={log.id} className={`gameplay-log gameplay-log-${log.tone || log.category}`} initial={{ opacity: 0, y: -28, scale: .94 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 30, scale: .96 }} transition={{ duration: .3, ease: 'easeOut', layout: { duration: .24 } }}><span className="gameplay-log-marker">›</span><small>{log.category}</small><strong>{log.text}</strong></motion.div>)}</AnimatePresence></div>
}

function EndPanel({ score, best, stats, levelNumber, levelConfig, onReplay, onNext, onHome, stars, achievements }) {
  const unlockedStarsCount = stars.filter((star) => star.unlocked).length
  const shareMetrics = scoreShareMetrics(stars)
  const [showWinOverlay, setShowWinOverlay] = useState(unlockedStarsCount > 0)
  const [showAchievements, setShowAchievements] = useState(false)

  useEffect(() => {
    if (unlockedStarsCount <= 0) {
      setShowWinOverlay(false)
      return
    }
    setShowWinOverlay(true)
    const timer = window.setTimeout(() => setShowWinOverlay(false), WIN_OVERLAY_DURATION_MS)
    return () => window.clearTimeout(timer)
  }, [unlockedStarsCount])

  return <section className="end-screen session-panel"><AnimatePresence>{showWinOverlay ? <motion.div className="win-overlay" initial={{ opacity: 0, scale: 0.66, y: 26 }} animate={{ opacity: 1, scale: [1.12, 0.96, 1], y: 0 }} exit={{ opacity: 0, scale: 1.16, y: -28 }} transition={{ duration: 0.62, ease: 'easeOut' }}><div className="win-overlay-card"><span className="win-kicker">★ VICTORY ★</span><strong className="win-title">WIN</strong><small className="win-subtitle">DECK CLEARED</small></div></motion.div> : null}</AnimatePresence><span>Level {levelNumber}</span><strong>{score}</strong><em>Best {best}</em><div className="star-panel">{stars.map((star, index) => <motion.div key={star.id} className={`star-row ${star.unlocked ? 'on' : ''}`} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.25 + 0.1, duration: 0.25 }}><AnimatedMetric value={star.id === 'precision' ? Math.round(Number(star.value || 0) * 100) : star.value} suffix={star.id === 'precision' ? '%' : ''} className={`metric-${star.id} ${star.id === 'score' && Number(star.value || 0) >= 1000 ? 'metric-score-fit' : ''}`} bumpKey={`${star.id}-${star.unlocked ? 'on' : 'off'}`} /><StarDisplay unlocked={star.unlocked} size="lg" /><small>{star.targetText}</small></motion.div>)}</div><div className="session-stats"><div><small>Hits</small><b>{stats.hits}</b></div><div><small>Best combo</small><b>x{Math.max(1, stats.bestCombo)}</b></div><div><small>Achievements</small><b>{shareMetrics.achievements}</b></div><div><small>Precision</small><b>{shareMetrics.precision}</b></div></div><div className="session-actions"><div className="session-actions-row"><button onClick={onReplay}>Replay</button><button onClick={onNext}>Next</button></div><div className="session-actions-row session-actions-home"><button onClick={onHome}>Home</button></div><div className="session-actions-row"><button className="achievements-open" onClick={() => setShowAchievements(true)}>Achievements</button><button className="share-score" onClick={() => shareScore(score, best, stats, levelNumber, levelConfig, shareMetrics)}><WhatsAppIcon />Share</button></div></div><AnimatePresence>{showAchievements ? <AchievementsMenu achievements={achievements} levelConfig={levelConfig} onClose={() => setShowAchievements(false)} /> : null}</AnimatePresence></section>
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
  const [best, setBest] = useState(() => readStoredNumber('60game-best'))
  const [bets, setBets] = useState([])
  const [breakFx, setBreakFx] = useState(null)
  const [showEnd, setShowEnd] = useState(false)
  const [showLevelIntro, setShowLevelIntro] = useState(false)
  const [stats, setStats] = useState({ hits: 0, bestCombo: 0, maxDecks: 1, jokers: 0 })
  const [achievementRuntime, setAchievementRuntime] = useState(() => createAchievementRuntime(currentLevel))
  const [gameplayLogs, setGameplayLogs] = useState([])
  const [gameplayLogHistory, setGameplayLogHistory] = useState([])
  const [showRecentLogs, setShowRecentLogs] = useState(false)
  const [pointRewards, setPointRewards] = useState([])
  const [moreLessMode, setMoreLessMode] = useState(false)
  const [probabilitiesEnabled, setProbabilitiesEnabled] = useState(false)
  const [moreLessHint, setMoreLessHint] = useState(null)
  const [moreLessHintPresenceKey, setMoreLessHintPresenceKey] = useState(0)
  const gameplayLogTokenRef = useRef(0)
  const predictionMissRef = useRef(0)
  const [cardCountBumps, setCardCountBumps] = useState({})
  const comboBreakHoldRef = useRef(false)
  const [showGameOverBanner, setShowGameOverBanner] = useState(false)
  const [totalDrawn, setTotalDrawn] = useState(0)
  const [precisionHits, setPrecisionHits] = useState(0)
  const [progression, setProgression] = useState(() => readStoredObject('60game-progression'))
  const moreLessHintTokenRef = useRef(0)
  const levelNumber = orderedLevelIds.indexOf(selectedLevelId) + 1
  const totalCards = useMemo(() => Object.values(currentLevel.startingDeck).reduce((sum, amount) => sum + amount, 0), [currentLevel])

  const mainTable = tables.find((table) => table.isMain) || tables[0]
  const mainDeck = mainTable.deck
  const lastCard = mainTable.lastCard
  const cardTypeLabels = useMemo(() => cardTypes.map((type) => type.label), [cardTypes])
  const remainingByType = useMemo(() => countCardsByLabel(mainDeck, cardTypeLabels), [mainDeck, cardTypeLabels])
  const probabilityModel = useMemo(() => getCardProbabilityModel(remainingByType, mainDeck.length, probabilitiesEnabled), [remainingByType, mainDeck.length, probabilitiesEnabled])

  function scheduleFxClear(token, delay = 430) {
    window.setTimeout(() => {
      if (fxTokenRef.current !== token) return
      setTables((currentTables) => currentTables.map((table) => table.showCombo ? { ...table, showCombo: false } : table))
      setBreakFx(null)
    }, delay)
  }

  function showGameplayLog(category, text, tone = category, points = 0) {
    const id = `gameplay-log-${++gameplayLogTokenRef.current}`
    const log = { id, category, tone, text }
    setGameplayLogs((items) => [log, ...items].slice(0, 5))
    setGameplayLogHistory((items) => [log, ...items.filter((item) => item.id !== id)].slice(0, 5))
    window.setTimeout(() => setGameplayLogs((items) => items.filter((item) => item.id !== id)), GAMEPLAY_LOG_DURATION_MS)
    if (points > 0) {
      const reward = { id: `point-reward-${id}`, points, label: text.replace(/\s+\+\d+$/, '') }
      setPointRewards((items) => [...items, reward].slice(-4))
      window.setTimeout(() => setPointRewards((items) => items.filter((item) => item.id !== reward.id)), POINT_REWARD_POPUP_DURATION_MS)
    }
  }

  const dismissOverflowGameplayLogs = useCallback((ids) => {
    const overflowingIds = new Set(ids)
    setGameplayLogs((items) => {
      const visibleItems = items.filter((log) => !overflowingIds.has(log.id))
      return visibleItems.length === items.length ? items : visibleItems
    })
  }, [])

  function showPredictionReaction(type) {
    const text = type === 'success' ? 'YES!' : PREDICTION_MISS_LABELS[predictionMissRef.current++ % PREDICTION_MISS_LABELS.length]
    showGameplayLog('hit', text)
  }

  function clearMoreLessHint({ immediate = false } = {}) {
    moreLessHintTokenRef.current += 1
    if (immediate) setMoreLessHintPresenceKey((key) => key + 1)
    setMoreLessHint(null)
  }

  function showMoreLessHint(drawnCard, nextDeck, nextTableCount, currentTableCount) {
    if (!moreLessMode || currentTableCount !== 1 || nextTableCount !== 1 || !drawnCard || !nextDeck?.length) return
    const nextCard = peekNextDrawCard(nextDeck)
    const direction = getMoreLessHintDirection(drawnCard, nextCard)
    if (!direction) {
      clearMoreLessHint({ immediate: true })
      return
    }
    const token = ++moreLessHintTokenRef.current
    const id = `more-less-${token}`
    setMoreLessHint({ id, direction })
    window.setTimeout(() => {
      if (moreLessHintTokenRef.current !== token) return
      setMoreLessHint(null)
    }, MORE_LESS_HINT_DURATION_MS)
  }

  function startLevelIntro(mode) {
    setMoreLessMode(mode === 'more-less')
    clearMoreLessHint()
    setShowLevelIntro(false)
  }

  function newGame(levelId = selectedLevelId) {
    const activeLevel = levelConfigs[levelId] ?? levelConfigs[levelsRegistry.startingLevel]
    comboRef.current = 0
    fxTokenRef.current += 1
    comboBreakHoldRef.current = false
    predictionMissRef.current = 0
    previousUnlockedStarsRef.current = new Set()
    setMoreLessMode(false)
    setProbabilitiesEnabled(false)
    clearMoreLessHint()
    setTables(makeTables(buildDeckForLevel(activeLevel), 1)); setCombo(0); setScore(0); setScoreBump(0); setBets([]); setBreakFx(null); setShowEnd(false); setShowGameOverBanner(false); setStats({ hits: 0, bestCombo: 0, maxDecks: 1, jokers: 0 }); setShowLevelIntro(true); setStarted(true); setAchievementRuntime(createAchievementRuntime(activeLevel)); setGameplayLogs([]); setGameplayLogHistory([]); setShowRecentLogs(false); setPointRewards([]); setCardCountBumps({}); setTotalDrawn(0); setPrecisionHits(0)
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
    if (showEnd || showLevelIntro || comboBreakHoldRef.current) return
    fxTokenRef.current += 1
    const fxToken = fxTokenRef.current
    setTables((currentTables) => {
      const currentMain = currentTables.find((table) => table.isMain) || currentTables[0]
      if (!currentMain || currentMain.deck.length === 0) return currentTables
      const previousCombo = comboRef.current
      const betId = `bet-${Date.now()}-${buttonIndex}-${Math.random().toString(36).slice(2)}`
      const revealedTables = currentTables.map((table) => {
        const { drawnCard, nextDeck } = drawCard(table.deck)
        const hit = drawnCard?.label === label
        return { ...table, deck: nextDeck, lastCard: drawnCard, lastHit: hit, lastMiss: !hit, revealId: (table.revealId || 0) + 1, showCombo: false }
      })
      const hits = revealedTables.filter((table) => table.lastHit && table.lastCard)
      const precisionHitIncrement = getPrecisionHitIncrement(hits.length)
      setTotalDrawn((v) => v + 1)
      const isWin = precisionHitIncrement > 0
      const nextCombo = isWin ? previousCombo + 1 : 0
      const referenceTable = hits[0] || revealedTables.find((table) => table.isMain) || revealedTables[0]
      let referenceDeck = referenceTable.deck
      const roundPoints = hits.reduce((total, table) => total + (table.lastCard?.value || 0), 0)
      const jokerHits = hits.filter((table) => table.lastCard?.label === 'JOKER').length
      const jokerTriggered = jokerHits > 0
      const nextCount = activeTableCount(nextCombo)
      let orderedPrevious = revealedTables.map((table) => ({ ...table, showCombo: nextCombo >= 2 && table.lastHit }))
      let jokerScoreMultiplier = 1
      setBets((items) => [...items, { id: betId, card: predictedCard || getCardType(cardTypes, label), buttonIndex, result: 'pending' }])
      window.setTimeout(() => setBets((items) => items.map((bet) => bet.id === betId ? { ...bet, result: isWin ? 'win' : 'loss' } : bet)), 80)
      window.setTimeout(() => setBets((items) => items.filter((bet) => bet.id !== betId)), 420)
      if (navigator.vibrate) navigator.vibrate(isWin ? 18 : 8)
      if (isWin) {
        orderedPrevious = orderedPrevious.map((table) => {
          if (table.id === referenceTable.id) return table
          try {
            return { ...table, deck: reconcileDeckAfterWinningDraw(table.deck, table.lastCard, label) }
          } catch (error) {
            if (!(error instanceof DeckReconciliationError)) throw error
            console.warn(error.message, { tableId: table.id })
            return { ...table, deck: resyncDeckFromPromoted(referenceDeck) }
          }
        })
        showPredictionReaction('success')
        setPrecisionHits((v) => v + precisionHitIncrement)
        comboRef.current = nextCombo
        setCombo(nextCombo)
        setBreakFx(null)
        setStats((currentStats) => ({ hits: currentStats.hits + hits.length, bestCombo: Math.max(currentStats.bestCombo, nextCombo), maxDecks: Math.max(currentStats.maxDecks, nextCount), jokers: currentStats.jokers + jokerHits }))
        const unlockedAchievements = evaluateAchievements(achievementRuntime, { isWin: true, card: hits[0]?.lastCard, combo: nextCombo, levelConfig: currentLevel })
        unlockedAchievements.forEach((achievement) => showGameplayLog('success', `★ ${achievement.name}  +${achievement.pointsReward}`, 'success', Number(achievement.pointsReward || 0)))

        if (jokerTriggered) {
          const selectedPower = chooseWeightedJokerPower()
          if (selectedPower) {
            const handler = resolveJokerPowerHandler(selectedPower.handler)
            if (handler) {
              const cardId = Date.now()
              const beforeCounts = countCardsByLabel(referenceDeck)
              const makeCardFromLabel = (rawLabel) => {
                if (rawLabel === 'JOKER') return { label: 'JOKER', value: 0, theme: 'joker', icon: '♛', id: `joker-${cardId}-${Math.random().toString(36).slice(2, 8)}` }
                const value = Number(rawLabel)
                const existingType = cardTypes.find((type) => type.label === String(rawLabel))
                return { label: String(rawLabel), value, theme: existingType?.theme || 'green', icon: existingType?.icon || '◆', id: `num-${rawLabel}-${cardId}-${Math.random().toString(36).slice(2, 8)}` }
              }
              orderedPrevious = applyDeckMutationToTables(orderedPrevious, referenceTable.id, (deck) => handler.apply({ deck, levelConfig: currentLevel, makeCardFromLabel }, selectedPower.params))
              referenceDeck = orderedPrevious.find((table) => table.id === referenceTable.id)?.deck || referenceDeck
              if (selectedPower.handler === 'multiplyScore') jokerScoreMultiplier = Number(selectedPower?.params?.factor || 2)
              const afterCounts = countCardsByLabel(referenceDeck)
              const changed = cardTypes.map((type) => type.label).filter((label) => (afterCounts[label] || 0) !== (beforeCounts[label] || 0))
              if (changed.length > 0) setCardCountBumps((current) => changed.reduce((acc, label) => ({ ...acc, [label]: (acc[label] || 0) + 1 }), { ...current }))
              showGameplayLog('hit', selectedPower.popupText || 'JOKER  x1')
            }
          }
        }

        setScore((currentScore) => {
          const multiplied = currentScore * jokerScoreMultiplier
          const achievementPoints = unlockedAchievements.reduce((sum, a) => sum + Number(a.pointsReward || 0), 0)
          const nextScore = multiplied + roundPoints + achievementPoints
          setBest((currentBest) => { const nextBest = Math.max(currentBest, nextScore); writeStoredValue('60game-best', nextBest); return nextBest })
          return nextScore
        })
        setScoreBump((value) => value + 1)
        showMoreLessHint(referenceTable.lastCard, referenceDeck, nextCount, currentTables.length)
        if (nextCombo >= 2) {
          const title = comboText(nextCombo) || 'COMBO'
          showGameplayLog('combo', `${title}  x${nextCombo}`)
        }
        scheduleFxClear(fxToken, 430)
        if (fxTokenRef.current === fxToken && referenceDeck.length === 0) triggerEndSequence(fxToken)
        return makeTables(referenceDeck, nextCount, orderedPrevious, referenceTable.id)
      }
      showPredictionReaction('loss')
      evaluateAchievements(achievementRuntime, { isWin: false, card: referenceTable.lastCard, combo: 0, levelConfig: currentLevel })
      comboRef.current = 0
      setCombo(0)
      showMoreLessHint(referenceTable.lastCard, referenceDeck, 1, currentTables.length)
      if (previousCombo >= 2) showGameplayLog('combo', `COMBO BREAK  x${previousCombo}`, 'combo-break')
      setBreakFx(previousCombo >= 2 ? { id: fxToken, from: previousCombo } : null)
      scheduleFxClear(fxToken, previousCombo >= 2 ? 2400 : 220)
      if (fxTokenRef.current === fxToken && referenceDeck.length === 0) triggerEndSequence(fxToken)
      if (currentTables.length > 1) {
        comboBreakHoldRef.current = true
        window.setTimeout(() => {
          if (fxTokenRef.current !== fxToken) return
          comboBreakHoldRef.current = false
          setTables(makeTables(referenceDeck, 1, [referenceTable], referenceTable.id))
        }, MULTI_DECK_COMBO_BREAK_HOLD_MS)
        return revealedTables
      }
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
    fxTokenRef.current += 1
    comboBreakHoldRef.current = false
    setStarted(false)
    setShowEnd(false)
    setBreakFx(null)
    setGameplayLogs([])
    setGameplayLogHistory([])
    setShowRecentLogs(false)
    setPointRewards([])
    setBets([])
    setMoreLessMode(false)
    clearMoreLessHint()
    setShowLevelIntro(false)
    previousUnlockedStarsRef.current = new Set()
  }

  const runtimeStars = getStarModel(currentLevel, { achievementCount: achievementRuntime.filter((a) => a.unlocked).length, score, totalDrawn, precisionHits })
  const precisionPercentage = runtimeStars.find((star) => star.id === 'precision')?.valueText || '0%'
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
    const starLogEntries = []
    const ts = Date.now()
    const hasDrawnHalfDeck = totalDrawn >= Math.ceil(totalCards / 2)
    freshlyUnlocked.forEach((star, index) => {
      if (star.id === 'precision' && !hasDrawnHalfDeck) return
      starLogEntries.push({ id: `star-${star.id}-${ts}-${index}-${Math.random().toString(36).slice(2, 6)}`, name: star.name, state: 'unlocked' })
    })
    if (lostPrecision && hasDrawnHalfDeck) starLogEntries.push({ id: `star-precision-lost-${ts}-${Math.random().toString(36).slice(2, 6)}`, name: 'Precision', state: 'lost' })
    starLogEntries.forEach((entry) => showGameplayLog(entry.state === 'lost' ? 'hit' : 'success', `★ ${entry.name} STAR  ${entry.state === 'lost' ? 'LOST' : 'UNLOCKED'}`))
    previousUnlockedStarsRef.current = new Set(nextUnlocked.map((s) => s.id))
  }, [started, showEnd, unlockedStarIds, totalDrawn, totalCards])
  useEffect(() => {
    const stars = runtimeStars.filter((s) => s.unlocked).length
    if (!showEnd) return
    setProgression((current) => {
      const next = { ...current, [selectedLevelId]: { stars: Math.max(current[selectedLevelId]?.stars || 0, stars), bestScore: Math.max(current[selectedLevelId]?.bestScore || 0, score), achievements: Math.max(current[selectedLevelId]?.achievements || 0, achievementRuntime.filter((a) => a.unlocked).length) } }
      writeStoredValue('60game-progression', JSON.stringify(next))
      return next
    })
  }, [showEnd, selectedLevelId, score])

  const visibleGameplayLogs = showRecentLogs ? gameplayLogHistory : gameplayLogs
  const gameplayIsVisible = !showLevelIntro
  const gameOver = started && showEnd
  return <main className={`game-shell ${started ? 'in-game' : 'home-mode'}`}><div className="cinematic-bg" />{!started ? <section className="start-screen level-select"><span>60game</span><strong>60 Game</strong><em>Select a level</em><div className="level-select-grid">{orderedLevelIds.map((id) => { const level = levelConfigs[id]; if (!level) return null; const nonJoker = Object.keys(level.startingDeck).filter((label) => label !== 'joker'); const deckSize = Object.values(level.startingDeck).reduce((sum, amount) => sum + amount, 0); const jokerCount = level.startingDeck.joker || 0; const active = selectedLevelId === id; const saved = progression[id] || {}; return <button key={id} className={`level-pick ${active ? 'active' : ''}`} onClick={() => { setSelectedLevelId(id); newGame(id) }}><b>{level.name}</b><small>{level.difficulty || 'Hard'} • {deckSize} cards • {jokerCount} jokers</small><span>{nonJoker.join(' / ')}</span><div className='mini-stars'>{[0,1,2].map((i)=><StarDisplay key={i} unlocked={(saved.stars||0)>i} size="md" className="mini-star" />)}</div></button> })}</div></section> : gameOver ? <EndPanel score={score} best={best} stats={stats} levelNumber={levelNumber} levelConfig={currentLevel} onReplay={() => newGame(selectedLevelId)} onNext={nextLevel} onHome={goHome} stars={runtimeStars} achievements={achievementRuntime} /> : <><header className="top-stats"><Stat tone="gold" icon="🏆" label="Score" value={score} bumpKey={scoreBump} /><Stat tone="purple" icon="♛" label="Best" value={best} /><Stat tone="green" icon="◎" label="Precision" value={precisionPercentage} /></header><ComboStatus combo={combo} /><section className="quick-info"><div><span>LEVEL</span><strong>{levelNumber}</strong></div><div><span>CARDS</span><strong>{totalCards}</strong></div></section>{gameplayIsVisible ? <><section className={`play-stage multideck-stage ${tableLayoutClass(tables.length)}`}><AnimatePresence>{tables.map((table) => <MemoTableSlot key={table.id} table={table} totalCards={totalCards} />)}</AnimatePresence><AnimatePresence>{bets.map((bet) => <BetClone key={bet.id} bet={bet} />)}</AnimatePresence></section><GameInfoButton isPressed={showRecentLogs} onPressChange={setShowRecentLogs} /><GameplayLogStack logs={visibleGameplayLogs} onDismissOverflow={dismissOverflowGameplayLogs} /><PointRewardStack rewards={pointRewards} /><AnimatePresence key={moreLessHintPresenceKey}>{moreLessHint ? <MoreLessHintPopup hint={moreLessHint} /> : null}</AnimatePresence><AnimatePresence>{breakFx ? <ComboBreakOverlay key={breakFx.id} breakFx={breakFx} /> : null}</AnimatePresence><section className="prediction-grid">{cardTypes.map((card, index) => <PredictionCard key={card.label} card={card} index={index} remaining={remainingByType[card.label] ?? 0} probability={probabilitiesEnabled ? probabilityModel.percentages[card.label] : undefined} isMostLikely={probabilitiesEnabled && probabilityModel.mostLikelyLabels.has(card.label)} onGuess={guess} bumpKey={cardCountBumps[card.label]} />)}</section></> : null}<AnimatePresence>{showGameOverBanner ? <motion.div className='game-over-banner' initial={{ opacity: 0, scale: 0.8, y: 20 }} animate={{ opacity: 1, scale: [1.1, 1], y: 0 }} exit={{ opacity: 0, scale: 1.2, y: -26 }} transition={{ duration: 0.42, ease: 'easeOut' }}>END OF DECK</motion.div> : null}</AnimatePresence>{showLevelIntro ? <LevelIntroCard level={currentLevel} levelNumber={levelNumber} totalCards={totalCards} probabilitiesEnabled={probabilitiesEnabled} onProbabilitiesChange={setProbabilitiesEnabled} onClassic={() => startLevelIntro('classic')} onMoreLess={() => startLevelIntro('more-less')} /> : null}</>}</main>
}

class AppErrorBoundary extends React.Component {
  state = { error: null }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error) {
    console.error('Unable to start 60game.', error)
  }

  render() {
    if (this.state.error) return <main className="startup-error"><strong>60game</strong><p>Unable to load the game. Please refresh the page.</p></main>
    return this.props.children
  }
}

ReactDOM.createRoot(document.getElementById('app')).render(<AppErrorBoundary><App /></AppErrorBoundary>)
