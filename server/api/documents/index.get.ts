import { serverSupabaseClient, serverSupabaseUser } from '#supabase/server'
import { getQuery } from 'h3'
import type { Database } from '~~/shared/types/database.types'

export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event)
  if (!user) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  const query = getQuery(event)
  const limit = query.limit ? parseInt(query.limit as string) : null

  const supabase = await serverSupabaseClient<Database>(event)
  
  let q = supabase
    .from('generated_files')
    .select('*, lesson_plan:lesson_plans(title, subject:subjects(name), grade:grade_levels(label))')
    .order('created_at', { ascending: false })

  if (limit) {
    q = q.limit(limit)
  }

  const { data, error } = await q

  if (error) {
    throw createError({ statusCode: 500, statusMessage: error.message })
  }

  return data
})
