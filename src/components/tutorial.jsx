import { motion } from 'framer-motion'
import { TUTORIAL_HOME_KEYS } from '../runtime/tutorial'

function TutorialProgress({ currentStepId, steps, t }) {
  const currentIndex = Math.max(0, steps.findIndex((step) => step.id === currentStepId))

  return <div className="tutorial-progress" aria-label={t('tutorial.progress', { current: currentIndex + 1, total: steps.length })}>
    {steps.map((step, index) => <span key={step.id} className={index <= currentIndex ? 'active' : ''} />)}
  </div>
}

export function TutorialHomePanel({ onStart, t }) {
  return <section className="tutorial-home-panel" aria-label={t(TUTORIAL_HOME_KEYS.homeTitle)}>
    <div>
      <strong>{t(TUTORIAL_HOME_KEYS.homeTitle)}</strong>
      <p>{t(TUTORIAL_HOME_KEYS.homeHint)}</p>
    </div>
    <button type="button" className="tutorial-start-button" onClick={onStart}>{t(TUTORIAL_HOME_KEYS.homeStart)}</button>
  </section>
}

export function TutorialOverlay({ step, steps, active, onNext, onFinish, onClose, t }) {
  if (!active || !step) return null

  const waitsForPlayer = step.action === 'guess' || step.action === 'choose-mode'
  const isFinal = step.action === 'finish'

  return <motion.aside className={`tutorial-overlay tutorial-target-${step.target}`} initial={{ opacity: 0, y: 16, scale: .96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 18, scale: .96 }} transition={{ duration: .22, ease: 'easeOut' }} aria-live="polite">
    <div className="tutorial-card">
      <button type="button" className="tutorial-close" onClick={onClose} aria-label={t(TUTORIAL_HOME_KEYS.close)}>×</button>
      <TutorialProgress currentStepId={step.id} steps={steps} t={t} />
      <span className="tutorial-kicker">{t(TUTORIAL_HOME_KEYS.pause)}</span>
      <strong>{t(step.titleKey)}</strong>
      <p>{t(step.bodyKey)}</p>
      {waitsForPlayer ? <small className="tutorial-waiting">{t(TUTORIAL_HOME_KEYS.waiting)}</small> : null}
      <div className="tutorial-actions">
        {isFinal ? <button type="button" className="tutorial-primary" onClick={onFinish}>{t(TUTORIAL_HOME_KEYS.finish)}</button> : waitsForPlayer ? null : <button type="button" className="tutorial-primary" onClick={onNext}>{t(TUTORIAL_HOME_KEYS.next)}</button>}
      </div>
    </div>
  </motion.aside>
}
