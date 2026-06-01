function browserStorage() {
  try {
    return globalThis.localStorage || null
  } catch {
    return null
  }
}

export function readStoredNumber(key, fallback = 0) {
  try {
    const value = Number(browserStorage()?.getItem(key))
    return Number.isFinite(value) ? value : fallback
  } catch {
    return fallback
  }
}

export function readStoredObject(key, fallback = {}) {
  try {
    const rawValue = browserStorage()?.getItem(key)
    if (!rawValue) return fallback
    const value = JSON.parse(rawValue)
    return value && typeof value === 'object' && !Array.isArray(value) ? value : fallback
  } catch {
    return fallback
  }
}

export function writeStoredValue(key, value) {
  try {
    browserStorage()?.setItem(key, String(value))
  } catch {
    // Storage can be unavailable in privacy-restricted browser contexts.
  }
}
