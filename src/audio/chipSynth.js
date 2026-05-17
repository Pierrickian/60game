const DEFAULT_MASTER_GAIN = 0.035
const SILENCE_GAIN = 0.0001

const noteToFrequency = (note) => {
  const match = /^([A-G])(#|b)?(\d)$/.exec(note)
  if (!match) return 440

  const [, rawName, accidental = '', rawOctave] = match
  const semitones = {
    C: -9,
    D: -7,
    E: -5,
    F: -4,
    G: -2,
    A: 0,
    B: 2
  }
  const accidentalOffset = accidental === '#' ? 1 : accidental === 'b' ? -1 : 0
  const octave = Number(rawOctave)
  const distanceFromA4 = semitones[rawName] + accidentalOffset + (octave - 4) * 12
  return 440 * 2 ** (distanceFromA4 / 12)
}

const safeSetTarget = (param, value, when, timeConstant = 0.01) => {
  param.cancelScheduledValues(when)
  param.setTargetAtTime(value, when, timeConstant)
}

export function createChipSynth() {
  const AudioContextClass = window.AudioContext || window.webkitAudioContext
  if (!AudioContextClass) return null

  const context = new AudioContextClass()
  const master = context.createGain()
  master.gain.value = DEFAULT_MASTER_GAIN
  master.connect(context.destination)

  function playTone({ note, frequency, start = context.currentTime, duration = 0.12, type = 'square', gain = 0.45, detune = 0 }) {
    const oscillator = context.createOscillator()
    const envelope = context.createGain()
    oscillator.type = type
    oscillator.frequency.value = frequency || noteToFrequency(note)
    oscillator.detune.value = detune
    envelope.gain.value = SILENCE_GAIN

    oscillator.connect(envelope)
    envelope.connect(master)

    safeSetTarget(envelope.gain, gain, start, 0.006)
    safeSetTarget(envelope.gain, SILENCE_GAIN, start + duration * 0.72, 0.018)

    oscillator.start(start)
    oscillator.stop(start + duration + 0.08)
  }

  function playNoise({ start = context.currentTime, duration = 0.04, gain = 0.24 } = {}) {
    const bufferSize = Math.max(1, Math.floor(context.sampleRate * duration))
    const buffer = context.createBuffer(1, bufferSize, context.sampleRate)
    const data = buffer.getChannelData(0)
    for (let index = 0; index < bufferSize; index += 1) {
      data[index] = Math.random() * 2 - 1
    }

    const source = context.createBufferSource()
    const envelope = context.createGain()
    source.buffer = buffer
    envelope.gain.value = SILENCE_GAIN
    source.connect(envelope)
    envelope.connect(master)
    safeSetTarget(envelope.gain, gain, start, 0.004)
    safeSetTarget(envelope.gain, SILENCE_GAIN, start + duration * 0.45, 0.012)
    source.start(start)
    source.stop(start + duration + 0.04)
  }

  async function resume() {
    if (context.state === 'suspended') await context.resume()
  }

  function setVolume(value) {
    const clamped = Math.max(0, Math.min(0.12, value))
    safeSetTarget(master.gain, clamped, context.currentTime, 0.08)
  }

  function close() {
    if (context.state !== 'closed') context.close()
  }

  return {
    context,
    playTone,
    playNoise,
    resume,
    setVolume,
    close
  }
}
