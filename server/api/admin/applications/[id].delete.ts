import { eq } from 'drizzle-orm'
import { db } from '../../../db'
import { applications } from '../../../db/schema'
import { requireAdmin } from '../../../utils/admin-auth'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)

  const id = Number(getRouterParam(event, 'id'))
  if (!id) {
    throw createError({ statusCode: 400, message: 'Некорректный идентификатор' })
  }

  const existing = await db
    .select({ id: applications.id })
    .from(applications)
    .where(eq(applications.id, id))
    .limit(1)

  if (!existing[0]) {
    throw createError({ statusCode: 404, message: 'Заявка не найдена' })
  }

  await db.delete(applications).where(eq(applications.id, id))

  return { ok: true }
})
