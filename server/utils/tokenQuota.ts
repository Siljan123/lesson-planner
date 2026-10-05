// server/utils/tokenQuota.ts

import type { Database } from '~~/shared/types/database.types';

export interface QuotaCheckResult {
  hasQuota: boolean;
  limit: number;
  used: number;
  resetDate?: Date;
}

/**
 * Checks a user's token quota, handling weekly lazy-resets automatically.
 * @param userId - The user ID to check.
 * @param supabase - A service role Supabase client.
 */
export async function checkAndResetQuota(
  userId: string,
  supabase: any
): Promise<QuotaCheckResult> {
  const { data: quota, error } = await supabase
    .from('user_token_quotas')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error || !quota) {
    // If no quota found, assume they have the default and let them proceed, 
    // or ideally create it. It should be created by the DB trigger.
    console.error(`[checkAndResetQuota] Error fetching quota for ${userId}:`, error?.message);
    // Return a default pass state if missing to prevent blocking due to sync issues
    return { hasQuota: true, limit: 100000, used: 0 };
  }

  const now = new Date();
  const periodStart = new Date(quota.period_start_date);
  const diffTime = Math.abs(now.getTime() - periodStart.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  let currentUsed = quota.tokens_used;
  let currentStart = periodStart;

  // 1. Handle Lazy Reset (30 days)
  if (diffDays >= 30) {
    // Reset tokens and update period_start_date
    currentStart = now;
    currentUsed = 0;

    const { error: resetError } = await supabase
      .from('user_token_quotas')
      .update({
        tokens_used: 0,
        period_start_date: currentStart.toISOString(),
        updated_at: currentStart.toISOString()
      })
      .eq('user_id', userId);
      
    if (resetError) {
      console.error(`[checkAndResetQuota] Failed to reset quota for ${userId}:`, resetError.message);
    }
  }

  // 2. Check if they are over the limit
  if (currentUsed >= quota.token_limit) {
    const nextResetDate = new Date(currentStart);
    nextResetDate.setDate(nextResetDate.getDate() + 30);
    
    return {
      hasQuota: false,
      limit: quota.token_limit,
      used: currentUsed,
      resetDate: nextResetDate
    };
  }

  return {
    hasQuota: true,
    limit: quota.token_limit,
    used: currentUsed
  };
}

/**
 * Consumes tokens using the secure RPC.
 * @param userId - The user ID to consume tokens for.
 * @param amount - The number of tokens consumed.
 * @param supabase - A service role Supabase client.
 */
export async function consumeTokens(
  userId: string,
  amount: number,
  supabase: any
): Promise<void> {
  if (amount <= 0) return;
  
  const { error } = await supabase.rpc('increment_tokens', {
    p_user_id: userId,
    p_amount: amount
  });

  if (error) {
    console.error(`[consumeTokens] Failed to consume tokens for ${userId}:`, error.message);
  }
}
