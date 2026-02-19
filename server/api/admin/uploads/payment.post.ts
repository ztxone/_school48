import { savePaymentImage } from '../../../utils/uploads'
import { requireAdmin } from '../../../utils/admin-auth'

const MAX_IMAGE_BYTES = 8 * 1024 * 1024
const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp'])

export default defineEventHandler(async (event) => {
  await requireAdmin(event)

  const files = await readMultipartFormData(event)
  const image = files?.find(file => file.name === 'file')

  if (!image || !image.filename || !image.data) {
    throw createError({ statusCode: 400, statusMessage: 'Файл не передан' })
  }

  if (!image.type || !ALLOWED_TYPES.has(image.type)) {
    throw createError({ statusCode: 400, statusMessage: 'Поддерживаются только JPG/PNG/WEBP' })
  }

  if (image.data.length > MAX_IMAGE_BYTES) {
    throw createError({ statusCode: 400, statusMessage: 'Размер файла не должен превышать 8 МБ' })
  }

  const imagePath = await savePaymentImage(image.filename, image.data)
  return { imagePath }
})
