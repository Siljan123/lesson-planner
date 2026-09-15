import { serverSupabaseClient } from '#supabase/server'
import type { Database } from '~~/shared/types/database.types'

export default defineEventHandler(async (event) => {
  const supabase = await serverSupabaseClient<Database>(event)
  const { data: { user } } = await supabase.auth.getUser()
  const id = getRouterParam(event, 'id')
  const body = await readBody(event) || {}

  const userId = (user as any)?.sub || user?.id
  if (!userId) {
    throw createError({ statusCode: 401, message: 'Unauthorized' })
  }

  if (!id) {
    throw createError({ statusCode: 400, message: 'Missing worksheet ID' })
  }

  // Fetch current
  const { data: current, error: fetchErr } = await supabase
    .from('worksheets')
    .select('*')
    .eq('id', id)
    .single()

  if (fetchErr || !current) {
    throw createError({ statusCode: 404, message: 'Worksheet not found' })
  }

  const updatePayload: Record<string, any> = {
    updated_at: new Date().toISOString()
  }

  if (body.title !== undefined) updatePayload.title = body.title
  if (body.topic !== undefined) updatePayload.topic = body.topic
  if (body.status !== undefined) updatePayload.status = body.status
  if (body.target_competency !== undefined) updatePayload.target_competency = body.target_competency
  if (body.medium_of_instruction !== undefined) updatePayload.medium_of_instruction = body.medium_of_instruction
  if (body.content !== undefined) updatePayload.content = body.content
  if (body.ai_use_declaration !== undefined) updatePayload.ai_use_declaration = body.ai_use_declaration

  const { data, error } = await supabase
    .from('worksheets')
    .update(updatePayload as any)
    .eq('id', id)
    .select(`
      *,
      subject:subjects(name, code),
      grade:grade_levels(label),
      lesson_plan:lesson_plans(id, title)
    `)
    .single()

  if (error || !data) {
    console.error('[worksheets/update] Error updating worksheet:', error)
    throw createError({
      statusCode: 500,
      message: error?.message ? `Failed to update worksheet: ${error.message}` : 'Failed to update worksheet'
    })
  }

  return {
    worksheet: {
      ...data,
      topic: data.topic || (data.content as any)?.topic || data.title
    }
  }
})
