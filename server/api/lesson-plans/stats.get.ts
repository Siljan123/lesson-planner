import { serverSupabaseClient, serverSupabaseUser } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event)
  if (!user) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  const supabase = await serverSupabaseClient(event)
  
  const { data, error } = await supabase
    .from('lesson_plans')
    .select('status')

  if (error) {
    throw createError({ statusCode: 500, statusMessage: error.message })
  }

  const counts = { total: 0, draft: 0, ready: 0, exported: 0 }
  if (data) {
    counts.total = data.length
    data.forEach((plan: any) => {
      if (plan.status === 'draft' || plan.status === 'needs_review') counts.draft++
      if (plan.status === 'ready') counts.ready++
      if (plan.status === 'exported') counts.exported++
    })
  }

  return counts
})
