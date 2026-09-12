export default defineNuxtRouteMiddleware((to) => {
  const user = useSupabaseUser()

  // Public routes that don't require authentication
  const publicRoutes = ['/', '/login', '/auth/confirm']

  // Routes accessible only while authenticated but before profile completion
  const setupRoutes = ['/auth/complete-profile']

  const isPublicRoute = publicRoutes.includes(to.path)
  const isSetupRoute = setupRoutes.includes(to.path)

  // Not logged in → allow public routes, redirect everything else to login
  if (!user.value) {
    if (isPublicRoute) return
    return navigateTo('/login')
  }

  // Logged in → redirect away from login page
  if (to.path === '/login') {
    return navigateTo('/authenticated/dashboard')
  }

  // Logged in → check cached profile for completion (non-blocking)
  if (!isPublicRoute && !isSetupRoute) {
    const { profile } = useProfile()

    // Only redirect if profile is already loaded AND incomplete.
    // Escape hatch: If they logged in with a password (amr contains 'password'), they are already setup!
    const hasPassword = user.value.amr?.some((a: any) => a.method === 'password')
    const isProfileCompleted = user.value.user_metadata?.profile_completed === true

    if (profile.value && !isProfileCompleted && !hasPassword) {
      return navigateTo('/auth/complete-profile')
    }
  }
})
