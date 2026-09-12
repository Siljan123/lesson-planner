import { serverSupabaseClient, serverSupabaseUser } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event)
  if (!user) throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  const userId = (user as any).sub || user.id
  
  const supabase = await serverSupabaseClient(event)
  
  // Get start of today (UTC)
  const startOfDay = new Date()
  startOfDay.setUTCHours(0,0,0,0)

  const { data } = await supabase
    .from('lesson_plans')
    .select('ai_use_declaration')
    .gte('created_at', startOfDay.toISOString())
    .eq('owner_id', userId)

  let usedTokens = 0
  if (data) {
    data.forEach(plan => {
      const declaration = plan.ai_use_declaration
      const tokenUsage = typeof declaration === 'object' && declaration !== null && !Array.isArray(declaration)
        && 'token_usage' in declaration
        ? (declaration as { token_usage?: { totalTokenCount?: string | number } }).token_usage
        : undefined

      const rawUsage = tokenUsage?.totalTokenCount
      if (rawUsage !== undefined && rawUsage !== null) {
        usedTokens += parseInt(String(rawUsage), 10)
      }
    })
  }

  // Define daily token limit per user
  const DAILY_LIMIT = 50000 

  // Reset time is start of next day (UTC)
  const resetTime = new Date(startOfDay)
  resetTime.setUTCDate(resetTime.getUTCDate() + 1)

  return {
    used: usedTokens,
    limit: DAILY_LIMIT,
    percentage: Math.min(100, Math.round((usedTokens / DAILY_LIMIT) * 100)),
    resetTime: resetTime.toISOString(),
    isLimitReached: usedTokens >= DAILY_LIMIT
  }
})
