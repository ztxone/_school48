import { and, eq } from 'drizzle-orm'
import { db } from '.'
import { syncStudentPhotoOptionsFromFolders } from '../utils/photo-options'
import { admins, students } from './schema'
import { hashPassword } from '../utils/password'

const defaultStudents: Array<{ firstName: string, lastName: string }> = [
  { firstName: 'Иван', lastName: 'Иванов' },
  { firstName: 'Петр', lastName: 'Петров' },
  { firstName: 'Мария', lastName: 'Сидорова' }
]

async function seedStudents() {
  const now = Date.now()

  for (const student of defaultStudents) {
    const existing = await db
      .select({ id: students.id })
      .from(students)
      .where(and(eq(students.firstName, student.firstName), eq(students.lastName, student.lastName)))
      .limit(1)

    if (!existing[0]) {
      await db.insert(students).values({
        firstName: student.firstName,
        lastName: student.lastName,
        createdAt: now
      })
    }
  }
}

async function seedAdmin() {
  const email = process.env.NUXT_ADMIN_EMAIL
  const password = process.env.NUXT_ADMIN_PASSWORD

  if (!email || !password) {
    console.warn('Skip admin seed: NUXT_ADMIN_EMAIL or NUXT_ADMIN_PASSWORD are missing')
    return
  }

  const existing = await db.select({ id: admins.id }).from(admins).where(eq(admins.email, email)).limit(1)
  if (existing[0]) {
    return
  }

  await db.insert(admins).values({
    email,
    passwordHash: hashPassword(password),
    createdAt: Date.now()
  })
}

async function run() {
  await seedStudents()
  await syncStudentPhotoOptionsFromFolders()
  await seedAdmin()

  console.log('Seed completed')
}

run().catch((error) => {
  console.error(error)
  process.exit(1)
})
