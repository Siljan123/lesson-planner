<script setup lang="ts">
import { computed, ref } from 'vue'
import { useAsyncData } from '#imports'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Edit, Eye, ArrowRight, FilePlus2, Search, Sparkles, MoreHorizontal, ArrowUpRight, ArrowDownRight, ArrowRight as ArrowRightIcon, Circle, CircleDot, CircleCheck, CircleX, Timer, Loader, SlidersHorizontal, ChevronDown, Trash2, ArrowUp, ArrowDown, ArrowUpDown } from '@lucide/vue'
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

const { fetchAll, deletePlan } = useLessonPlans()

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
const isDeleting = ref<string | null>(null)
const selectedIds = ref<string[]>([])
const sortKey = ref<string>('created_at')
const sortOrder = ref<'asc' | 'desc'>('desc')
const statusFilter = ref<string[]>([])
const subjectFilter = ref<string[]>([])

const toggleSort = (key: string) => {
  if (sortKey.value === key) {
    sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc'
  } else {
    sortKey.value = key
    sortOrder.value = 'asc'
  }
}

const toggleSelection = (id: string) => {
  const idx = selectedIds.value.indexOf(id)
  if (idx > -1) selectedIds.value.splice(idx, 1)
  else selectedIds.value.push(id)
}

const toggleAllSelection = (e: Event) => {
  const checked = (e.target as HTMLInputElement).checked
  if (checked) {
    selectedIds.value = filteredPlans.value.map((p: any) => p.id)
  } else {
    selectedIds.value = []
  }
}

const filteredPlans = computed(() => {
  let result = plans.value || []
  
  // Search
  const query = search.value.trim().toLowerCase()
  if (query) {
    result = result.filter((plan: any) =>
      [plan.title, plan.subject?.name, plan.grade?.label, plan.topic, plan.matatag_competency_code]
        .some((value) => String(value || '').toLowerCase().includes(query))
    )
  }

  // Filter Status
  if (statusFilter.value.length > 0) {
    result = result.filter((plan: any) => statusFilter.value.includes(plan.status || 'draft'))
  }

  // Filter Subject
  if (subjectFilter.value.length > 0) {
    result = result.filter((plan: any) => subjectFilter.value.includes(plan.subject?.name || 'Subject'))
  }

  // Sort
  result = [...result].sort((a: any, b: any) => {
    let valA = a[sortKey.value]
    let valB = b[sortKey.value]

    if (sortKey.value === 'subject') {
      valA = a.subject?.name || ''
      valB = b.subject?.name || ''
    } else if (sortKey.value === 'grade') {
      valA = a.grade?.label || ''
      valB = b.grade?.label || ''
    } else if (sortKey.value === 'status') {
      valA = a.status || 'draft'
      valB = b.status || 'draft'
    }

    if (valA === null || valA === undefined) valA = ''
    if (valB === null || valB === undefined) valB = ''

    let comparison = 0
    if (valA < valB) comparison = -1
    if (valA > valB) comparison = 1

    return sortOrder.value === 'asc' ? comparison : -comparison
  })

  return result
})

const subjectsList = computed(() => {
  const subs = new Set<string>()
  ;(plans.value || []).forEach((p: any) => {
    if (p.subject?.name) subs.add(p.subject.name)
  })
  return Array.from(subs).sort()
})

function openEdit(plan: any) {
  selectedPlan.value = plan
  isEditSheetOpen.value = true
}

function openPreview(plan: any) {
  selectedPlan.value = plan
  isPreviewSheetOpen.value = true
}

async function handleDelete(plan: any) {
  if (confirm(`Are you sure you want to delete "${plan.title}"?\nThis action cannot be undone.`)) {
    isDeleting.value = plan.id
    try {
      await deletePlan(plan.id)
      await refresh()
    } catch (err) {
      console.error(err)
      alert('Failed to delete lesson plan')
    } finally {
      isDeleting.value = null
    }
  }
}

