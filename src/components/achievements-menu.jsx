import React from 'react'
import { motion } from 'framer-motion'
import { StarDisplay } from './rewards'

function achievementCriterion(config, levelConfig, t) {
  const params = config.params || {}
  const numericCards = Object.entries(levelConfig?.startingDeck || {}).filter(([label]) => label !== 'joker').map(([label, count]) => ({ label, value: Number(label), count: Number(count) || 0 }))
  if (config.handler === 'comboThreshold') return t('achievementCriterion.comboThreshold', { target: params.target })
  if (config.handler === 'topValuePair') {
    const card = [...numericCards].sort((a, b) => b.value - a.value)[Number(params.rank || 1) - 1]
    return t('achievementCriterion.topValuePair', { card: card?.label || '?', count: params.count || 2 })
  }
  if (config.handler === 'rankStreak') {
    const card = [...numericCards].sort((a, b) => (b.count - a.count) || (a.value - b.value))[Number(params.rankIndex || 2) - 1]
    return t('achievementCriterion.rankStreak', { card: card?.label || '?', count: params.count || 2 })
  }
  return t(`achievementDescription.${config.id}`)
}

export function AchievementsMenu({ achievements, levelConfig, onClose, t }) {
  const achievementStarWinner = achievements.find((achievement) => achievement.unlockedOrder === 1)

  return <motion.section className="achievements-menu" role="dialog" aria-modal="true" aria-labelledby="achievements-title" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
    <div className="achievements-menu-card">
      <button className="achievements-menu-close" type="button" onClick={onClose} aria-label={t('achievements.closeMenu')}>×</button>
      <header className="achievements-menu-header">
        <span>{t('achievements.endOfDeck')}</span>
        <h2 id="achievements-title">{t('achievements.title')}</h2>
        <p><StarDisplay unlocked size="md" /> {t('achievements.summary').split('·')[0].trim()} · <b className="achievement-star-big">★</b> {t('achievements.summary').split('·')[1].trim()}</p>
      </header>
      <div className="achievements-table-wrap">
        <table className="achievements-table">
          <thead><tr><th aria-label={t('achievements.rewardLabel')} /><th>{t('achievements.column.achievement')}</th><th>{t('achievements.column.how')}</th><th>{t('achievements.column.points')}</th></tr></thead>
          <tbody>{achievements.map((achievement) => {
            const isAchievementStarWinner = achievementStarWinner?.config.id === achievement.config.id
            return <tr key={achievement.config.id} className={achievement.unlocked ? 'is-earned' : ''}>
              <td className="achievement-earned-marker">{achievement.unlocked ? <StarDisplay unlocked size={isAchievementStarWinner ? 'lg' : 'md'} /> : null}</td>
              <td className="achievement-name"><strong>{t(`achievementName.${achievement.config.id}`)}</strong></td>
              <td className="achievement-criterion">{achievementCriterion(achievement.config, levelConfig, t)}</td>
              <td className="achievement-points"><b>+{achievement.config.pointsReward}</b></td>
            </tr>
          })}</tbody>
        </table>
      </div>
    </div>
  </motion.section>
}
