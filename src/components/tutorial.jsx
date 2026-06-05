import { motion } from 'framer-motion'
import { TUTORIAL_TEXT } from '../runtime/tutorial'

function TutorialProgress({ currentStepId, steps }) {
  const currentIndex = Math.max(0, steps.findIndex((step) => step.id === currentStepId))

  return <div className="tutorial-progress" aria-label={`Tutorial step ${currentIndex + 1} of ${steps.length}`}>
    {steps.map((step, index) => <span key={step.id} className={index <= currentIndex ? 'active' : ''} />)}
  </div>
}

export function TutorialHomePanel({ disabled, onStart, onToggleDisabled }) {
  return <section className={`tutorial-home-panel ${disabled ? 'disabled' : ''}`} aria-label={TUTORIAL_TEXT.homeTitle}>
    <div>
      <strong>{TUTORIAL_TEXT.homeTitle}</strong>
      <p>{disabled ? TUTORIAL_TEXT.homeEnableHint : TUTORIAL_TEXT.homeHint}</p>
    </div>
    <div className="tutorial-home-actions">
      <button type="button" className="tutorial-start-button" onClick={onStart} disabled={disabled}>{disabled ? TUTORIAL_TEXT.homeDisabled : TUTORIAL_TEXT.homeStart}</button>
      <button type="button" className="tutorial-toggle-button" onClick={() => onToggleDisabled(!disabled)}>{disabled ? TUTORIAL_TEXT.homeEnable : TUTORIAL_TEXT.homeDisable}</button>
    </div>
  </section>
}

export function TutorialOverlay({ step, steps, active, onNext, onFinish, onDisable, onClose }) {
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
        <button type="button" className="tutorial-secondary" onClick={onDisable}>{TUTORIAL_TEXT.disableForever}</button>
      </div>
    </div>
  </motion.aside>
}
