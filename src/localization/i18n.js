import texts from './texts.json'

export const DEFAULT_LANGUAGE = 'en'
export const SUPPORTED_LANGUAGES = ['en', 'fr']
export const LANGUAGE_STORAGE_KEY = '60game-language'

export function normalizeLanguage(language) {
  return SUPPORTED_LANGUAGES.includes(language) ? language : DEFAULT_LANGUAGE
}

export function translate(language, key, params = {}) {
  const entry = texts[key]
  const template = entry?.[normalizeLanguage(language)] ?? entry?.[DEFAULT_LANGUAGE] ?? key
  return Object.entries(params).reduce((value, [name, replacement]) => value.replaceAll(`{${name}}`, String(replacement)), template)
}

export function makeTranslator(language) {
  return (key, params) => translate(language, key, params)
}
