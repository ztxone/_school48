import fs from 'node:fs/promises'
import path from 'node:path'
import { getSessionPhotosDir } from '../../../utils/media-paths'

const MIME_TYPES: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp'
}

export default defineEventHandler(async (event) => {
  const routePath = getRouterParam(event, 'path') || ''
  const photosDir = getSessionPhotosDir()

  if (!photosDir) {
    throw createError({
      statusCode: 404,
      message: 'Папка с фотографиями не найдена'
    })
  }

  const segments = routePath
    .split('/')
    .filter(Boolean)
    .map(segment => decodeURIComponent(segment))

  if (!segments.length) {
    throw createError({
      statusCode: 404,
      message: 'Файл не найден'
    })
  }

  const filePath = path.resolve(photosDir, ...segments)
  const normalizedPhotosDir = `${path.resolve(photosDir)}${path.sep}`

  if (!filePath.startsWith(normalizedPhotosDir)) {
    throw createError({
      statusCode: 400,
      message: 'Некорректный путь к файлу'
    })
  }

  try {
    const stat = await fs.stat(filePath)

    if (!stat.isFile()) {
      throw new Error('Not a file')
    }

    const ext = path.extname(filePath).toLowerCase()
    const mimeType = MIME_TYPES[ext]

    if (!mimeType) {
      throw createError({
        statusCode: 415,
        message: 'Неподдерживаемый тип файла'
      })
    }

    setHeader(event, 'content-type', mimeType)
    setHeader(event, 'cache-control', 'public, max-age=31536000, immutable')

    return await fs.readFile(filePath)
  } catch (error) {
    if ((error as { statusCode?: number }).statusCode) {
      throw error
    }

    throw createError({
      statusCode: 404,
      message: 'Файл не найден'
    })
  }
})
