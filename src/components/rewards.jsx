import React from 'react'
import { motion } from 'framer-motion'

export function StarDisplay({ unlocked, size = 'md', className = '' }) {
  return <span className={`reward-star ${unlocked ? 'is-on' : 'is-off'} size-${size} ${className}`} aria-hidden="true">★</span>
}

export function AnimatedMetric({ value, bumpKey, suffix = '', className = '' }) {
  return <motion.strong key={`${bumpKey}-${value}`} className={`animated-metric ${className}`} initial={{ scale: 0.72, opacity: 0, y: 10 }} animate={{ scale: [1.22, 0.94, 1], opacity: 1, y: 0 }} transition={{ duration: 0.54, times: [0, 0.56, 1], ease: [0.2, 0.95, 0.2, 1] }}>{value}{suffix}</motion.strong>
}

export function StarPopup({ popup }) {
  return <motion.div className="reward-popup star-popup" initial={{ opacity: 0, y: 36, scale: 0.35, rotate: -10 }} animate={{ opacity: [0, 1, 0.4], y: [36, -4, -22], scale: [0.35, 1.18, 1], rotate: [-10, 5, -2] }} exit={{ opacity: 0, y: -38, scale: 0.88 }} transition={{ duration: 4, ease: 'easeOut' }}><StarDisplay unlocked size="xl" /><div><b>{popup.name} Star</b><small>Unlocked</small></div></motion.div>
}
