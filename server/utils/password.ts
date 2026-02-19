import crypto from 'node:crypto'

const HASH_ITERATIONS = 210000
const KEY_LENGTH = 64
const DIGEST = 'sha512'

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex')
  const hash = crypto
    .pbkdf2Sync(password, salt, HASH_ITERATIONS, KEY_LENGTH, DIGEST)
    .toString('hex')
  return `${HASH_ITERATIONS}:${salt}:${hash}`
}

export function verifyPassword(password: string, encoded: string): boolean {
  const [iterationsText, salt, storedHash] = encoded.split(':')
  const iterations = Number(iterationsText)

  if (!iterations || !salt || !storedHash) {
    return false
  }

  const hash = crypto
    .pbkdf2Sync(password, salt, iterations, KEY_LENGTH, DIGEST)
    .toString('hex')

  return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(storedHash, 'hex'))
}
