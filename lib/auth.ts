import { cookies } from 'next/headers'
import { createHash, randomBytes, scryptSync, timingSafeEqual } from 'crypto'
import { prisma } from './prisma'

const COOKIE = 'buildtrack_session'
const DAYS = 30

export function hashPassword(password: string) {
  const salt = randomBytes(16).toString('hex')
  const hash = scryptSync(password, salt, 64).toString('hex')
  return `scrypt:${salt}:${hash}`
}

export function verifyPassword(password: string, stored: string) {
  const [scheme, salt, key] = stored.split(':')
  if (scheme !== 'scrypt' || !salt || !key) return false
  const derived = scryptSync(password, salt, 64)
  const expected = Buffer.from(key, 'hex')
  return expected.length === derived.length && timingSafeEqual(expected, derived)
}

export async function createSession(userId: string) {
  const token = randomBytes(32).toString('hex')
  const expiresAt = new Date(Date.now() + DAYS * 24 * 60 * 60 * 1000)
  await prisma.session.create({ data: { token, userId, expiresAt } })
  const store = await cookies()
  store.set(COOKIE, token, { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', expires: expiresAt, maxAge: DAYS * 24 * 60 * 60, path: '/' })
}

export async function getCurrentUser() {
  const token = (await cookies()).get(COOKIE)?.value
  if (!token) return null
  const session = await prisma.session.findUnique({ where: { token }, include: { user: true } })
  if (!session || session.expiresAt < new Date()) return null
  // Keep an active user signed in while they continue using the app.
  const refreshedExpiry = new Date(Date.now() + DAYS * 24 * 60 * 60 * 1000)
  if (session.expiresAt.getTime() - Date.now() < 7 * 24 * 60 * 60 * 1000) {
    await prisma.session.update({ where: { token }, data: { expiresAt: refreshedExpiry } })
    const store = await cookies()
    store.set(COOKIE, token, { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', expires: refreshedExpiry, maxAge: DAYS * 24 * 60 * 60, path: '/' })
  }
  return session.user
}

export async function destroySession() {
  const store = await cookies()
  const token = store.get(COOKIE)?.value
  if (token) await prisma.session.deleteMany({ where: { token } })
  store.delete(COOKIE)
}
