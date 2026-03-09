const TITLE_TOKENS = new Set(['seu', 'dona', 'senhor', 'senhora', 'sr', 'sra'])

export function normalizePersonNameInput(value: string): string {
  return value.trim().replace(/\s+/g, ' ')
}

function stripAccents(value: string): string {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
}

function extractLetters(value: string): string {
  return Array.from(value).filter((char) => /\p{L}/u.test(char)).join('')
}

function isVowel(char: string): boolean {
  const base = stripAccents(char).toLowerCase()
  return ['a', 'e', 'i', 'o', 'u', 'y'].includes(base)
}

function countVowels(value: string): number {
  return Array.from(value).filter(isVowel).length
}

function longestConsonantRun(value: string): number {
  let longest = 0
  let current = 0

  for (const char of value) {
    if (!/\p{L}/u.test(char) || isVowel(char)) {
      current = 0
      continue
    }

    current += 1
    longest = Math.max(longest, current)
  }

  return longest
}

function looksRandom(token: string): boolean {
  const letters = extractLetters(token).toLowerCase()
  if (letters.length < 3) {
    return false
  }

  const vowels = countVowels(letters)
  if (vowels === 0) {
    return true
  }

  return letters.length >= 6 && vowels === 1 && longestConsonantRun(letters) >= 5
}

export function isLikelyValidPersonName(value: string): boolean {
  const normalized = normalizePersonNameInput(value)
  if (!normalized) {
    return false
  }

  const allLetters = extractLetters(normalized)
  if (allLetters.length < 2) {
    return false
  }

  if (!Array.from(allLetters).some(isVowel)) {
    return false
  }

  const meaningfulParts = normalized
    .split(' ')
    .map(extractLetters)
    .filter(Boolean)
    .filter((part) => !TITLE_TOKENS.has(stripAccents(part).toLowerCase()))

  if (meaningfulParts.length === 0) {
    return false
  }

  if (!meaningfulParts.some((part) => part.length >= 2)) {
    return false
  }

  const mergedMeaningful = meaningfulParts.join('').toLowerCase()
  if (mergedMeaningful.length <= 3 && new Set(mergedMeaningful).size === 1) {
    return false
  }

  if (meaningfulParts.length === 1 && looksRandom(meaningfulParts[0])) {
    return false
  }

  return true
}

export function getPersonNameValidationMessage(value: string): string {
  if (!normalizePersonNameInput(value)) {
    return 'Preencha o nome do cliente'
  }

  if (!isLikelyValidPersonName(value)) {
    return 'Digite um nome ou apelido plausível'
  }

  return ''
}
