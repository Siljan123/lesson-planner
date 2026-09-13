import { serverSupabaseClient, serverSupabaseUser } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event)
  if (!user) throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  const userId = (user as any).sub || user.id

  const supabase = await serverSupabaseClient<any>(event)
  const id = getRouterParam(event, 'id')

  if (!id) {
    throw createError({ statusCode: 400, message: 'Missing id parameter' })
  }

  // Check ownership or admin
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', userId).single()
  const { data: plan } = await supabase.from('lesson_plans').select('owner_id').eq('id', id).single()

  if (!plan) {
    throw createError({ statusCode: 404, message: 'Lesson plan not found' })
  }

  if (plan.owner_id !== userId && profile?.role !== 'admin') {
    throw createError({ statusCode: 403, message: 'Forbidden' })
  }

  // Delete dependents first to avoid foreign key constraint errors if ON DELETE CASCADE is missing
  await supabase.from('lesson_plan_versions').delete().eq('lesson_plan_id', id)
  await supabase.from('generated_files').delete().eq('lesson_plan_id', id)
  await supabase.from('signatory_sections').delete().eq('lesson_plan_id', id)

  // Supabase delete the plan itself
  const { error } = await supabase.from('lesson_plans').delete().eq('id', id)

  if (error) {
    throw createError({ statusCode: 500, message: error.message })
  }

  return { success: true }
})
