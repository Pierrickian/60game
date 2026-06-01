import React from 'react'
import { motion } from 'framer-motion'
import { StarDisplay } from './rewards'

function achievementCriterion(config, levelConfig) {
  const params = config.params || {}
  const numericCards = Object.entries(levelConfig?.startingDeck || {}).filter(([label]) => label !== 'joker').map(([label, count]) => ({ label, value: Number(label), count: Number(count) || 0 }))
  if (config.handler === 'comboThreshold') return `Reach a x${params.target} combo`
  if (config.handler === 'topValuePair') {
    const card = [...numericCards].sort((a, b) => b.value - a.value)[Number(params.rank || 1) - 1]
    return `Match card ${card?.label || '?'} ${params.count || 2} times in a row`
  }
  if (config.handler === 'rankStreak') {
    const card = [...numericCards].sort((a, b) => (b.count - a.count) || (a.value - b.value))[Number(params.rankIndex || 2) - 1]
    return `Match card ${card?.label || '?'} ${params.count || 2} times in a row`
  }
  return config.description
}

export function AchievementsMenu({ achievements, levelConfig, onClose }) {
  const achievementStarWinner = achievements.find((achievement) => achievement.unlockedOrder === 1)

  return <motion.section className="achievements-menu" role="dialog" aria-modal="true" aria-labelledby="achievements-title" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
    <div className="achievements-menu-card">
      <button className="achievements-menu-close" type="button" onClick={onClose} aria-label="Close achievements menu">×</button>
      <header className="achievements-menu-header">
        <span>End of deck</span>
        <h2 id="achievements-title">Achievements</h2>
        <p><StarDisplay unlocked size="md" /> earned this game · <b className="achievement-star-big">★</b> unlocked the achievement star</p>
      </header>
      <div className="achievements-table-wrap">
        <table className="achievements-table">
          <thead><tr><th aria-label="Game reward" /><th>Achievement</th><th>How to unlock</th><th>Points</th></tr></thead>
          <tbody>{achievements.map((achievement) => {
            const isAchievementStarWinner = achievementStarWinner?.config.id === achievement.config.id
            return <tr key={achievement.config.id} className={achievement.unlocked ? 'is-earned' : ''}>
              <td className="achievement-earned-marker">{achievement.unlocked ? <StarDisplay unlocked size={isAchievementStarWinner ? 'lg' : 'md'} /> : null}</td>
              <td className="achievement-name"><strong>{achievement.config.name}</strong></td>
              <td className="achievement-criterion">{achievementCriterion(achievement.config, levelConfig)}</td>
              <td className="achievement-points"><b>+{achievement.config.pointsReward}</b></td>
            </tr>
          })}</tbody>
        </table>
      </div>
    </div>
  </motion.section>
}
