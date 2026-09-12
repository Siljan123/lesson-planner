import { serverSupabaseClient, serverSupabaseUser } from '#supabase/server'
import type { Database } from '~~/shared/types/database.types'

export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event)
  if (!user) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  const body = await readBody(event)

  if (!body.full_name?.trim()) {
    throw createError({ statusCode: 400, message: 'Full name is required' })
  }
  if (!body.password || body.password.length < 6) {
    throw createError({ statusCode: 400, message: 'Password must be at least 6 characters' })
  }

  const supabase = await serverSupabaseClient<Database>(event)
  const userId = (user as any).sub || user.id
  
  // Update password and metadata using the user's own session
  const { error: authError } = await supabase.auth.updateUser({
    password: body.password,
    data: { profile_completed: true }
  })
  if (authError) {
    throw createError({ statusCode: 400, message: authError.message })
  }

  // Update profile
  const { data, error: profileError } = await supabase
    .from('profiles')
    .update({
      full_name: body.full_name.trim(),
    })
    .eq('id', userId)
    .select()
    .maybeSingle()

  if (profileError) {
    throw createError({ statusCode: 500, statusMessage: profileError.message })
  }

  return data
})
