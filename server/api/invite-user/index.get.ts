import { serverSupabaseServiceRole, serverSupabaseClient, serverSupabaseUser } from '#supabase/server'
import type { Database } from '~~/shared/types/database.types'

export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event)
  if (!user) throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  const userId = (user as any).sub || user.id

  const client = await serverSupabaseClient<Database>(event)
  const { data: callerProfile } = await client.from('profiles').select('role').eq('id', userId).single()
  if (callerProfile?.role !== 'admin') {
    throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
  }

  const supabase = serverSupabaseServiceRole<Database>(event)

  // Fetch auth users
  const { data: authData, error: authError } = await supabase.auth.admin.listUsers()
  if (authError) {
    throw createError({ statusCode: 500, statusMessage: authError.message })
  }

  // Fetch profiles
  const { data: profiles, error: profilesError } = await supabase.from('profiles').select('*')
  if (profilesError) {
    throw createError({ statusCode: 500, statusMessage: profilesError.message })
  }

  // Fetch lesson plans for document stats
  const { data: lessonPlans, error: lpError } = await supabase.from('lesson_plans').select('owner_id')
  if (lpError) {
    throw createError({ statusCode: 500, statusMessage: lpError.message })
  }

  // Fetch token quotas for usage stats
  const { data: quotas, error: quotasError } = await supabase.from('user_token_quotas').select('user_id, tokens_used, token_limit')
  if (quotasError) {
    throw createError({ statusCode: 500, statusMessage: quotasError.message })
  }

  // Combine data
  const users = authData.users.map(authUser => {
    const profile = profiles.find(p => p.id === authUser.id)
    const quota = quotas.find(q => q.user_id === authUser.id)

    // Calculate stats
    const userPlans = lessonPlans.filter(lp => lp.owner_id === authUser.id)
    const documentCount = userPlans.length
    const documentKinds = documentCount > 0 ? `ILAW (${documentCount})` : ''

    return {
      id: authUser.id,
      email: authUser.email,
      full_name: profile?.full_name || authUser.user_metadata?.full_name || 'Unknown',
      role: profile?.role || 'teacher',
      school_id: profile?.school_id || null,
      created_at: profile?.created_at || authUser.created_at,
      document_count: documentCount,
      document_kinds: documentKinds,
      total_tokens: quota?.tokens_used || 0,
      token_limit: quota?.token_limit || 100000
    }
  })

  return users
})
