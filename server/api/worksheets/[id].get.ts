import { serverSupabaseClient } from '#supabase/server'
import type { Database } from '~~/shared/types/database.types'

export default defineEventHandler(async (event) => {
  const supabase = await serverSupabaseClient<Database>(event)
  const { data: { user } } = await supabase.auth.getUser()
  const id = getRouterParam(event, 'id')

  const userId = (user as any)?.sub || user?.id
  if (!userId) {
    throw createError({ statusCode: 401, message: 'Unauthorized' })
  }

  const { data: worksheet, error } = await supabase
    .from('worksheets')
    .select(`
      *,
      subject:subjects(name, code),
      grade:grade_levels(label),
      lesson_plan:lesson_plans(id, title)
    `)
    .eq('id', userId)
    .single()

  if (error || !worksheet) {
    throw createError({ statusCode: 404, message: 'Worksheet not found' })
  }

  return {
    worksheet: {
      ...worksheet,
      topic: worksheet.topic || (worksheet.content as any)?.topic || worksheet.title
    }
  }
})
