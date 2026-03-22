import { z } from 'zod'
import { ALBUM_OPTIONS } from './album-options'
import { COVER_OPTIONS } from './covers'
import { normalizeLastName } from './photo-selection'

const albumKeys = ALBUM_OPTIONS.map(option => option.key)
const coverIds = COVER_OPTIONS.map(cover => cover.id)

export const createApplicationSchema = z.object({
  studentFirstName: z.string().trim().min(2, 'Введите имя'),
  studentLastName: z.string().trim().min(2, 'Введите фамилию'),
  studentId: z.number().int().positive().nullable().optional(),
  coverId: z.string().refine(value => coverIds.includes(value), 'Выберите обложку'),
  albumFormatKey: z.string().refine(value => albumKeys.includes(value), 'Выберите формат'),
  comment: z.string().trim().max(1000).optional().default('')
})

export type CreateApplicationInput = z.infer<typeof createApplicationSchema>

const photoFileNameSchema = z
  .string()
  .trim()
  .regex(/^[^/\\]+\.(jpg|jpeg|png|webp)$/i, 'Укажите корректное имя файла')

export const surveyTwoLookupSchema = z.object({
  lastName: z.string().trim().min(2, 'Введите фамилию')
})

export const surveyTwoSubmitSchema = z.object({
  lastName: z.string().trim().min(2, 'Введите фамилию'),
  coverPhoto: photoFileNameSchema,
  vignettePhoto: photoFileNameSchema
}).superRefine((value, ctx) => {
  if (!normalizeLastName(value.lastName)) {
    ctx.addIssue({
      code: 'custom',
      path: ['lastName'],
      message: 'Введите фамилию'
    })
  }
})

export type SurveyTwoLookupInput = z.infer<typeof surveyTwoLookupSchema>
export type SurveyTwoSubmitInput = z.infer<typeof surveyTwoSubmitSchema>

export const adminLoginSchema = z.object({
  email: z.string().email('Введите корректный email'),
  password: z.string().min(6, 'Минимум 6 символов')
})

export const adminTableStateSchema = z.object({
  visibleColumns: z.object({
    id: z.boolean().optional(),
    coverSort: z.boolean().optional(),
    student: z.boolean().optional(),
    photoSelection: z.boolean().optional(),
    album: z.boolean().optional(),
    price: z.boolean().optional(),
    paymentStatus: z.boolean().optional(),
    paidAt: z.boolean().optional(),
    createdAt: z.boolean().optional(),
    actions: z.boolean().optional()
  }).strict()
})

export type AdminTableState = z.infer<typeof adminTableStateSchema>
