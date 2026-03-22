import { and, desc, eq, gt } from 'drizzle-orm'
import { ALBUM_OPTIONS } from '../../../shared/album-options'
import { createApplicationSchema } from '../../../shared/schemas'
import { db } from '../../db'
import { applications } from '../../db/schema'

export default defineEventHandler(async (event) => {
  const parsed = createApplicationSchema.safeParse(await readBody(event))

  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      message: 'Проверьте корректность полей формы'
    })
  }

  const now = Date.now()
  const form = parsed.data
  const selectedAlbum = ALBUM_OPTIONS.find(option => option.key === form.albumFormatKey)

  if (!selectedAlbum) {
    throw createError({
      statusCode: 400,
      message: 'Неверный формат альбома'
    })
  }

  // Basic dedupe against accidental double submit in 5 minutes.
  const duplicate = await db
    .select({ id: applications.id })
    .from(applications)
    .where(and(
      eq(applications.studentFirstName, form.studentFirstName),
      eq(applications.studentLastName, form.studentLastName),
      eq(applications.coverId, form.coverId),
      eq(applications.albumFormatKey, form.albumFormatKey),
      gt(applications.createdAt, now - 5 * 60 * 1000)
    ))
    .orderBy(desc(applications.id))
    .limit(1)

  if (duplicate[0]) {
    return {
      ok: true,
      deduplicated: true,
      id: duplicate[0].id
    }
  }

  const result = await db.insert(applications).values({
    studentId: form.studentId ?? null,
    studentFirstName: form.studentFirstName,
    studentLastName: form.studentLastName,
    coverId: form.coverId,
    albumFormatKey: form.albumFormatKey,
    albumFormatTitle: selectedAlbum.title,
    totalPriceRub: selectedAlbum.priceRub,
    comment: form.comment,
    createdAt: now,
    updatedAt: now
  }).returning({ id: applications.id })

  if (!result[0]) {
    throw createError({
      statusCode: 500,
      message: 'Не удалось сохранить заявку'
    })
  }

  return {
    ok: true,
    id: result[0].id
  }
})
