import { adminLoginSchema } from '../../../shared/schemas'
import { authenticateAdmin } from '../../auth'
import { clearAdminSession, createAdminSession, requireAdmin } from '../../utils/admin-auth'

export default defineEventHandler(async (event) => {
  const method = event.method || 'GET'
  const route = getRouterParam(event, 'all') || ''

  if (route === 'login' && method === 'POST') {
    const parsed = adminLoginSchema.safeParse(await readBody(event))
    if (!parsed.success) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Неверные данные для входа'
      })
    }

    const admin = await authenticateAdmin(parsed.data.email, parsed.data.password)
    if (!admin) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Неверный email или пароль'
      })
    }

    await createAdminSession(event, admin.id)
    return { ok: true }
  }

  if (route === 'logout' && method === 'POST') {
    await clearAdminSession(event)
    return { ok: true }
  }

  if (route === 'session' && method === 'GET') {
    const admin = await requireAdmin(event)
    return {
      authenticated: true,
      admin
    }
  }

  throw createError({
    statusCode: 404,
    statusMessage: 'Не найдено'
  })
})
