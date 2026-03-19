import fs from 'node:fs'
import path from 'node:path'
import { eq } from 'drizzle-orm'
import { normalizeLastName } from '../../shared/photo-selection'
import { db } from '../db'
import { studentPhotoOptions } from '../db/schema'

const PHOTO_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp'])
const SESSION_FOLDER = path.resolve(process.cwd(), 'public/session1')

export async function syncStudentPhotoOptionsFromFolders(targetLastName?: string) {
  if (!fs.existsSync(SESSION_FOLDER)) {
    return
  }

  const targetNormalizedLastName = targetLastName ? normalizeLastName(targetLastName) : ''
  const folders = fs.readdirSync(SESSION_FOLDER, { withFileTypes: true }).filter(entry => entry.isDirectory())
  const processedLastNames = new Set<string>()

  for (const folder of folders) {
    const normalizedLastName = normalizeLastName(folder.name)

    if (targetNormalizedLastName && normalizedLastName !== targetNormalizedLastName) {
      continue
    }

    processedLastNames.add(normalizedLastName)

    const folderPath = path.join(SESSION_FOLDER, folder.name)
    const files = fs.readdirSync(folderPath, { withFileTypes: true })
      .filter(entry => entry.isFile())
      .map(entry => entry.name)
      .filter(fileName => PHOTO_EXTENSIONS.has(path.extname(fileName).toLocaleLowerCase('ru-RU')))
      .sort((left, right) => left.localeCompare(right, 'ru-RU', { numeric: true }))

    await db.delete(studentPhotoOptions).where(eq(studentPhotoOptions.normalizedLastName, normalizedLastName))

    if (!files.length) {
      continue
    }

    await db.insert(studentPhotoOptions).values(
      files.map(fileName => ({
        lastName: folder.name.normalize('NFC'),
        normalizedLastName,
        fileName,
        imagePath: `/session1/${encodeURIComponent(folder.name)}/${encodeURIComponent(fileName)}`,
        createdAt: Date.now()
      }))
    )
  }

  if (targetNormalizedLastName && !processedLastNames.has(targetNormalizedLastName)) {
    await db.delete(studentPhotoOptions).where(eq(studentPhotoOptions.normalizedLastName, targetNormalizedLastName))
  }
}