async function handleBulkDelete() {
  if (selectedIds.value.length === 0) return
  if (confirm(`Are you sure you want to delete ${selectedIds.value.length} lesson plan(s)?\nThis action cannot be undone.`)) {
    isDeleting.value = 'bulk'
    try {
      await Promise.all(selectedIds.value.map(id => deletePlan(id)))
      selectedIds.value = []
      await refresh()
    } catch (err) {
      console.error(err)
      alert('Failed to delete some lesson plans')
    } finally {
      isDeleting.value = null
    }
  }
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
        <DropdownMenu>
          <DropdownMenuTrigger as-child>
            <Button variant="outline" size="sm" class="h-8 gap-1.5 text-[13px] text-gray-600 border-gray-200 hover:bg-gray-50 font-normal shrink-0">
              <CircleDot class="size-3.5" />
              Status
              <Badge v-if="statusFilter.length" variant="secondary" class="ml-1 h-5 px-1">{{ statusFilter.length }}</Badge>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" class="w-40">
            <DropdownMenuItem v-for="st in ['draft', 'needs_review', 'ready', 'exported']" :key="st" @click="() => { const idx = statusFilter.indexOf(st); if (idx > -1) statusFilter.splice(idx, 1); else statusFilter.push(st); }" class="text-[13px]">
              <span class="flex items-center gap-2 capitalize">
                <CircleCheck v-if="statusFilter.includes(st)" class="size-3.5 text-primary" />
                <Circle v-else class="size-3.5 text-muted-foreground opacity-30" />
                {{ st.replace('_', ' ') }}
              </span>
            </DropdownMenuItem>
            <DropdownMenuSeparator v-if="statusFilter.length > 0" />
            <DropdownMenuItem v-if="statusFilter.length > 0" @click="statusFilter = []" class="text-[13px] justify-center">
              Clear Filters
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        
        <DropdownMenu>
          <DropdownMenuTrigger as-child>
            <Button variant="outline" size="sm" class="h-8 gap-1.5 text-[13px] text-gray-600 border-gray-200 hover:bg-gray-50 font-normal shrink-0">
              <SlidersHorizontal class="size-3.5" />
              Subject
              <Badge v-if="subjectFilter.length" variant="secondary" class="ml-1 h-5 px-1">{{ subjectFilter.length }}</Badge>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" class="w-48 max-h-64 overflow-y-auto">
            <DropdownMenuItem v-for="sub in subjectsList" :key="sub" @click="() => { const idx = subjectFilter.indexOf(sub); if (idx > -1) subjectFilter.splice(idx, 1); else subjectFilter.push(sub); }" class="text-[13px]">
              <span class="flex items-center gap-2">
                <CircleCheck v-if="subjectFilter.includes(sub)" class="size-3.5 text-primary" />
                <Circle v-else class="size-3.5 text-muted-foreground opacity-30" />
                {{ sub }}
              </span>
            </DropdownMenuItem>
            <DropdownMenuSeparator v-if="subjectFilter.length > 0" />
            <DropdownMenuItem v-if="subjectFilter.length > 0" @click="subjectFilter = []" class="text-[13px] justify-center">
              Clear Filters
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <Button v-if="selectedIds.length > 0" variant="destructive" size="sm" class="h-8 gap-1.5 text-[13px] font-normal shrink-0 ml-2" @click="handleBulkDelete" :disabled="isDeleting === 'bulk'">
          <Loader v-if="isDeleting === 'bulk'" class="size-3.5 animate-spin" />
          <Trash2 v-else class="size-3.5" />
          Delete {{ selectedIds.length }}
        </Button>
      </div>
      
      <div class="flex items-center gap-2 w-full md:w-auto md:justify-end">
        <AddSheet @created="refresh" />
      </div>
    </div>

    <!-- Table -->
    <div class="w-full">
      <Table>
        <TableHeader>
          <TableRow class="hover:bg-transparent border-b border-gray-200">
            <TableHead class="w-[40px] px-3">
              <input type="checkbox" class="rounded border-gray-300 text-primary focus:ring-primary" :checked="selectedIds.length > 0 && selectedIds.length === filteredPlans.length" :indeterminate="selectedIds.length > 0 && selectedIds.length < filteredPlans.length" @change="toggleAllSelection" />
            </TableHead>
            <TableHead class="text-[13px] font-medium text-gray-500 h-10 w-35">
              <span class="inline-flex items-center gap-1 cursor-pointer hover:text-gray-700" @click="toggleSort('title')">
                Title
                <ArrowDown v-if="sortKey === 'title' && sortOrder === 'desc'" class="ml-1 size-3.5" />
                <ArrowUp v-else-if="sortKey === 'title' && sortOrder === 'asc'" class="ml-1 size-3.5" />
                <ArrowUpDown v-else class="ml-1 size-3.5 text-gray-300" />
              </span>
            </TableHead>
            <TableHead class="text-[13px] font-medium text-gray-500 h-10">
              <span class="inline-flex items-center gap-1 cursor-pointer hover:text-gray-700" @click="toggleSort('subject')">
                Description
                <ArrowDown v-if="sortKey === 'subject' && sortOrder === 'desc'" class="ml-1 size-3.5" />
                <ArrowUp v-else-if="sortKey === 'subject' && sortOrder === 'asc'" class="ml-1 size-3.5" />
                <ArrowUpDown v-else class="ml-1 size-3.5 text-gray-300" />
              </span>
            </TableHead>
            <TableHead class="text-[13px] font-medium text-gray-500 h-10 w-35">
              <span class="inline-flex items-center gap-1 cursor-pointer hover:text-gray-700" @click="toggleSort('status')">
                Status
                <ArrowDown v-if="sortKey === 'status' && sortOrder === 'desc'" class="ml-1 size-3.5" />
                <ArrowUp v-else-if="sortKey === 'status' && sortOrder === 'asc'" class="ml-1 size-3.5" />
                <ArrowUpDown v-else class="ml-1 size-3.5 text-gray-300" />
              </span>
            </TableHead>
            <TableHead class="text-[13px] font-medium text-gray-500 h-10 w-30">
              <span class="inline-flex items-center gap-1 cursor-pointer hover:text-gray-700" @click="toggleSort('grade')">
                Grade
                <ArrowDown v-if="sortKey === 'grade' && sortOrder === 'desc'" class="ml-1 size-3.5" />
                <ArrowUp v-else-if="sortKey === 'grade' && sortOrder === 'asc'" class="ml-1 size-3.5" />
                <ArrowUpDown v-else class="ml-1 size-3.5 text-gray-300" />
              </span>
            </TableHead>
            <TableHead class="text-[13px] font-medium text-gray-500 h-10 w-30">
              <span class="inline-flex items-center gap-1 cursor-pointer hover:text-gray-700" @click="toggleSort('created_at')">
                Date
                <ArrowDown v-if="sortKey === 'created_at' && sortOrder === 'desc'" class="ml-1 size-3.5" />
                <ArrowUp v-else-if="sortKey === 'created_at' && sortOrder === 'asc'" class="ml-1 size-3.5" />
                <ArrowUpDown v-else class="ml-1 size-3.5 text-gray-300" />
              </span>
            </TableHead>
            <TableHead class="text-[13px] font-medium text-gray-500 h-10 w-12.5"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <!-- Loading State -->
          <TableRow v-if="pending" class="hover:bg-transparent border-b border-gray-100">
            <TableCell colspan="7" class="text-center py-16">
              <div class="flex flex-col items-center justify-center gap-2">
                <Loader class="size-5 text-gray-300 animate-spin" />
                <span class="text-[13px] text-gray-400">Loading lesson plans...</span>
              </div>
            </TableCell>
          </TableRow>

          <!-- Empty State -->
          <TableRow v-else-if="!plans || plans.length === 0" class="hover:bg-transparent border-b border-gray-100">
            <TableCell colspan="7" class="text-center py-16">
              <div class="flex flex-col items-center justify-center gap-3">
                <p class="text-[13px] text-gray-500">No lesson plans found. Create one to get started.</p>
              </div>
            </TableCell>
          </TableRow>

          <!-- No Results State -->
          <TableRow v-else-if="filteredPlans.length === 0" class="hover:bg-transparent border-b border-gray-100">
            <TableCell colspan="7" class="py-16 text-center text-[13px] text-gray-500">No lesson plan matches "{{ search }}".</TableCell>
          </TableRow>

          <!-- Data Rows -->
          <TableRow
            v-for="plan in filteredPlans"
            :key="plan.id"
            v-else
            class="border-b border-gray-100 hover:bg-gray-50/50 transition-colors"
          >
            <!-- Checkbox -->
            <TableCell class="px-3">
              <input type="checkbox" class="rounded border-gray-300 text-primary focus:ring-primary" :checked="selectedIds.includes(plan.id)" @change="toggleSelection(plan.id)" />
            </TableCell>

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
                  <DropdownMenuSeparator />
                  <DropdownMenuItem @click="handleDelete(plan)" class="text-[13px] gap-2 text-red-600 focus:bg-red-50 focus:text-red-700" :disabled="isDeleting === plan.id">
                    <Loader v-if="isDeleting === plan.id" class="size-4 animate-spin" />
                    <Trash2 v-else class="size-4" /> 
                    {{ isDeleting === plan.id ? 'Deleting...' : 'Delete Plan' }}
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
