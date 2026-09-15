<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useAsyncData } from '#imports'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import {
  Circle,
  CircleDot,
  CircleCheck,
  Timer,
  Loader,
  SlidersHorizontal,
  Trash2,
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
  MoreHorizontal,
  Eye,
  ArrowRight,
  Download,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight
} from '@lucide/vue'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import type { Worksheet } from '~/types/worksheet'
import AddSheet from '@/components/worksheet/AddSheet.vue'
import PreviewSheet from '@/components/worksheet/PreviewSheet.vue'

const { fetchAll, deleteWorksheet, downloadExport } = useWorksheets()

const { data: worksheets, pending, refresh } = useAsyncData('all-worksheets', async () => {
  return (await fetchAll()) as Worksheet[]
}, { lazy: true })

const isPreviewSheetOpen = ref(false)
const selectedWorksheet = ref<Worksheet | null>(null)
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
    selectedIds.value = filteredWorksheets.value.map((w: Worksheet) => w.id)
  } else {
    selectedIds.value = []
  }
}

const subjectsList = computed(() => {
  if (!worksheets.value) return []
  const set = new Set<string>()
  worksheets.value.forEach((ws: any) => {
    if (ws.subject?.name) set.add(ws.subject.name)
  })
  return Array.from(set).sort()
})

const filteredWorksheets = computed(() => {
  let result = (worksheets.value || []) as Worksheet[]

  // Search
  const query = search.value.trim().toLowerCase()
  if (query) {
    result = result.filter((ws: any) =>
      [ws.title, ws.topic, ws.subject?.name, ws.grade?.label, ws.target_competency]
        .some((val) => String(val || '').toLowerCase().includes(query))
    )
  }

  // Status Filter
  if (statusFilter.value.length > 0) {
    result = result.filter((ws: any) => statusFilter.value.includes(ws.status || 'draft'))
  }

  // Subject Filter
  if (subjectFilter.value.length > 0) {
    result = result.filter((ws: any) => subjectFilter.value.includes(ws.subject?.name || ''))
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
    }

    if (typeof valA === 'string') {
      const cmp = valA.localeCompare(valB || '')
      return sortOrder.value === 'asc' ? cmp : -cmp
    }
    return sortOrder.value === 'asc' ? (valA > valB ? 1 : -1) : (valA < valB ? 1 : -1)
  })

  return result
})

const pageIndex = ref(0)
const pageSize = ref('10')

watch([search, statusFilter, subjectFilter, sortKey, sortOrder, pageSize], () => {
  pageIndex.value = 0
})

const paginatedWorksheets = computed(() => {
  const start = pageIndex.value * Number(pageSize.value)
  const end = start + Number(pageSize.value)
  return filteredWorksheets.value.slice(start, end)
})

const pageCount = computed(() => {
  return Math.ceil(filteredWorksheets.value.length / Number(pageSize.value)) || 1
})

function openPreview(ws: Worksheet) {
  selectedWorksheet.value = ws
  isPreviewSheetOpen.value = true
}

async function handleDelete(ws: Worksheet) {
  if (!confirm(`Are you sure you want to delete "${ws.title}"?`)) return
  isDeleting.value = ws.id
  try {
    await deleteWorksheet(ws.id)
    await refresh()
  } catch (err) {
    console.error('Failed to delete worksheet:', err)
    alert('Failed to delete worksheet')
  } finally {
    isDeleting.value = null
  }
}

async function handleBulkDelete() {
  if (!confirm(`Delete ${selectedIds.value.length} selected worksheet(s)?`)) return
  isDeleting.value = 'bulk'
  try {
    for (const id of selectedIds.value) {
      await deleteWorksheet(id)
    }
    selectedIds.value = []
    await refresh()
  } catch (err) {
    console.error('Bulk delete failed:', err)
  } finally {
    isDeleting.value = null
  }
}

function formatDate(dateStr: string) {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  })
}
</script>

