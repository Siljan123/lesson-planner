import { serverSupabaseClient, serverSupabaseUser } from '#supabase/server'
import type { Database } from '~~/shared/types/database.types'

export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event)
  if (!user) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  const supabase = await serverSupabaseClient<Database>(event)

  const { data, error } = await supabase
    .from('worksheets')
    .select('*, subject:subjects(name, code), grade:grade_levels(label), lesson_plan:lesson_plans(id, title)')
    .order('created_at', { ascending: false })

  if (error) {
    throw createError({ statusCode: 500, statusMessage: error.message })
  }

  return (data || []).map((ws: any) => ({
    ...ws,
    topic: ws.topic || (ws.content as any)?.topic || ws.title
  }))
})
