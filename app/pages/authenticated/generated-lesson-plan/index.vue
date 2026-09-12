<script setup lang="ts">
import { computed, ref } from 'vue'
import { useAsyncData } from '#imports'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Edit, Eye, ArrowRight, FilePlus2, Search, Sparkles, MoreHorizontal, ArrowUpRight, ArrowDownRight, ArrowRight as ArrowRightIcon, Circle, CircleDot, CircleCheck, CircleX, Timer, Loader, SlidersHorizontal, ChevronDown } from '@lucide/vue'
import { Input } from '@/components/ui/input'
import AddSheet from '@/components/lessonplan/AddSheet.vue'
import EditSheet from '@/components/lessonplan/EditSheet.vue'
import PreviewSheet from '@/components/lessonplan/PreviewSheet.vue'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"

const { fetchAll } = useLessonPlans()

const { data: plans, pending, refresh } = useAsyncData('all-lesson-plans', async () => {
  return await fetchAll() as any[]
}, { lazy: true })

const statusColors: Record<string, string> = {
  draft: 'bg-[var(--status-draft)] text-[var(--status-draft-foreground)]',
  needs_review: 'bg-[var(--status-review)] text-[var(--status-review-foreground)]',
  ready: 'bg-[var(--status-ready)] text-[var(--status-ready-foreground)]',
  exported: 'bg-[var(--status-exported)] text-[var(--status-exported-foreground)]'
}

const isEditSheetOpen = ref(false)
const isPreviewSheetOpen = ref(false)
const selectedPlan = ref<any>(null)
const search = ref('')

const filteredPlans = computed(() => {
  const query = search.value.trim().toLowerCase()
  if (!query) return plans.value || []
  return (plans.value || []).filter((plan: any) =>
    [plan.title, plan.subject?.name, plan.grade?.label, plan.topic, plan.matatag_competency_code]
      .some((value) => String(value || '').toLowerCase().includes(query))
  )
})

function openEdit(plan: any) {
  selectedPlan.value = plan
  isEditSheetOpen.value = true
}

function openPreview(plan: any) {
  selectedPlan.value = plan
  isPreviewSheetOpen.value = true
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  })
}
</script>

