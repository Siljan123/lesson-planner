import { serverSupabaseServiceRole, serverSupabaseClient, serverSupabaseUser } from '#supabase/server'
import type { Database } from '~~/shared/types/database.types'

export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event)
  if (!user) throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  const adminId = (user as any).sub || user.id

  const client = await serverSupabaseClient<Database>(event)
  const { data: callerProfile } = await client.from('profiles').select('role').eq('id', adminId).single()
  if (callerProfile?.role !== 'admin') {
    throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
  }

  const body = await readBody(event)
  const { user_id, amount } = body

  if (!user_id || !amount || typeof amount !== 'number' || amount <= 0) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid parameters' })
  }

  const supabase = serverSupabaseServiceRole<Database>(event)

  const { error: rpcError } = await supabase.rpc('admin_add_tokens', {
    p_user_id: user_id,
    p_amount: amount
  })

  if (rpcError) {
    throw createError({ statusCode: 500, statusMessage: rpcError.message })
  }

  return { success: true }
})
