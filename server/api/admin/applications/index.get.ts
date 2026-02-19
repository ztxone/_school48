import { desc, eq, like, or } from 'drizzle-orm'
import { db } from '../../../db'
import { applications, paymentProofs } from '../../../db/schema'
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

  return { items: rows }
})
