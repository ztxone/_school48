import { z } from 'zod'
import { ALBUM_OPTIONS } from './album-options'
import { COVER_OPTIONS } from './covers'

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

export const adminLoginSchema = z.object({
  email: z.string().email('Введите корректный email'),
  password: z.string().min(6, 'Минимум 6 символов')
})
