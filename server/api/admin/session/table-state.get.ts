import { adminTableStateSchema } from '../../../../shared/schemas'
import { requireAdmin } from '../../../utils/admin-auth'

export default defineEventHandler(async (event) => {
  const admin = await requireAdmin(event)
  let storedState: unknown = {}

  try {
    storedState = JSON.parse(admin.tableState || '{}')
  } catch {
    storedState = {}
  }

  const parsed = adminTableStateSchema.safeParse(storedState)

  return parsed.success
    ? parsed.data
    : {
        visibleColumns: {}
      }
})