<template>
  <div class="space-y-5 py-6 w-full max-w-7xl mx-auto">
    <!-- Toolbar -->
    <div class="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
      <div class="flex flex-wrap items-center gap-2">
        <div class="relative w-full sm:w-auto flex-1 min-w-[150px]">
          <Input
            v-model="search"
            class="h-8 w-full sm:w-44 text-[13px] border-border rounded-md bg-transparent placeholder:text-muted-foreground focus:ring-0 focus:border-border"
            placeholder="Filter worksheets..."
          />
        </div>

        <!-- Status Filter -->
        <DropdownMenu>
          <DropdownMenuTrigger as-child>
            <Button variant="outline" size="sm" class="h-8 gap-1.5 text-[13px] border-dashed font-normal shrink-0">
              <CircleDot class="size-3.5" />
              Status
              <Badge v-if="statusFilter.length" variant="secondary" class="ml-1 h-5 px-1">{{ statusFilter.length }}</Badge>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" class="w-40">
            <DropdownMenuItem
              v-for="st in ['draft', 'ready', 'exported']"
              :key="st"
              class="text-[13px]"
              @click="() => { const idx = statusFilter.indexOf(st); if (idx > -1) statusFilter.splice(idx, 1); else statusFilter.push(st); }"
            >
              <span class="flex items-center gap-2 capitalize">
                <CircleCheck v-if="statusFilter.includes(st)" class="size-3.5 text-primary" />
                <Circle v-else class="size-3.5 text-muted-foreground opacity-30" />
                {{ st.replace('_', ' ') }}
              </span>
            </DropdownMenuItem>
            <DropdownMenuSeparator v-if="statusFilter.length > 0" />
            <DropdownMenuItem v-if="statusFilter.length > 0" class="text-[13px] justify-center" @click="statusFilter = []">
              Clear Filters
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <!-- Subject Filter -->
        <DropdownMenu>
          <DropdownMenuTrigger as-child>
            <Button variant="outline" size="sm" class="h-8 gap-1.5 text-[13px] border-dashed font-normal shrink-0">
              <SlidersHorizontal class="size-3.5" />
              Subject
              <Badge v-if="subjectFilter.length" variant="secondary" class="ml-1 h-5 px-1">{{ subjectFilter.length }}</Badge>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" class="w-48 max-h-64 overflow-y-auto">
            <DropdownMenuItem
              v-for="sub in subjectsList"
              :key="sub"
              class="text-[13px]"
              @click="() => { const idx = subjectFilter.indexOf(sub); if (idx > -1) subjectFilter.splice(idx, 1); else subjectFilter.push(sub); }"
            >
              <span class="flex items-center gap-2">
                <CircleCheck v-if="subjectFilter.includes(sub)" class="size-3.5 text-primary" />
                <Circle v-else class="size-3.5 text-muted-foreground opacity-30" />
                {{ sub }}
              </span>
            </DropdownMenuItem>
            <DropdownMenuSeparator v-if="subjectFilter.length > 0" />
            <DropdownMenuItem v-if="subjectFilter.length > 0" class="text-[13px] justify-center" @click="subjectFilter = []">
              Clear Filters
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <!-- Bulk Delete -->
        <Button
          v-if="selectedIds.length > 0"
          variant="destructive"
          size="sm"
          class="h-8 gap-1.5 text-[13px] font-normal shrink-0"
          :disabled="isDeleting === 'bulk'"
          @click="handleBulkDelete"
        >
          <Loader v-if="isDeleting === 'bulk'" class="size-3.5 animate-spin" />
          <Trash2 v-else class="size-3.5" />
          Delete {{ selectedIds.length }}
        </Button>
      </div>

      <!-- Add Sheet Action -->
      <div class="flex items-center gap-2 w-full md:w-auto md:justify-end">
        <AddSheet @created="refresh" />
      </div>
    </div>

    <!-- Data Table -->
    <div class="border rounded-lg overflow-hidden bg-card">
      <Table>
        <TableHeader>
          <TableRow class="hover:bg-transparent border-b">
            <TableHead class="w-[40px] px-3">
              <input
                type="checkbox"
                class="rounded border-gray-300 text-primary focus:ring-primary"
                :checked="selectedIds.length > 0 && selectedIds.length === filteredWorksheets.length"
                :indeterminate="selectedIds.length > 0 && selectedIds.length < filteredWorksheets.length"
                @change="toggleAllSelection"
              />
            </TableHead>
            <TableHead class="text-[13px] font-medium h-10 w-44">
              <span class="inline-flex items-center gap-1 cursor-pointer hover:text-foreground" @click="toggleSort('title')">
                Title
                <ArrowDown v-if="sortKey === 'title' && sortOrder === 'desc'" class="ml-1 size-3.5" />
                <ArrowUp v-else-if="sortKey === 'title' && sortOrder === 'asc'" class="ml-1 size-3.5" />
                <ArrowUpDown v-else class="ml-1 size-3.5 text-muted-foreground/40" />
              </span>
            </TableHead>
            <TableHead class="text-[13px] font-medium h-10">
              <span class="inline-flex items-center gap-1 cursor-pointer hover:text-foreground" @click="toggleSort('subject')">
                Topic & Subject
                <ArrowDown v-if="sortKey === 'subject' && sortOrder === 'desc'" class="ml-1 size-3.5" />
                <ArrowUp v-else-if="sortKey === 'subject' && sortOrder === 'asc'" class="ml-1 size-3.5" />
                <ArrowUpDown v-else class="ml-1 size-3.5 text-muted-foreground/40" />
              </span>
            </TableHead>
            <TableHead class="text-[13px] font-medium h-10 w-32">
              <span class="inline-flex items-center gap-1 cursor-pointer hover:text-foreground" @click="toggleSort('status')">
                Status
                <ArrowDown v-if="sortKey === 'status' && sortOrder === 'desc'" class="ml-1 size-3.5" />
                <ArrowUp v-else-if="sortKey === 'status' && sortOrder === 'asc'" class="ml-1 size-3.5" />
                <ArrowUpDown v-else class="ml-1 size-3.5 text-muted-foreground/40" />
              </span>
            </TableHead>
            <TableHead class="text-[13px] font-medium h-10 w-28">
              <span class="inline-flex items-center gap-1 cursor-pointer hover:text-foreground" @click="toggleSort('grade')">
                Grade
                <ArrowDown v-if="sortKey === 'grade' && sortOrder === 'desc'" class="ml-1 size-3.5" />
                <ArrowUp v-else-if="sortKey === 'grade' && sortOrder === 'asc'" class="ml-1 size-3.5" />
                <ArrowUpDown v-else class="ml-1 size-3.5 text-muted-foreground/40" />
              </span>
            </TableHead>
            <TableHead class="text-[13px] font-medium h-10 w-32">
              <span class="inline-flex items-center gap-1 cursor-pointer hover:text-foreground" @click="toggleSort('created_at')">
                Date
                <ArrowDown v-if="sortKey === 'created_at' && sortOrder === 'desc'" class="ml-1 size-3.5" />
                <ArrowUp v-else-if="sortKey === 'created_at' && sortOrder === 'asc'" class="ml-1 size-3.5" />
                <ArrowUpDown v-else class="ml-1 size-3.5 text-muted-foreground/40" />
              </span>
            </TableHead>
            <TableHead class="text-[13px] font-medium h-10 w-12 text-right"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <!-- Loading State -->
          <TableRow v-if="pending" class="hover:bg-transparent border-b">
            <TableCell colspan="7" class="text-center py-16">
              <div class="flex flex-col items-center justify-center gap-2">
                <Loader class="size-5 text-muted-foreground animate-spin" />
                <span class="text-[13px] text-muted-foreground">Loading worksheets...</span>
              </div>
            </TableCell>
          </TableRow>

          <!-- Empty State -->
          <TableRow v-else-if="!worksheets || worksheets.length === 0" class="hover:bg-transparent border-b">
            <TableCell colspan="7" class="text-center py-16">
              <div class="flex flex-col items-center justify-center gap-3">
                <div class="h-10 w-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
                  <BookOpen class="h-5 w-5" />
                </div>
                <p class="text-sm font-medium text-foreground">No worksheets generated yet.</p>
                <p class="text-xs text-muted-foreground">Click "Create Worksheet" to generate student-ready practice sheets.</p>
              </div>
            </TableCell>
          </TableRow>

          <!-- No Results State -->
          <TableRow v-else-if="filteredWorksheets.length === 0" class="hover:bg-transparent border-b">
            <TableCell colspan="7" class="py-16 text-center text-[13px] text-muted-foreground">
              No worksheet matches "{{ search }}".
            </TableCell>
          </TableRow>

          <!-- Data Rows -->
          <TableRow
            v-for="ws in paginatedWorksheets"
            :key="ws.id"
            v-else
            class="border-b hover:bg-muted/40 transition-colors"
          >
            <!-- Checkbox -->
            <TableCell class="px-3">
              <input
                type="checkbox"
                class="rounded border-gray-300 text-primary focus:ring-primary"
                :checked="selectedIds.includes(ws.id)"
                @change="toggleSelection(ws.id)"
              />
            </TableCell>

            <!-- Title -->
            <TableCell class="py-3 pr-3">
              <NuxtLink
                :to="`/authenticated/worksheets/${ws.id}`"
                class="text-[14px] font-medium text-foreground truncate hover:underline min-w-5 block"
                :title="ws.title"
              >
                {{ ws.title }}
              </NuxtLink>
            </TableCell>

            <!-- Topic & Subject -->
            <TableCell class="py-3">
              <div class="flex items-center gap-2">
                <span class="inline-flex items-center text-[11px] font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded">
                  {{ ws.subject?.name || 'Subject' }}
                </span>
              </div>
            </TableCell>

            <!-- Status -->
            <TableCell class="py-3">
              <div class="flex items-center gap-1.5">
                <CircleCheck v-if="ws.status === 'ready'" class="size-4 text-emerald-500 shrink-0" />
                <CircleDot v-else-if="ws.status === 'exported'" class="size-4 text-blue-500 shrink-0" />
                <Circle v-else class="size-4 text-muted-foreground/60 shrink-0" />
                <span class="text-[13px] text-foreground capitalize">{{ ws.status }}</span>
              </div>
            </TableCell>

            <!-- Grade -->
            <TableCell class="py-3">
              <span class="text-[13px] text-muted-foreground">{{ ws.grade?.label || '—' }}</span>
            </TableCell>

            <!-- Date -->
            <TableCell class="py-3">
              <span class="text-[13px] text-muted-foreground">{{ formatDate(ws.created_at) }}</span>
            </TableCell>

            <!-- Actions (Dropdown) -->
            <TableCell class="py-3 text-right">
              <DropdownMenu>
                <DropdownMenuTrigger as-child>
                  <Button variant="ghost" size="icon" class="size-8 rounded-md text-muted-foreground hover:text-foreground">
                    <MoreHorizontal class="size-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" class="w-48">
                  <DropdownMenuItem class="text-[13px] gap-2 cursor-pointer" @click="openPreview(ws)">
                    <Eye class="size-4 text-muted-foreground" /> Quick Preview
                  </DropdownMenuItem>
                  <DropdownMenuItem as-child class="text-[13px] gap-2 cursor-pointer">
                    <NuxtLink :to="`/authenticated/worksheets/${ws.id}`" class="flex items-center gap-2">
                      <ArrowRight class="size-4 text-muted-foreground" /> Open Full Page
                    </NuxtLink>
                  </DropdownMenuItem>
                  <DropdownMenuItem class="text-[13px] gap-2 cursor-pointer" @click="downloadExport(ws.id, ws.title)">
                    <Download class="size-4 text-muted-foreground" /> Download DOCX
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    class="text-[13px] gap-2 text-destructive focus:bg-destructive/10 focus:text-destructive cursor-pointer"
                    :disabled="isDeleting === ws.id"
                    @click="handleDelete(ws)"
                  >
                    <Loader v-if="isDeleting === ws.id" class="size-4 animate-spin" />
                    <Trash2 v-else class="size-4" />
                    {{ isDeleting === ws.id ? 'Deleting...' : 'Delete Worksheet' }}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>

    <!-- Footer / pagination -->
    <div v-if="filteredWorksheets.length > 0" class="flex items-center justify-between px-2 py-4">
      <div class="text-[13px] text-muted-foreground hidden sm:block">
        {{ selectedIds.length }} of {{ filteredWorksheets.length }} row(s) selected.
      </div>
      <div class="flex items-center justify-between sm:justify-end w-full sm:w-auto space-x-6 lg:space-x-8">
        <div class="flex items-center space-x-2">
          <p class="text-[13px] font-medium text-foreground hidden sm:block">Rows per page</p>
          <Select v-model="pageSize">
            <SelectTrigger class="h-8 w-[70px] text-[13px]"><SelectValue /></SelectTrigger>
            <SelectContent side="top">
              <SelectItem v-for="n in [10,20,30,40,50]" :key="n" :value="`${n}`" class="text-[13px]">{{ n }}</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div class="flex items-center justify-center text-[13px] font-medium text-foreground">
          Page {{ pageIndex + 1 }} of {{ pageCount }}
        </div>
        <div class="flex items-center space-x-2">
          <Button variant="outline" class="h-8 w-8 p-0" :disabled="pageIndex === 0" @click="pageIndex = 0">
            <ChevronsLeft class="h-4 w-4" />
          </Button>
          <Button variant="outline" class="h-8 w-8 p-0" :disabled="pageIndex === 0" @click="pageIndex--">
            <ChevronLeft class="h-4 w-4" />
          </Button>
          <Button variant="outline" class="h-8 w-8 p-0" :disabled="pageIndex >= pageCount - 1" @click="pageIndex++">
            <ChevronRight class="h-4 w-4" />
          </Button>
          <Button variant="outline" class="h-8 w-8 p-0" :disabled="pageIndex >= pageCount - 1" @click="pageIndex = pageCount - 1">
            <ChevronsRight class="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>

    <!-- Quick Preview Sheet -->
    <PreviewSheet v-model:open="isPreviewSheetOpen" :worksheet="selectedWorksheet" />
  </div>
</template>
