import { serverSupabaseClient, serverSupabaseUser } from '#supabase/server'
import { readBody } from 'h3'
import type { Database } from '~~/shared/types/database.types'

export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event)
  if (!user) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  const body = await readBody(event)
  if (!body.path) {
    throw createError({ statusCode: 400, statusMessage: 'Path is required' })
  }

  const supabase = await serverSupabaseClient<Database>(event)
  
  const { data, error } = await supabase.storage.from('exports').createSignedUrl(body.path, 60)

  if (error) {
    throw createError({ statusCode: 500, statusMessage: error.message })
  }

  return data
})
