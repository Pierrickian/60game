import { createChipSynth } from './chipSynth'

const SUCCESS_MELODY = ['C5', 'E5', 'G5', 'A5']
const FAILURE_RECOVERY = ['A4', 'G4', 'C5']
const HOPE_LOOP = ['C4', 'G4', 'A4', 'E4']

export function createAdaptiveMusicSystem() {
  const synth = createChipSynth()

  if (!synth) {
    return {
      start: () => {},
      onSuccess: () => {},
      onFailure: () => {},
      setIntensity: () => {},
      destroy: () => {}
    }
  }

  let interval = null
  let hopeIndex = 0
  let intensity = 0

  function pulseHopeLoop() {
    const note = HOPE_LOOP[hopeIndex % HOPE_LOOP.length]
    const time = synth.context.currentTime

    synth.playTone({
      note,
      start: time,
      duration: 0.22,
      gain: 0.18 + intensity * 0.03,
      type: 'square'
    })

    synth.playTone({
      note,
      start: time + 0.08,
      duration: 0.12,
      gain: 0.08,
      type: 'triangle',
      detune: -12
    })

    hopeIndex += 1
  }

  async function start() {
    await synth.resume()

    if (interval) return

    pulseHopeLoop()
    interval = window.setInterval(pulseHopeLoop, 480)
  }

  function onSuccess(combo = 1) {
    const time = synth.context.currentTime
    SUCCESS_MELODY.forEach((note, index) => {
      synth.playTone({
        note,
        start: time + index * 0.05,
        duration: 0.16 + combo * 0.01,
        gain: Math.min(0.42, 0.16 + combo * 0.02),
        type: combo >= 4 ? 'sawtooth' : 'square'
      })
    })

    if (combo >= 3) {
      synth.playNoise({
        start: time,
        duration: 0.05,
        gain: 0.08 + combo * 0.01
      })
    }

    intensity = Math.min(4, intensity + 0.35)
  }

  function onFailure(previousCombo = 0) {
    const time = synth.context.currentTime

    FAILURE_RECOVERY.forEach((note, index) => {
      synth.playTone({
        note,
        start: time + index * 0.09,
        duration: 0.18,
        gain: previousCombo >= 3 ? 0.22 : 0.14,
        type: 'triangle'
      })
    })

    intensity = Math.max(0, intensity - 0.8)
  }

  function setIntensity(value) {
    intensity = Math.max(0, Math.min(4, value))
    synth.setVolume(0.03 + intensity * 0.008)
  }

  function destroy() {
    if (interval) {
      window.clearInterval(interval)
      interval = null
    }

    synth.close()
  }

  return {
    start,
    onSuccess,
    onFailure,
    setIntensity,
    destroy
  }
}
