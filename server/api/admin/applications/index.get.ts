import { desc, eq, inArray, like, or } from 'drizzle-orm'
import { normalizeLastName } from '../../../../shared/photo-selection'
import { db } from '../../../db'
import { applications, paymentProofs, photoSelections } from '../../../db/schema'
import { requireAdmin } from '../../../utils/admin-auth'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const { q } = getQuery(event)
  const search = typeof q === 'string' ? q.trim() : ''

  const selection = {
    id: applications.id,
    studentFirstName: applications.studentFirstName,
    studentLastName: applications.studentLastName,
    coverId: applications.coverId,
    albumFormatTitle: applications.albumFormatTitle,
    totalPriceRub: applications.totalPriceRub,
    paymentStatus: applications.paymentStatus,
    paidAt: paymentProofs.paidAt,
    createdAt: applications.createdAt,
    paymentImagePath: paymentProofs.imagePath
  }

  let rows

  if (search) {
    rows = await db
      .select(selection)
      .from(applications)
      .leftJoin(paymentProofs, eq(paymentProofs.applicationId, applications.id))
      .where(or(
        like(applications.studentFirstName, `%${search}%`),
        like(applications.studentLastName, `%${search}%`)
      ))
      .orderBy(desc(applications.createdAt))
  } else {
    rows = await db
      .select(selection)
      .from(applications)
      .leftJoin(paymentProofs, eq(paymentProofs.applicationId, applications.id))
      .orderBy(desc(applications.createdAt))
  }

  const normalizedLastNames = [...new Set(rows.map(item => normalizeLastName(item.studentLastName)).filter(Boolean))]
  const selectionRows = normalizedLastNames.length
    ? await db
      .select({
        normalizedLastName: photoSelections.normalizedLastName,
        coverPhoto: photoSelections.coverPhoto,
        vignettePhoto: photoSelections.vignettePhoto
      })
      .from(photoSelections)
      .where(inArray(photoSelections.normalizedLastName, normalizedLastNames))
    : []

  const selectionMap = new Map(
    selectionRows.map(item => [
      item.normalizedLastName,
      {
        coverPhoto: item.coverPhoto,
        vignettePhoto: item.vignettePhoto
      }
    ])
  )

  return {
    items: rows.map(item => {
      const selection = selectionMap.get(normalizeLastName(item.studentLastName))

      return {
        ...item,
        coverPhoto: selection?.coverPhoto || null,
        vignettePhoto: selection?.vignettePhoto || null
      }
    })
  }
})
