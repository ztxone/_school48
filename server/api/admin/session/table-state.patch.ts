import { eq } from 'drizzle-orm'
import { createError } from 'h3'
import { adminTableStateSchema } from '../../../../shared/schemas'
import { db } from '../../../db'
import { adminSessions } from '../../../db/schema'
import { requireAdmin } from '../../../utils/admin-auth'

export default defineEventHandler(async (event) => {
  const admin = await requireAdmin(event)
  const parsed = adminTableStateSchema.safeParse(await readBody(event))

  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      message: 'Некорректное состояние таблицы'
    })
  }

  await db
    .update(adminSessions)
    .set({
      tableState: JSON.stringify(parsed.data)
    })
    .where(eq(adminSessions.id, admin.sessionId))

  return {
    ok: true
  }
})
