import type { Database } from '~~/shared/types/database.types'

type AppRole = Database['public']['Enums']['app_role']

export const useProfile = () => {
  const user = useSupabaseUser()

  const profile = useState<{
    full_name: string | null
    role: AppRole | null
  } | null>('user-profile', () => null)

  const isProfileComplete = computed(() => {
    if (!profile.value) return false
    return !!profile.value.full_name && !!profile.value.role
  })

  const displayName = computed(() =>
    profile.value?.full_name || user.value?.email?.split('@')[0] || 'User'
  )

  const displayEmail = computed(() => user.value?.email || '')

  const initials = computed(() => {
    const name = displayName.value
    if (!name) return 'U'
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .slice(0, 2)
      .toUpperCase()
  })

  const roleName = computed(() => profile.value?.role)

  async function loadProfile() {
    if (!user.value) return
    try {
      const headers = useRequestHeaders(['cookie']) as Record<string, string>
      const data = await $fetch<Database['public']['Tables']['profiles']['Row']>('/api/user/profile', { headers })
      if (data) {
        profile.value = {
          full_name: data.full_name,
          role: data.role,
        }
      }
    } catch {
      // Profile may not exist yet for brand new users
      profile.value = null
    }
  }

  async function updateProfile(updates: { full_name: string }) {
    if (!user.value) return

    await $fetch<Database['public']['Tables']['profiles']['Row']>('/api/user/profile', {
      method: 'PUT',
      body: {
        full_name: updates.full_name,
      },
    })

    if (profile.value) {
      profile.value.full_name = updates.full_name
    } else {
      await loadProfile()
    }
  }

  function clearProfile() {
    profile.value = null
  }

  return {
    profile,
    isProfileComplete,
    displayName,
    displayEmail,
    initials,
    roleName,
    loadProfile,
    updateProfile,
    clearProfile,
  }
}