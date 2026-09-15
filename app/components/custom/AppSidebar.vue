<script setup lang="ts">
import { LayoutDashboard, FilePlus2, FileArchive, BookOpen, Gauge, AlertTriangle, Users2Icon } from '@lucide/vue'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
  useSidebar,
} from '@/components/ui/sidebar'

const route = useRoute()
const { roleName } = useProfile()
const { setOpenMobile } = useSidebar()

const navItems = [
  { title: 'Dashboard', url: '/authenticated/dashboard', icon: LayoutDashboard },
  { title: 'Lesson Plans', url: '/authenticated/generated-lesson-plan', icon: FilePlus2 },
  { title: 'Worksheets', url: '/authenticated/worksheets', icon: BookOpen },
]

const adminItems = computed(() => {
  if (roleName.value !== 'admin') return []
  return [
    { title: 'Users', url: '/authenticated/invite-user', icon: Users2Icon },
  ]
})

const { usage, percentUsed, remainingPlans, hoursUntilReset, isNearLimit, isLimitReached, usageColor, fetchUsage, startPolling } = useUsage()

onMounted(async () => {
  await fetchUsage().catch(() => {})
  startPolling(60000)
})

function formatTokens(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`
  return String(n)
}

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

const gaugeIconColor = computed(() => {
  switch (usageColor.value) {
    case 'red': return 'text-red-500'
    case 'amber': return 'text-amber-500'
    default: return 'text-green-500'
  }
})
</script>

<template>
  <Sidebar collapsible="icon">
    <SidebarHeader>
      <div class="flex items-center gap-2 px-2 py-1.5">
        <span class="text-lg font-bold tracking-tight text-primary truncate group-data-[collapsible=icon]:hidden">
          Lesson Plan AI
        </span>
      </div>
    </SidebarHeader>

    <SidebarContent>
      <SidebarGroup>
        <SidebarGroupLabel>Menu</SidebarGroupLabel>
        <SidebarGroupContent>
          <SidebarMenu>
            <SidebarMenuItem v-for="item in navItems" :key="item.url">
              <SidebarMenuButton as-child :is-active="route.path === item.url" :tooltip="item.title" @click="setOpenMobile(false)">
                <NuxtLink :to="item.url">
                  <component :is="item.icon" />
                  <span>{{ item.title }}</span>
                </NuxtLink>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>

      <template v-if="adminItems.length">
        <SidebarSeparator />
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem v-for="item in adminItems" :key="item.url">
                <SidebarMenuButton as-child :is-active="route.path === item.url" :tooltip="item.title" @click="setOpenMobile(false)">
                  <NuxtLink :to="item.url">
                    <component :is="item.icon" />
                    <span>{{ item.title }}</span>
                  </NuxtLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </template>
    </SidebarContent>

    <!-- Token Usage Footer -->
    <SidebarFooter>
      <div class="px-2 py-2">
        <!-- Collapsed state: just a gauge icon -->
        <div class="hidden group-data-[collapsible=icon]:flex items-center justify-center">
          <div class="relative" :title="`${percentUsed}% tokens used today — ${remainingPlans} plans remaining`">
            <Gauge class="w-5 h-5" :class="gaugeIconColor" />
            <span
              v-if="isLimitReached"
              class="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse"
            />
          </div>
        </div>

        <!-- Expanded state: full widget -->
        <div class="group-data-[collapsible=icon]:hidden space-y-2">
          <!-- Header -->
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-1.5">
              <Gauge class="w-3.5 h-3.5" :class="gaugeIconColor" />
              <span class="text-xs font-medium text-foreground">API Usage</span>
            </div>
            <span class="text-[10px] text-muted-foreground">
              Resets in {{ hoursUntilReset }}h
            </span>
          </div>

          <!-- Progress bar -->
          <div class="space-y-1">
            <div class="h-2 rounded-full overflow-hidden" :class="progressBarBg">
              <div
                class="h-full rounded-full transition-all duration-500"
                :class="progressBarColor"
                :style="{ width: `${Math.min(percentUsed, 100)}%` }"
              />
            </div>
            <div class="flex items-center justify-between">
              <span class="text-[10px] text-muted-foreground">
                {{ formatTokens(usage?.used ?? 0) }} / {{ formatTokens(usage?.limit ?? 50000) }}
              </span>
              <span class="text-[10px] text-muted-foreground">
                {{ percentUsed }}%
              </span>
            </div>
          </div>

          <!-- Remaining plans estimate -->
          <div
            class="flex items-center gap-1.5 rounded-md px-2 py-1.5 text-xs"
            :class="isLimitReached
              ? 'bg-red-500/10 text-red-600 dark:text-red-400'
              : isNearLimit
                ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                : 'bg-muted text-muted-foreground'"
          >
            <AlertTriangle v-if="isLimitReached || isNearLimit" class="w-3 h-3 shrink-0" />
            <span v-if="isLimitReached">Daily limit reached</span>
            <span v-else>~{{ remainingPlans }} lesson plans remaining</span>
          </div>
        </div>
      </div>
    </SidebarFooter>
  </Sidebar>
</template>