import { serverSupabaseClient, serverSupabaseUser } from '#supabase/server'
import type { Database } from '~~/shared/types/database.types'

export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event)
  if (!user) throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  const userId = (user as any).sub || user.id

  const supabase = await serverSupabaseClient<Database>(event)
  const id = getRouterParam(event, 'id')

  if (!id) {
    throw createError({ statusCode: 400, message: 'Missing id parameter' })
  }

  // Check ownership or admin
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', userId).single()
  const { data: worksheet } = await supabase.from('worksheets').select('owner_id').eq('id', id).single()

  if (!worksheet) {
    throw createError({ statusCode: 404, message: 'Worksheet not found' })
  }

  if (worksheet.owner_id !== userId && profile?.role !== 'admin') {
    throw createError({ statusCode: 403, message: 'Forbidden' })
  }

  const { error } = await supabase.from('worksheets').delete().eq('id', id)

  if (error) {
    throw createError({ statusCode: 500, message: error.message })
  }

  return { success: true }
})
