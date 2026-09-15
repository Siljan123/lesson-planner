import { serverSupabaseClient, serverSupabaseUser } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event)
  if (!user) throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  const userId = (user as any).sub || user.id

  const supabase = await serverSupabaseClient(event)

  // Get the last 7 days of data
  const sevenDaysAgo = new Date()
  sevenDaysAgo.setUTCDate(sevenDaysAgo.getUTCDate() - 6)
  sevenDaysAgo.setUTCHours(0, 0, 0, 0)

  const { data: lessonPlans, error: lpError } = await supabase
    .from('lesson_plans')
    .select('created_at, ai_use_declaration')
    .gte('created_at', sevenDaysAgo.toISOString())
    .eq('owner_id', userId)
    .order('created_at', { ascending: true })

  const { data: worksheets, error: wsError } = await supabase
    .from('worksheets')
    .select('created_at, ai_use_declaration')
    .gte('created_at', sevenDaysAgo.toISOString())
    .eq('owner_id', userId)
    .order('created_at', { ascending: true })

  if (lpError || wsError) {
    throw createError({ statusCode: 500, statusMessage: lpError?.message || wsError?.message })
  }

  // Aggregate by date
  const dailyMap = new Map<string, { tokens: number; plans: number }>()

  // Pre-fill all 7 days so chart always shows full week
  for (let i = 0; i < 7; i++) {
    const d = new Date(sevenDaysAgo)
    d.setUTCDate(d.getUTCDate() + i)
    const key = d.toISOString().slice(0, 10)
    dailyMap.set(key, { tokens: 0, plans: 0 })
  }

  const processData = (items: any[] | null) => {
    if (!items) return
    items.forEach((item: any) => {
      const dateKey = item.created_at?.slice(0, 10)
      if (!dateKey) return
      const entry = dailyMap.get(dateKey)
      if (!entry) return
      const tokenCount = item.ai_use_declaration?.token_usage?.totalTokenCount
      if (tokenCount) entry.tokens += parseInt(tokenCount, 10)
      entry.plans += 1
    })
  }

  processData(lessonPlans)
  processData(worksheets)

  const DAILY_LIMIT = 200000

  const history = Array.from(dailyMap.entries()).map(([date, data]) => ({
    date,
    tokens: data.tokens,
    plans: data.plans,
  }))

  return {
    history,
    dailyLimit: DAILY_LIMIT,
  }
})
