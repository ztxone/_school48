import crypto from 'node:crypto'
import { and, eq, gt } from 'drizzle-orm'
import { createError, deleteCookie, getCookie, setCookie } from 'h3'
import type { H3Event } from 'h3'
import { db } from '../db'
import { admins, adminSessions } from '../db/schema'

const SESSION_COOKIE = 'admin_session'

export async function createAdminSession(event: H3Event, adminId: number) {
  const config = useRuntimeConfig(event)
  const maxAge = Number(config.sessionMaxAgeSeconds) || 604800
  const now = Date.now()
  const token = crypto.randomBytes(32).toString('hex')

  await db.insert(adminSessions).values({
    adminId,
    token,
    expiresAt: now + maxAge * 1000,
    createdAt: now
  })

  setCookie(event, SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge
  })
}

export async function clearAdminSession(event: H3Event) {
  const token = getCookie(event, SESSION_COOKIE)
  if (token) {
    await db.delete(adminSessions).where(eq(adminSessions.token, token))
  }

  deleteCookie(event, SESSION_COOKIE, {
    path: '/'
  })
}

export async function requireAdmin(event: H3Event) {
  const token = getCookie(event, SESSION_COOKIE)
  if (!token) {
    throw createError({ statusCode: 401, statusMessage: 'Требуется авторизация' })
  }

  const rows = await db
    .select({
      adminId: adminSessions.adminId,
      email: admins.email
    })
    .from(adminSessions)
    .innerJoin(admins, eq(admins.id, adminSessions.adminId))
    .where(and(eq(adminSessions.token, token), gt(adminSessions.expiresAt, Date.now())))
    .limit(1)

  if (!rows[0]) {
    throw createError({ statusCode: 401, statusMessage: 'Сессия истекла' })
  }

  return rows[0]
}
