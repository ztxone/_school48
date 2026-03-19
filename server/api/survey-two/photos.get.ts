import { asc, eq } from 'drizzle-orm'
import { surveyTwoLookupSchema } from '../../../shared/schemas'
import { normalizeLastName } from '../../../shared/photo-selection'
import { db } from '../../db'
import { photoSelections, studentPhotoOptions } from '../../db/schema'
import { syncStudentPhotoOptionsFromFolders } from '../../utils/photo-options'

export default defineEventHandler(async (event) => {
  const parsed = surveyTwoLookupSchema.safeParse(getQuery(event))

  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Введите фамилию'
    })
  }

  const normalizedLastName = normalizeLastName(parsed.data.lastName)
  await syncStudentPhotoOptionsFromFolders(parsed.data.lastName)

  const [items, existingSelection] = await Promise.all([
    db
      .select({
        fileName: studentPhotoOptions.fileName,
        imagePath: studentPhotoOptions.imagePath
      })
      .from(studentPhotoOptions)
      .where(eq(studentPhotoOptions.normalizedLastName, normalizedLastName))
      .orderBy(asc(studentPhotoOptions.fileName)),
    db
      .select({
        lastName: photoSelections.lastName,
        coverPhoto: photoSelections.coverPhoto,
        vignettePhoto: photoSelections.vignettePhoto
      })
      .from(photoSelections)
      .where(eq(photoSelections.normalizedLastName, normalizedLastName))
      .limit(1)
  ])

  return {
    lastName: existingSelection[0]?.lastName || parsed.data.lastName.trim(),
    items,
    selection: existingSelection[0] || null
  }
})
