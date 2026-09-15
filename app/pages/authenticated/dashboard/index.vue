<script setup lang="ts">
import { computed } from 'vue'
import { useAsyncData } from '#imports'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { FileText, CheckCircle, FileEdit, Archive, Activity, ArrowRight, BarChart3, Gauge, Zap, Timer, Coins, CalendarDays } from '@lucide/vue'
import AddSheet from '@/components/lessonplan/AddSheet.vue'
import TokenUsageChart from '@/components/custom/TokenUsageChart.vue'

const { fetchStats } = useLessonPlans()
const {
  usage,
  history,
  pending: usagePending,
  historyPending,
  percentUsed,
  remainingPlans,
  hoursUntilReset,
  isNearLimit,
  isLimitReached,
  usageColor,
  fetchUsage,
  fetchDailyHistory,
} = useUsage()

// Fetch summary stats (lazy: true = non-blocking, page renders immediately)
const { data: stats, pending: statsPending } = useAsyncData('dashboard-stats', () => fetchStats(), { lazy: true })

// Fetch usage data
onMounted(async () => {
  await Promise.all([
    fetchUsage().catch(() => {}),
    fetchDailyHistory().catch(() => {}),
  ])
})

function formatTokens(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`
  return String(n)
}

const usageStatusColor = computed(() => {
  switch (usageColor.value) {
    case 'red': return 'text-red-500'
    case 'amber': return 'text-amber-500'
    default: return 'text-green-500'
  }
})

const progressBarColor = computed(() => {
  switch (usageColor.value) {
    case 'red': return 'bg-red-500'
    case 'amber': return 'bg-amber-500'
    default: return 'bg-green-500'
  }
})

const progressBarBg = computed(() => {
  switch (usageColor.value) {
    case 'red': return 'bg-red-500/15'
    case 'amber': return 'bg-amber-500/15'
    default: return 'bg-green-500/15'
  }
})
</script>

<template>
  <div class="space-y-6 max-w-full min-w-0">
    <div class="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
      <div>
        <h2 class="text-2xl font-semibold tracking-tight">Dashboard</h2>
        <p class="text-muted-foreground text-sm">Overview of your lesson planning progress.</p>
      </div>
    </div>

    <!-- Summary Stats -->
    <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader class="flex flex-row items-center justify-between pb-2 space-y-0">
          <CardTitle class="text-sm font-medium">Total Lesson Plans</CardTitle>
          <FileText class="w-4 h-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div class="text-2xl font-bold">{{ stats?.total || 0 }}</div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader class="flex flex-row items-center justify-between pb-2 space-y-0">
          <CardTitle class="text-sm font-medium">Drafts</CardTitle>
          <FileEdit class="w-4 h-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div class="text-2xl font-bold">{{ stats?.draft || 0 }}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader class="flex flex-row items-center justify-between pb-2 space-y-0">
          <CardTitle class="text-sm font-medium">Ready</CardTitle>
          <CheckCircle class="w-4 h-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div class="text-2xl font-bold">{{ stats?.ready || 0 }}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader class="flex flex-row items-center justify-between pb-2 space-y-0">
          <CardTitle class="text-sm font-medium">Today's Usage</CardTitle>
          <Gauge class="w-4 h-4" :class="usageStatusColor" />
        </CardHeader>
        <CardContent>
          <div class="text-2xl font-bold" :class="usageStatusColor">{{ percentUsed }}%</div>
          <div class="flex items-center justify-between mt-1">
            <p class="text-xs text-muted-foreground">
              {{ formatTokens(usage?.used ?? 0) }} / {{ formatTokens(usage?.limit ?? 200000) }} tokens
            </p>
          </div>
          <div class="h-1.5 rounded-full mt-2 overflow-hidden" :class="progressBarBg">
            <div
              class="h-full rounded-full transition-all duration-500"
              :class="progressBarColor"
              :style="{ width: `${Math.min(percentUsed, 100)}%` }"
            />
          </div>
        </CardContent>
      </Card>
    </div>

    <!-- AI Studio Limits Reference -->
    <div class="grid gap-4 md:grid-cols-3">
      <Card>
        <CardHeader class="flex flex-row items-center justify-between pb-2 space-y-0">
          <CardTitle class="text-sm font-medium">RPM (Requests Per Minute)</CardTitle>
          <Timer class="w-4 h-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div class="text-2xl font-bold">15</div>
          <p class="text-xs text-muted-foreground mt-1">
            Max AI Studio requests per minute on free tier.
          </p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader class="flex flex-row items-center justify-between pb-2 space-y-0">
          <CardTitle class="text-sm font-medium">TPM (Tokens Per Minute)</CardTitle>
          <Coins class="w-4 h-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div class="text-2xl font-bold">1 Million</div>
          <p class="text-xs text-muted-foreground mt-1">
            Max tokens (words/pieces of words) processed per minute.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader class="flex flex-row items-center justify-between pb-2 space-y-0">
          <CardTitle class="text-sm font-medium">TPD (Tokens Per Day)</CardTitle>
          <CalendarDays class="w-4 h-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div class="text-2xl font-bold">200K <span class="text-sm font-normal text-muted-foreground">(App Limit)</span></div>
          <p class="text-xs text-muted-foreground mt-1">
            AI Studio allows 1,500 requests/day. We limit to 200K tokens/day to prevent abuse.
          </p>
        </CardContent>
      </Card>
    </div>

    <!-- Charts & Actions Row -->
    <div class="grid gap-3 sm:grid-cols-3">
      <Card class="lg:col-span-2">
        <CardHeader>
          <CardTitle class="flex items-center gap-2">
            <BarChart3 class="w-5 h-5" />
            Daily Token Usage
          </CardTitle>
          <p class="text-xs text-muted-foreground">Last 7 days of AI token consumption</p>
        </CardHeader>
        <CardContent>
          <div v-if="historyPending" class="h-[200px] flex items-center justify-center">
            <div class="animate-pulse text-muted-foreground text-sm">Loading chart...</div>
          </div>
          <TokenUsageChart
            v-else-if="history"
            :history="history.history"
            :daily-limit="history.dailyLimit"
          />
          <div v-else class="h-[200px] flex items-center justify-center text-muted-foreground text-sm">
            No usage data available
          </div>
        </CardContent>
      </Card>

      <!-- Today's Usage Summary -->
      <Card>
        <CardHeader>
          <CardTitle class="flex items-center gap-2">
            <Zap class="w-5 h-5" />
            Today's Summary
          </CardTitle>
        </CardHeader>
        <CardContent class="space-y-4">
          <!-- Reset info -->
          <div class="space-y-1">
            <p class="text-sm text-muted-foreground">Quota Resets In</p>
            <p class="text-lg font-semibold">{{ hoursUntilReset }} hours</p>
          </div>

          <div
            class="rounded-md px-3 py-2 w-full text-sm font-medium"
            :class="isLimitReached
              ? 'bg-red-500/10 text-red-600 dark:text-red-400'
              : isNearLimit
                ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                : 'bg-green-500/10 text-brand dark:text-green-400'"
          >
            <span v-if="isLimitReached"> Daily limit reached</span>
            <span v-else-if="isNearLimit"> Approaching daily limit</span>
            <span v-else> Usage is normal</span>
          </div>
        </CardContent>
      </Card>
    </div>

    <div class="grid gap-6 md:grid-cols-2">
      <!-- Activity or quick links -->
      <Card>
        <CardHeader>
          <CardTitle class="flex items-center gap-2">
            <Activity class="w-5 h-5" />
            Quick Actions
          </CardTitle>
        </CardHeader>
        <CardContent class="space-y-4">
          <p class="text-sm text-muted-foreground mb-4">
            Get started by creating a new lesson plan or browsing your existing ones.
          </p>
          <div class="flex flex-col gap-2">
            <NuxtLink to="/authenticated/generated-lesson-plan" class="flex items-center justify-between p-3 border rounded-md hover:bg-muted/50 transition-colors">
              <span class="font-medium text-sm">View Lesson Plans Table</span>
              <ArrowRight class="w-4 h-4 text-muted-foreground" />
            </NuxtLink>
            <NuxtLink to="/authenticated/generated-lesson-plan" class="flex items-center justify-between p-3 border rounded-md hover:bg-muted/50 transition-colors">
              <span class="font-medium text-sm">Generate New Lesson Plan</span>
              <ArrowRight class="w-4 h-4 text-muted-foreground" />
            </NuxtLink>
          </div>
        </CardContent>
      </Card>
    </div>
  </div>
</template>