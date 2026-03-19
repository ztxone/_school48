import { eq } from 'drizzle-orm'
import { surveyTwoSubmitSchema } from '../../../shared/schemas'
import { normalizeLastName } from '../../../shared/photo-selection'
import { db } from '../../db'
import { photoSelections, studentPhotoOptions } from '../../db/schema'
import { syncStudentPhotoOptionsFromFolders } from '../../utils/photo-options'

export default defineEventHandler(async (event) => {
  const parsed = surveyTwoSubmitSchema.safeParse(await readBody(event))

  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      statusMessage: parsed.error.issues[0]?.message || 'Проверьте корректность полей формы'
    })
  }

  const form = parsed.data
  const normalizedLastName = normalizeLastName(form.lastName)
  await syncStudentPhotoOptionsFromFolders(form.lastName)
  const availableOptions = await db
    .select({ fileName: studentPhotoOptions.fileName })
    .from(studentPhotoOptions)
    .where(eq(studentPhotoOptions.normalizedLastName, normalizedLastName))

  if (!availableOptions.length) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Для этой фамилии фотографии не найдены'
    })
  }

  const allowedFiles = new Set(availableOptions.map(item => item.fileName))

  if (!allowedFiles.has(form.coverPhoto) || !allowedFiles.has(form.vignettePhoto)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Выбранные фотографии не соответствуют указанной фамилии'
    })
  }

  const now = Date.now()
  const existing = await db
    .select({ id: photoSelections.id })
    .from(photoSelections)
    .where(eq(photoSelections.normalizedLastName, normalizedLastName))
    .limit(1)

  if (existing[0]) {
    await db
      .update(photoSelections)
      .set({
        lastName: form.lastName.trim(),
        coverPhoto: form.coverPhoto,
        vignettePhoto: form.vignettePhoto,
        updatedAt: now
      })
      .where(eq(photoSelections.id, existing[0].id))

    return {
      ok: true,
      updated: true
    }
  }

  await db.insert(photoSelections).values({
    lastName: form.lastName.trim(),
    normalizedLastName,
    coverPhoto: form.coverPhoto,
    vignettePhoto: form.vignettePhoto,
    createdAt: now,
    updatedAt: now
  })

  return {
    ok: true,
    updated: false
  }
})