<template>
  <div class="space-y-5 py-6 max-w-full min-w-0">
    <div class="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
      <div class="flex flex-wrap items-center gap-2 w-full md:w-auto">
        <div class="relative w-full sm:w-auto flex-1 min-w-[150px]">
          <Input
            v-model="search"
            class="h-8 w-full sm:w-44 text-[13px] border-gray-200 rounded-md bg-transparent placeholder:text-gray-400 focus:ring-0 focus:border-gray-300"
            placeholder="Filter lesson plans..."
          />
        </div>
        <Button variant="outline" size="sm" class="h-8 gap-1.5 text-[13px] text-gray-600 border-gray-200 hover:bg-gray-50 font-normal shrink-0">
          <CircleDot class="size-3.5" />
          Status
        </Button>
        <Button variant="outline" size="sm" class="h-8 gap-1.5 text-[13px] text-gray-600 border-gray-200 hover:bg-gray-50 font-normal shrink-0">
          <SlidersHorizontal class="size-3.5" />
          Subject
        </Button>
      </div>
      
      <div class="flex items-center gap-2 w-full md:w-auto md:justify-end">
        <Button variant="outline" size="sm" class="h-8 gap-1.5 text-[13px] text-gray-600 border-gray-200 hover:bg-gray-50 font-normal shrink-0">
          <SlidersHorizontal class="size-3.5" />
          View
        </Button>
        <AddSheet @created="refresh" />
      </div>
    </div>

    <!-- Table -->
    <div class="w-full">
      <Table>
        <TableHeader>
          <TableRow class="hover:bg-transparent border-b border-gray-200">
            <TableHead class="text-[13px] font-medium text-gray-500 h-10 w-35">Title</TableHead>
            <TableHead class="text-[13px] font-medium text-gray-500 h-10">
              <span class="inline-flex items-center gap-1 cursor-pointer hover:text-gray-700">Description</span>
            </TableHead>
            <TableHead class="text-[13px] font-medium text-gray-500 h-10 w-35">
              <span class="inline-flex items-center gap-1 cursor-pointer hover:text-gray-700">Status</span>
            </TableHead>
            <TableHead class="text-[13px] font-medium text-gray-500 h-10 w-30">Grade</TableHead>
            <TableHead class="text-[13px] font-medium text-gray-500 h-10 w-30">Date</TableHead>
            <TableHead class="text-[13px] font-medium text-gray-500 h-10 w-12.5"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <!-- Loading State -->
          <TableRow v-if="pending" class="hover:bg-transparent border-b border-gray-100">
            <TableCell colspan="6" class="text-center py-16">
              <div class="flex flex-col items-center justify-center gap-2">
                <Loader class="size-5 text-gray-300 animate-spin" />
                <span class="text-[13px] text-gray-400">Loading lesson plans...</span>
              </div>
            </TableCell>
          </TableRow>

          <!-- Empty State -->
          <TableRow v-else-if="!plans || plans.length === 0" class="hover:bg-transparent border-b border-gray-100">
            <TableCell colspan="6" class="text-center py-16">
              <div class="flex flex-col items-center justify-center gap-3">
                <p class="text-[13px] text-gray-500">No lesson plans found. Create one to get started.</p>
              </div>
            </TableCell>
          </TableRow>

          <!-- No Results State -->
          <TableRow v-else-if="filteredPlans.length === 0" class="hover:bg-transparent border-b border-gray-100">
            <TableCell colspan="6" class="py-16 text-center text-[13px] text-gray-500">No lesson plan matches "{{ search }}".</TableCell>
          </TableRow>

          <!-- Data Rows -->
          <TableRow
            v-for="plan in filteredPlans"
            :key="plan.id"
            v-else
            class="border-b border-gray-100 hover:bg-gray-50/50 transition-colors"
          >
            <!-- Title -->
            <TableCell class="py-3 pr-3">
              <p class="text-[13px] font-medium text-gray-900 truncate" :title="plan.title">{{ plan.title }}</p>
            </TableCell>

            <!-- Description / Subject Tag + Topic -->
            <TableCell class="py-3">
              <div class="flex items-center gap-2">
                <span class="inline-flex items-center shrink-0 text-[11px] font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                  {{ plan.subject?.name || 'Subject' }}
                </span>
                <span class="text-[13px] text-gray-600 truncate">{{ plan.topic || '—' }}</span>
              </div>
            </TableCell>

            <!-- Status -->
            <TableCell class="py-3">
              <div class="flex items-center gap-1.5">
                <!-- Status Icon -->
                <CircleCheck v-if="plan.status === 'ready'" class="size-4 text-emerald-500 shrink-0" />
                <Timer v-else-if="plan.status === 'needs_review'" class="size-4 text-amber-500 shrink-0" />
                <CircleDot v-else-if="plan.status === 'exported'" class="size-4 text-blue-500 shrink-0" />
                <Circle v-else class="size-4 text-gray-400 shrink-0" />
                <span class="text-[13px] text-gray-700">{{ plan.status === 'needs_review' ? 'Needs Review' : plan.status === 'ready' ? 'Ready' : plan.status === 'exported' ? 'Exported' : 'Draft' }}</span>
              </div>
            </TableCell>

            <!-- Grade -->
            <TableCell class="py-3">
              <span class="text-[13px] text-gray-600">{{ plan.grade?.label || '—' }}</span>
            </TableCell>

            <!-- Date -->
            <TableCell class="py-3">
              <span class="text-[13px] text-gray-500">{{ formatDate(plan.created_at) }}</span>
            </TableCell>

            <!-- Actions (three-dot menu) -->
            <TableCell class="py-3 text-right">
              <DropdownMenu>
                <DropdownMenuTrigger as-child>
                  <Button variant="ghost" size="icon" class="size-8 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100">
                    <MoreHorizontal class="size-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" class="w-48">
                  <DropdownMenuItem @click="openPreview(plan)" class="text-[13px] gap-2">
                    <Eye class="size-4 text-gray-500" /> Preview DLL
                  </DropdownMenuItem>
                  <DropdownMenuItem @click="openEdit(plan)" class="text-[13px] gap-2">
                    <Edit class="size-4 text-gray-500" /> Quick Edit
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem as-child class="text-[13px] gap-2">
                    <NuxtLink :to="`/authenticated/generated-lesson-plan/${plan.id}`" class="flex items-center gap-2">
                      <ArrowRight class="size-4 text-gray-500" /> Open Editor
                    </NuxtLink>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>

    <!-- Footer count -->
    <div v-if="filteredPlans.length > 0" class="text-[12px] text-gray-400">
      {{ filteredPlans.length }} of {{ (plans || []).length }} lesson plan(s)
    </div>

    <!-- Edit Sheet -->
    <EditSheet v-model:open="isEditSheetOpen" :plan="selectedPlan" @updated="refresh" />

    <!-- Preview Sheet -->
    <PreviewSheet v-model:open="isPreviewSheetOpen" :plan="selectedPlan" />
  </div>
</template>
