import { serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const supabase = await serverSupabaseClient(event)
  const { data, error } = await supabase.from('grade_levels').select('*').order('sort_order')

  if (error) {
    throw createError({ statusCode: 500, statusMessage: error.message })
  }

  return data
})
