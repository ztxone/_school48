import { relations } from 'drizzle-orm'
import { integer, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core'

export const students = sqliteTable(
  'students',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    firstName: text('first_name').notNull(),
    lastName: text('last_name').notNull(),
    createdAt: integer('created_at').notNull()
  },
  table => [
    uniqueIndex('students_unique_name').on(table.firstName, table.lastName)
  ]
)

export const admins = sqliteTable(
  'admins',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    email: text('email').notNull().unique(),
    passwordHash: text('password_hash').notNull(),
    createdAt: integer('created_at').notNull()
  }
)

export const adminSessions = sqliteTable('admin_sessions', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  adminId: integer('admin_id')
    .notNull()
    .references(() => admins.id, { onDelete: 'cascade' }),
  token: text('token').notNull().unique(),
  expiresAt: integer('expires_at').notNull(),
  createdAt: integer('created_at').notNull()
})

export const applications = sqliteTable('applications', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  studentId: integer('student_id').references(() => students.id),
  studentFirstName: text('student_first_name').notNull(),
  studentLastName: text('student_last_name').notNull(),
  coverId: text('cover_id').notNull(),
  albumFormatKey: text('album_format_key').notNull(),
  albumFormatTitle: text('album_format_title').notNull(),
  totalPriceRub: integer('total_price_rub').notNull(),
  comment: text('comment').notNull().default(''),
  paymentStatus: text('payment_status').notNull().default('pending'),
  createdAt: integer('created_at').notNull(),
  updatedAt: integer('updated_at').notNull()
})

export const paymentProofs = sqliteTable('payment_proofs', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  applicationId: integer('application_id')
    .notNull()
    .references(() => applications.id, { onDelete: 'cascade' })
    .unique(),
  note: text('note').notNull().default(''),
  imagePath: text('image_path'),
  paidAt: integer('paid_at'),
  createdAt: integer('created_at').notNull(),
  updatedAt: integer('updated_at').notNull()
})

export const applicationRelations = relations(applications, ({ one }) => ({
  student: one(students, {
    fields: [applications.studentId],
    references: [students.id]
  }),
  paymentProof: one(paymentProofs, {
    fields: [applications.id],
    references: [paymentProofs.applicationId]
  })
}))

export const paymentProofRelations = relations(paymentProofs, ({ one }) => ({
  application: one(applications, {
    fields: [paymentProofs.applicationId],
    references: [applications.id]
  })
}))
