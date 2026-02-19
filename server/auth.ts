import { eq } from 'drizzle-orm'
import { db } from './db'
import { admins } from './db/schema'
import { verifyPassword } from './utils/password'

export async function authenticateAdmin(email: string, password: string) {
  const admin = await db.select().from(admins).where(eq(admins.email, email)).limit(1)
  const user = admin[0]

  if (!user) {
    return null
  }

  const isValidPassword = verifyPassword(password, user.passwordHash)
  if (!isValidPassword) {
    return null
  }

  return user
}
