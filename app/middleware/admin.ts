export default defineNuxtRouteMiddleware(async (to, from) => {
  const { profile, loadProfile } = useProfile()
  
  if (!profile.value) {
    await loadProfile()
  }

  if (profile.value?.role !== 'admin') {
    return navigateTo('/authenticated/dashboard') 
  }
})
