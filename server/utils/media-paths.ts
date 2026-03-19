import fs from 'node:fs'
import path from 'node:path'

function resolveExistingDirectory(candidates: Array<string | undefined>) {
  for (const candidate of candidates) {
    if (!candidate) {
      continue
    }

    if (fs.existsSync(candidate)) {
      return candidate
    }
  }

  return null
}

export function getSessionPhotosDir() {
  return resolveExistingDirectory([
    process.env.NUXT_PHOTOS_DIR,
    path.resolve(process.cwd(), 'public/session1'),
    path.resolve(process.cwd(), '../public/session1'),
    path.resolve(process.cwd(), '../../public/session1')
  ])
}
