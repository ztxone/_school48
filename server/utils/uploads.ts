import fs from 'node:fs/promises'
import path from 'node:path'
import crypto from 'node:crypto'

const PAYMENT_UPLOAD_DIR = path.resolve(process.cwd(), 'public/uploads/payments')

export async function savePaymentImage(filename: string, binary: Uint8Array) {
  await fs.mkdir(PAYMENT_UPLOAD_DIR, { recursive: true })
  const ext = path.extname(filename).toLowerCase() || '.jpg'
  const fileName = `${Date.now()}-${crypto.randomUUID()}${ext}`
  const fullPath = path.join(PAYMENT_UPLOAD_DIR, fileName)
  await fs.writeFile(fullPath, binary)
  return `/uploads/payments/${fileName}`
}
