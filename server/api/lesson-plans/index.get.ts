import { serverSupabaseClient, serverSupabaseUser } from '#supabase/server'
import type { Database } from '~~/shared/types/database.types'

export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event)
  if (!user) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  const supabase = await serverSupabaseClient<Database>(event)
  
  const { data, error } = await supabase
    .from('lesson_plans')
    .select('*, subject:subjects(name), grade:grade_levels(label)')
    .order('created_at', { ascending: false })

  if (error) {
    throw createError({ statusCode: 500, statusMessage: error.message })
  }

  return (data || []).map((plan) => ({
    ...plan,
    topic: (plan.content as any)?.topic || (plan.content as any)?.intentions?.topic || ''
  }))
})
