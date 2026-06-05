import { motion } from 'framer-motion'
import { TUTORIAL_TEXT } from '../runtime/tutorial'

function TutorialProgress({ currentStepId, steps }) {
  const currentIndex = Math.max(0, steps.findIndex((step) => step.id === currentStepId))

  return <div className="tutorial-progress" aria-label={`Tutorial progress ${currentIndex + 1} of ${steps.length}`}>
    {steps.map((step, index) => <span key={step.id} className={index <= currentIndex ? 'active' : ''} />)}
  </div>
}

export function TutorialHomePanel({ onStart }) {
  return <section className="tutorial-home-panel" aria-label={TUTORIAL_TEXT.homeTitle}>
    <div>
      <strong>{TUTORIAL_TEXT.homeTitle}</strong>
      <p>{TUTORIAL_TEXT.homeHint}</p>
    </div>
    <button type="button" className="tutorial-start-button" onClick={onStart}>{TUTORIAL_TEXT.homeStart}</button>
  </section>
}

export function TutorialOverlay({ step, steps, active, onNext, onFinish, onClose }) {
  if (!active || !step) return null

  const waitsForPlayer = step.action === 'guess' || step.action === 'choose-mode'
  const isFinal = step.action === 'finish'

  return <motion.aside className={`tutorial-overlay tutorial-target-${step.target}`} initial={{ opacity: 0, y: 16, scale: .96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 18, scale: .96 }} transition={{ duration: .22, ease: 'easeOut' }} aria-live="polite">
    <div className="tutorial-card">
      <button type="button" className="tutorial-close" onClick={onClose} aria-label={TUTORIAL_TEXT.close}>×</button>
      <TutorialProgress currentStepId={step.id} steps={steps} />
      <span className="tutorial-kicker">{TUTORIAL_TEXT.pause}</span>
      <strong>{step.title}</strong>
      <p>{step.body}</p>
      {waitsForPlayer ? <small className="tutorial-waiting">{TUTORIAL_TEXT.waiting}</small> : null}
      <div className="tutorial-actions">
        {isFinal ? <button type="button" className="tutorial-primary" onClick={onFinish}>{TUTORIAL_TEXT.finish}</button> : waitsForPlayer ? null : <button type="button" className="tutorial-primary" onClick={onNext}>{TUTORIAL_TEXT.next}</button>}
      </div>
    </div>
  </motion.aside>
}
