import { serverSupabaseClient, serverSupabaseUser } from '#supabase/server'
import type { Database } from '~~/shared/types/database.types'

export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event)
  if (!user) throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  const userId = (user as any).sub || user.id
  
  const supabase = await serverSupabaseClient<Database>(event)
  
  const { data: quota, error } = await supabase
    .from('user_token_quotas')
    .select('*')
    .eq('user_id', userId)
    .single()

  if (error || !quota) {
    // If not found, return default
    const resetTime = new Date()
    resetTime.setDate(resetTime.getDate() + 30)
    return {
      used: 0,
      limit: 100000,
      percentage: 0,
      resetTime: resetTime.toISOString(),
      isLimitReached: false,
      daysUntilReset: 30
    }
  }

  const periodStart = new Date(quota.period_start_date)
  const resetTime = new Date(periodStart)
  resetTime.setDate(resetTime.getDate() + 30)
  
  const now = new Date()
  const diffTime = resetTime.getTime() - now.getTime()
  const daysUntilReset = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)))

  const usedTokens = quota.tokens_used
  const limit = quota.token_limit

  return {
    used: usedTokens,
    limit: limit,
    percentage: limit > 0 ? Math.min(100, Math.round((usedTokens / limit) * 100)) : 0,
    resetTime: resetTime.toISOString(),
    isLimitReached: usedTokens >= limit,
    daysUntilReset
  }
})
