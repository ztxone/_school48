export default defineNuxtRouteMiddleware(async (to) => {
  if (!to.path.startsWith('/admin') || to.path === '/admin/login') {
    return
  }

  try {
    const headers = import.meta.server ? useRequestHeaders(['cookie']) : undefined
    await $fetch('/api/auth/session', { headers })
  } catch {
    return navigateTo('/admin/login')
  }
})
