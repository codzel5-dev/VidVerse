/**
 * Generate a YouTube-style share code (alphanumeric, URL-safe)
 * Similar to YouTube's video IDs like "dQw4w9WgXcQ"
 * Uses characters: a-z, A-Z, 0-9 (62 characters)
 * 8 characters = 62^8 = ~218 trillion possible combinations
 */

import crypto from 'crypto'

const CHARSET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
const CODE_LENGTH = 8

export function generateShareCode(): string {
  const bytes = crypto.randomBytes(CODE_LENGTH)
  let code = ''
  for (let i = 0; i < CODE_LENGTH; i++) {
    code += CHARSET[bytes[i] % CHARSET.length]
  }
  return code
}

/**
 * Generate a unique share code that doesn't exist in the database
 */
export async function generateUniqueShareCode(
  existsFn: (code: string) => Promise<boolean>
): Promise<string> {
  let code = generateShareCode()
  let attempts = 0
  while (await existsFn(code)) {
    code = generateShareCode()
    attempts++
    if (attempts > 100) {
      // Fallback: add timestamp suffix to ensure uniqueness
      code = generateShareCode() + Date.now().toString(36).slice(-4)
      break
    }
  }
  return code
}
