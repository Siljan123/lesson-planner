import { serverSupabaseClient, serverSupabaseUser } from '#supabase/server'
import type { Database } from '~~/shared/types/database.types'

export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event)
  if (!user) throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  const userId = (user as any).sub || user.id

  const body = await readBody(event)
  const { requested_amount } = body

  if (![500000, 1000000, 2000000, 4000000, 5000000].includes(requested_amount)) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid requested amount' })
  }

  const supabase = await serverSupabaseClient<Database>(event)

  // Check if they already have a pending request
  const { data: existing } = await supabase
    .from('token_requests')
    .select('id')
    .eq('user_id', userId)
    .eq('status', 'pending')
    .single()

  if (existing) {
    throw createError({ statusCode: 400, statusMessage: 'You already have a pending token request.' })
  }

  const { data, error } = await supabase
    .from('token_requests')
    .insert({
      user_id: userId,
      requested_amount
    })
    .select()
    .single()

  if (error) {
    throw createError({ statusCode: 500, statusMessage: error.message })
  }

  return data
})
