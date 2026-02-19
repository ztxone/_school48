import { asc } from 'drizzle-orm'
import { db } from '../../db'
import { students } from '../../db/schema'

export default defineEventHandler(async () => {
  const rows = await db
    .select({
      id: students.id,
      firstName: students.firstName,
      lastName: students.lastName
    })
    .from(students)
    .orderBy(asc(students.lastName), asc(students.firstName))

  return { items: rows }
})
