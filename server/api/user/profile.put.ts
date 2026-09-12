import { serverSupabaseClient, serverSupabaseUser } from '#supabase/server'
import type { Database } from '~~/shared/types/database.types'

export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event)
  if (!user) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  const userId = (user as any)?.sub || user?.id

  const body = await readBody(event)
  const supabase = await serverSupabaseClient<Database>(event)

  const updates: Database['public']['Tables']['profiles']['Update'] = {}
  if (body.full_name) updates.full_name = body.full_name

  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', userId)
    .select()
    .maybeSingle()

  if (error) {
    throw createError({ statusCode: 500, statusMessage: error.message })
  }

  return data
})
