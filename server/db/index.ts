import path from 'node:path'
import fs from 'node:fs'
import Database from 'better-sqlite3'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import { migrate } from 'drizzle-orm/better-sqlite3/migrator'
import * as schema from './schema'

const resolvedPath = path.resolve(process.cwd(), process.env.NUXT_DB_FILE_PATH || './data/app.db')
const dirName = path.dirname(resolvedPath)

if (!fs.existsSync(dirName)) {
  fs.mkdirSync(dirName, { recursive: true })
}

const sqlite = new Database(resolvedPath)
sqlite.pragma('journal_mode = WAL')

export const db = drizzle(sqlite, { schema })
export type DatabaseClient = typeof db

const migrationsFolder = path.resolve(process.cwd(), 'drizzle')

if (fs.existsSync(migrationsFolder)) {
  migrate(db, { migrationsFolder })
}
