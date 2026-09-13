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

  // Fetch lesson plans for usage stats
  const { data: lessonPlans, error: lpError } = await supabase.from('lesson_plans').select('owner_id, template_id, ai_use_declaration')
  if (lpError) {
    throw createError({ statusCode: 500, statusMessage: lpError.message })
  }

  // Fetch templates for names
  const { data: templates, error: templateError } = await supabase.from('templates').select('id, name')
  if (templateError) {
    throw createError({ statusCode: 500, statusMessage: templateError.message })
  }

  // Combine data
  const users = authData.users.map(authUser => {
    const profile = profiles.find(p => p.id === authUser.id)
    
    // Calculate stats
    const userPlans = lessonPlans.filter(lp => lp.owner_id === authUser.id)
    const documentCount = userPlans.length
    
    let totalTokens = 0
    const kindsMap = new Map<string, number>()
    
    for (const plan of userPlans) {
      // Tokens
      const declaration = plan.ai_use_declaration as any
      if (declaration?.token_usage?.totalTokenCount) {
        totalTokens += parseInt(declaration.token_usage.totalTokenCount, 10)
      }
      
      // Kinds
      const template = templates.find(t => t.id === plan.template_id)
      const kindName = template?.name || 'Unknown'
      kindsMap.set(kindName, (kindsMap.get(kindName) || 0) + 1)
    }
    
    const documentKinds = Array.from(kindsMap.entries())
      .map(([name, count]) => `${name} (${count})`)
      .join(', ')

    return {
      id: authUser.id,
      email: authUser.email,
      full_name: profile?.full_name || authUser.user_metadata?.full_name || 'Unknown',
      role: profile?.role || 'teacher',
      school_id: profile?.school_id || null,
      created_at: profile?.created_at || authUser.created_at,
      document_count: documentCount,
      document_kinds: documentKinds,
      total_tokens: totalTokens
    }
  })

  return users
})
