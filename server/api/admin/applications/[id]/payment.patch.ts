import { eq } from 'drizzle-orm'
import { z } from 'zod'
import { db } from '../../../../db'
import { applications, paymentProofs } from '../../../../db/schema'
import { requireAdmin } from '../../../../utils/admin-auth'

const schema = z.object({
  note: z.string().max(1000).optional().default(''),
  imagePath: z.string().nullable().optional(),
  paymentStatus: z.enum(['pending', 'paid']).default('pending')
})

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const id = Number(getRouterParam(event, 'id'))

  if (!id) {
    throw createError({ statusCode: 400, message: 'Некорректный идентификатор' })
  }

  const parsed = schema.safeParse(await readBody(event))
  if (!parsed.success) {
    throw createError({ statusCode: 400, message: 'Некорректные данные оплаты' })
  }

  const now = Date.now()

  const existing = await db
    .select({ id: paymentProofs.id, paidAt: paymentProofs.paidAt })
    .from(paymentProofs)
    .where(eq(paymentProofs.applicationId, id))
    .limit(1)

  const paidAt = parsed.data.paymentStatus === 'paid'
    ? (existing[0]?.paidAt ?? now)
    : null

  if (existing[0]) {
    await db
      .update(paymentProofs)
      .set({
        note: parsed.data.note,
        imagePath: parsed.data.imagePath ?? null,
        paidAt,
        updatedAt: now
      })
      .where(eq(paymentProofs.applicationId, id))
  } else {
    await db.insert(paymentProofs).values({
      applicationId: id,
      note: parsed.data.note,
      imagePath: parsed.data.imagePath ?? null,
      paidAt,
      createdAt: now,
      updatedAt: now
    })
  }

  await db
    .update(applications)
    .set({
      paymentStatus: parsed.data.paymentStatus,
      updatedAt: now
    })
    .where(eq(applications.id, id))

  const result = await db
    .select({
      id: applications.id,
      paymentStatus: applications.paymentStatus,
      note: paymentProofs.note,
      imagePath: paymentProofs.imagePath,
      paidAt: paymentProofs.paidAt
    })
    .from(applications)
    .leftJoin(paymentProofs, eq(paymentProofs.applicationId, applications.id))
    .where(eq(applications.id, id))
    .limit(1)

  return { ok: true, item: result[0] }
})
