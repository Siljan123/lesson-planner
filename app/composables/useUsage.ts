import { ref, computed, onUnmounted } from 'vue'

interface UsageData {
  used: number
  limit: number
  percentage: number
  resetTime: string
  isLimitReached: boolean
}

interface DailyUsageEntry {
  date: string
  tokens: number
  plans: number
}

interface UsageHistoryData {
  history: DailyUsageEntry[]
  dailyLimit: number
}

// Avg tokens per lesson plan generation (Gemini 3.6 Flash ILAW)
const AVG_TOKENS_PER_PLAN = 3500

export const useUsage = () => {
  const usage = ref<UsageData | null>(null)
  const history = ref<UsageHistoryData | null>(null)
  const pending = ref(false)
  const historyPending = ref(false)
  const error = ref<string | null>(null)
  let pollTimer: ReturnType<typeof setInterval> | null = null

  const fetchUsage = async () => {
    pending.value = true
    error.value = null
    try {
      const headers = useRequestHeaders(['cookie']) as Record<string, string>
      const data = await $fetch<UsageData>('/api/user/usage', { headers })
      usage.value = data
      return data
    } catch (err: any) {
      error.value = err?.message || 'Failed to fetch usage'
      throw err
    } finally {
      pending.value = false
    }
  }

  const fetchDailyHistory = async () => {
    historyPending.value = true
    try {
      const headers = useRequestHeaders(['cookie']) as Record<string, string>
      const data = await $fetch<UsageHistoryData>('/api/user/usage-history', { headers })
      history.value = data
      return data
    } catch (err: any) {
      console.error('Failed to fetch usage history:', err)
      throw err
    } finally {
      historyPending.value = false
    }
  }

  const startPolling = (intervalMs = 60000) => {
    stopPolling()
    pollTimer = setInterval(() => {
      fetchUsage().catch(() => {})
    }, intervalMs)
  }

  const stopPolling = () => {
    if (pollTimer) {
      clearInterval(pollTimer)
      pollTimer = null
    }
  }

  // Computed helpers
  const percentUsed = computed(() => usage.value?.percentage ?? 0)

  const remainingTokens = computed(() => {
    if (!usage.value) return 0
    return Math.max(0, usage.value.limit - usage.value.used)
  })

  const remainingPlans = computed(() => {
    return Math.floor(remainingTokens.value / AVG_TOKENS_PER_PLAN)
  })

  const hoursUntilReset = computed(() => {
    if (!usage.value?.resetTime) return 0
    const reset = new Date(usage.value.resetTime)
    const now = new Date()
    const diffHours = Math.max(0, (reset.getTime() - now.getTime()) / (1000 * 60 * 60))
    return Math.ceil(diffHours)
  })

  const isNearLimit = computed(() => percentUsed.value >= 80)
  const isLimitReached = computed(() => usage.value?.isLimitReached ?? false)

  const usageColor = computed(() => {
    const pct = percentUsed.value
    if (pct >= 90) return 'red'
    if (pct >= 70) return 'amber'
    return 'green'
  })

  // Auto-cleanup polling on unmount
  onUnmounted(() => {
    stopPolling()
  })

  return {
    // State
    usage,
    history,
    pending,
    historyPending,
    error,
    // Actions
    fetchUsage,
    fetchDailyHistory,
    startPolling,
    stopPolling,
    // Computed
    percentUsed,
    remainingTokens,
    remainingPlans,
    hoursUntilReset,
    isNearLimit,
    isLimitReached,
    usageColor,
  }
}
