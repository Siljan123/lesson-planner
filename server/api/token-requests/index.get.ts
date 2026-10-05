import { serverSupabaseClient, serverSupabaseServiceRole, serverSupabaseUser } from '#supabase/server'
import type { Database } from '~~/shared/types/database.types'

export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event)
  if (!user) throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  const userId = (user as any).sub || user.id

  const supabase = await serverSupabaseClient<Database>(event)

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .single()

  const isAdmin = profile?.role === 'admin'

  // If admin, use service role to bypass RLS and guarantee we see all requests
  const queryClient = isAdmin ? serverSupabaseServiceRole<Database>(event) : supabase

  let query = queryClient
    .from('token_requests')
    .select(`
      id,
      user_id,
      requested_amount,
      status,
      admin_note,
      created_at,
      profiles!token_requests_user_id_fkey (
        full_name
      )
    `)
    .order('created_at', { ascending: false })

  if (!isAdmin) {
    // Users only see their own requests
    query = query.eq('user_id', userId)
  }


  const { data, error } = await query

  if (error) {
    throw createError({ statusCode: 500, statusMessage: error.message })
  }

  return data
})
