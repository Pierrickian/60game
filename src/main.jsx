import React from 'react'
import ReactDOM from 'react-dom/client'
import { motion } from 'framer-motion'
import './style.css'

const CARD_TYPES = [
  { label: '2', count: 30, theme: 'green' },
  { label: '5', count: 12, theme: 'blue' },
  { label: '10', count: 6, theme: 'purple' },
  { label: '15', count: 4, theme: 'orange' },
  { label: '20', count: 3, theme: 'red' },
  { label: '30', count: 2, theme: 'cyan' },
  { label: '60', count: 1, theme: 'gold' },
  { label: 'JOKER', count: 2, theme: 'black' }
]

function App() {
  return (
    <main className="react-shell">
      <canvas className="fx-canvas" />

      <header className="react-hud">
        <div className="hud-card gold">
          <span>SCORE</span>
          <strong>21</strong>
        </div>

        <div className="hud-card purple">
          <span>BEST</span>
          <strong>120</strong>
        </div>

        <div className="hud-card green">
          <span>LEFT</span>
          <strong>39</strong>
        </div>
      </header>

      <section className="react-stage">
        <div className="deck-column">
          <div className="base-glow blue-glow" />

          <motion.div
            className="deck-stack-react"
            animate={{ y: [0, -10, 0] }}
            transition={{ repeat: Infinity, duration: 2.4 }}
          >
            <div className="deck-layer layer-back" />
            <div className="deck-layer layer-mid" />
            <div className="deck-card-react">
              <span>60</span>
              <small>GAME</small>
            </div>
          </motion.div>
        </div>

        <div className="arc-container">
          <div className="light-arc" />

          <motion.div
            className="flying-card theme-green"
            initial={{ x: -120, y: 30, rotate: -18, scale: 0.8 }}
            animate={{ x: 120, y: -30, rotate: 12, scale: 1 }}
            transition={{ duration: 0.55 }}
          >
            <span className="mini-corner">2</span>
            <strong>2</strong>
          </motion.div>
        </div>

        <div className="discard-column">
          <div className="base-glow purple-glow" />

          <motion.div
            className="play-card-react theme-green"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            <span className="mini-corner">2</span>
            <strong>2</strong>
            <span className="mini-corner bottom">2</span>
          </motion.div>

          <motion.div
            className="score-popup"
            initial={{ opacity: 0, y: 40, scale: 0.7 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.25 }}
          >
            +2
          </motion.div>
        </div>
      </section>

      <section className="react-grid">
        {CARD_TYPES.map((card) => (
          <motion.button
            key={card.label}
            whileTap={{ scale: 0.95 }}
            whileHover={{ scale: 1.03 }}
            className={`predict-card ${card.theme}`}
          >
            <div className="predict-value">{card.label}</div>
            <div className="predict-left">{card.count} LEFT</div>
          </motion.button>
        ))}
      </section>
    </main>
  )
}

ReactDOM.createRoot(document.getElementById('app')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
