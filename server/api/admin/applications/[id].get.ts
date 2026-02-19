import { eq } from 'drizzle-orm'
import { db } from '../../../db'
import { applications, paymentProofs } from '../../../db/schema'
import { requireAdmin } from '../../../utils/admin-auth'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const id = Number(getRouterParam(event, 'id'))

  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'Некорректный идентификатор' })
  }

  const rows = await db
    .select({
      id: applications.id,
      studentFirstName: applications.studentFirstName,
      studentLastName: applications.studentLastName,
      coverId: applications.coverId,
      albumFormatKey: applications.albumFormatKey,
      albumFormatTitle: applications.albumFormatTitle,
      totalPriceRub: applications.totalPriceRub,
      comment: applications.comment,
      paymentStatus: applications.paymentStatus,
      createdAt: applications.createdAt,
      paymentNote: paymentProofs.note,
      paymentImagePath: paymentProofs.imagePath,
      paidAt: paymentProofs.paidAt
    })
    .from(applications)
    .leftJoin(paymentProofs, eq(paymentProofs.applicationId, applications.id))
    .where(eq(applications.id, id))
    .limit(1)

  if (!rows[0]) {
    throw createError({ statusCode: 404, statusMessage: 'Заявка не найдена' })
  }

  return rows[0]
})
