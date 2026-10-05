<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { 
  CheckCircle, XCircle, Loader2, MoreHorizontal, 
  ChevronsLeft, ChevronLeft, ChevronRight, ChevronsRight,
  PlusCircle, ArrowUpDown, ArrowDown, ArrowUp, X, Check,
  Circle, Timer, CircleCheck, CircleX, Calendar
} from '@lucide/vue'

const { data: requests, error: fetchError, refresh: refreshLocal } = await useFetch('/api/token-requests')

const emit = defineEmits<{
  (e: 'refresh'): void
}>()

const processingId = ref<string | null>(null)
const errorMsg = ref('')

// Filters & Sorting
const searchQuery = ref('')
const statusFilter = ref<string[]>([])
const dateSearch = ref('')
const sortColumn = ref<string>('created_at')
const sortOrder = ref<'asc' | 'desc'>('desc')

// Pagination
const pageSizeStr = ref('10')
const pageSize = computed(() => parseInt(pageSizeStr.value, 10))
const currentPage = ref(1)

const hasFilters = computed(() => searchQuery.value.length > 0 || statusFilter.value.length > 0 || dateSearch.value.length > 0)

function resetFilters() {
  searchQuery.value = ''
  statusFilter.value = []
  dateSearch.value = ''
  currentPage.value = 1
}

function toggleStatusFilter(status: string) {
  const index = statusFilter.value.indexOf(status)
  if (index > -1) {
    statusFilter.value.splice(index, 1)
  } else {
    statusFilter.value.push(status)
  }
  currentPage.value = 1
}

function toggleSort(column: string) {
  if (sortColumn.value === column) {
    if (sortOrder.value === 'asc') sortOrder.value = 'desc'
    else {
      sortColumn.value = ''
      sortOrder.value = 'asc'
    }
  } else {
    sortColumn.value = column
    sortOrder.value = 'asc'
  }
}

const filteredData = computed(() => {
  if (!requests.value) return []
  return requests.value.filter((req: any) => {
    // Search filter
    if (searchQuery.value) {
      const query = searchQuery.value.toLowerCase()
      if (!req.profiles?.full_name?.toLowerCase().includes(query)) {
        return false
      }
    }
    // Status filter
    if (statusFilter.value.length > 0 && !statusFilter.value.includes(req.status)) {
      return false
    }
    // Date search filter
    if (dateSearch.value) {
      const dateStr = new Date(req.created_at).toLocaleDateString()
      if (!dateStr.includes(dateSearch.value)) {
        return false
      }
    }
    return true
  }).sort((a: any, b: any) => {
    if (!sortColumn.value) return 0
    let valA = a[sortColumn.value]
    let valB = b[sortColumn.value]
    
    if (sortColumn.value === 'full_name') {
      valA = a.profiles?.full_name || ''
      valB = b.profiles?.full_name || ''
    }
    
    let result = 0
    if (valA < valB) result = -1
    else if (valA > valB) result = 1
    
    return sortOrder.value === 'asc' ? result : -result
  })
})

const totalPages = computed(() => {
  return Math.max(1, Math.ceil(filteredData.value.length / pageSize.value))
})

const paginatedData = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  return filteredData.value.slice(start, start + pageSize.value)
})

watch(pageSize, () => {
  currentPage.value = 1
})

async function processRequest(id: string, status: 'approved' | 'rejected') {
  processingId.value = id
  errorMsg.value = ''
  
  try {
    const headers = useRequestHeaders(['cookie']) as Record<string, string>
    await $fetch(`/api/token-requests/${id}`, {
      method: 'PATCH',
      headers,
      body: { status }
    })
    await refreshLocal()
    emit('refresh')
    
    if (paginatedData.value.length === 0 && currentPage.value > 1) {
      currentPage.value--
    }
  } catch (err: any) {
    errorMsg.value = err?.data?.statusMessage || err?.message || 'Failed to process request'
  } finally {
    processingId.value = null
  }
}

const statusIcons: Record<string, any> = { 
  pending: Timer, 
  approved: CircleCheck, 
  rejected: CircleX 
}

</script>

<template>
  <div class="space-y-4">
    <div v-if="errorMsg" class="p-3 bg-red-500/10 text-red-500 text-sm rounded-md">
      {{ errorMsg }}
    </div>
    
    <div v-if="fetchError" class="p-3 bg-red-500/10 text-red-500 text-sm rounded-md">
      Failed to load requests: {{ fetchError.message }}
    </div>

    <!-- Toolbar -->
    <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
      <div class="flex flex-wrap items-center gap-2">
        <Input 
          v-model="searchQuery" 
          placeholder="Search by name..." 
          class="h-8 w-[150px] lg:w-[200px]" 
        />
        
        <Input 
          v-model="dateSearch" 
          placeholder="Date (e.g. 5/7/2026)" 
          class="h-8 w-[150px] lg:w-[150px]" 
        />
        
        <!-- Status Filter (Popover) -->
        <Popover>
          <PopoverTrigger as-child>
            <Button variant="outline" size="sm" class="h-8 border-dashed">
              <PlusCircle class="mr-2 h-4 w-4" />
              Status
              <template v-if="statusFilter.length > 0">
                <Separator orientation="vertical" class="mx-2 h-4" />
                <Badge variant="secondary" class="rounded-sm px-1 font-normal">
                  {{ statusFilter.length }} selected
                </Badge>
              </template>
            </Button>
          </PopoverTrigger>
          <PopoverContent class="w-[200px] p-0" align="start">
            <Command>
              <CommandInput placeholder="Status" />
              <CommandList>
                <CommandEmpty>No results found.</CommandEmpty>
                <CommandGroup>
                  <CommandItem 
                    v-for="status in ['pending', 'approved', 'rejected']" 
                    :key="status" 
                    :value="status"
                    @select="toggleStatusFilter(status)"
                  >
                    <div class="mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary"
                         :class="statusFilter.includes(status) ? 'bg-primary text-primary-foreground' : 'opacity-50 [&_svg]:invisible'">
                      <Check class="h-4 w-4" />
                    </div>
                    <span class="capitalize">{{ status }}</span>
                  </CommandItem>
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>

        <Button v-if="hasFilters" variant="ghost" class="h-8 px-2 lg:px-3" @click="resetFilters">
          Reset
          <X class="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>

    <div class="rounded-md border border-border bg-card overflow-x-auto">
      <Table class="min-w-[600px]">
        <TableHeader>
          <TableRow>
            <TableHead class="w-[250px]">
              <Button variant="ghost" size="sm" class="-ml-3 h-8" @click="toggleSort('full_name')">
                <span>Name</span>
                <ArrowDown v-if="sortColumn === 'full_name' && sortOrder === 'desc'" class="ml-2 h-4 w-4" />
                <ArrowUp v-else-if="sortColumn === 'full_name' && sortOrder === 'asc'" class="ml-2 h-4 w-4" />
                <ArrowUpDown v-else class="ml-2 h-4 w-4" />
              </Button>
            </TableHead>
            <TableHead class="text-right">
              <div class="flex justify-end">
                <Button variant="ghost" size="sm" class="-mr-3 h-8" @click="toggleSort('requested_amount')">
                  <span>Amount Requested</span>
                  <ArrowDown v-if="sortColumn === 'requested_amount' && sortOrder === 'desc'" class="ml-2 h-4 w-4" />
                  <ArrowUp v-else-if="sortColumn === 'requested_amount' && sortOrder === 'asc'" class="ml-2 h-4 w-4" />
                  <ArrowUpDown v-else class="ml-2 h-4 w-4" />
                </Button>
              </div>
            </TableHead>
            <TableHead>
              <Button variant="ghost" size="sm" class="-ml-3 h-8" @click="toggleSort('status')">
                <span>Status</span>
                <ArrowDown v-if="sortColumn === 'status' && sortOrder === 'desc'" class="ml-2 h-4 w-4" />
                <ArrowUp v-else-if="sortColumn === 'status' && sortOrder === 'asc'" class="ml-2 h-4 w-4" />
                <ArrowUpDown v-else class="ml-2 h-4 w-4" />
              </Button>
            </TableHead>
            <TableHead class="text-right">
              <div class="flex justify-end">
                <Button variant="ghost" size="sm" class="-mr-3 h-8" @click="toggleSort('created_at')">
                  <span>Date Requested</span>
                  <ArrowDown v-if="sortColumn === 'created_at' && sortOrder === 'desc'" class="ml-2 h-4 w-4" />
                  <ArrowUp v-else-if="sortColumn === 'created_at' && sortOrder === 'asc'" class="ml-2 h-4 w-4" />
                  <ArrowUpDown v-else class="ml-2 h-4 w-4" />
                </Button>
              </div>
            </TableHead>
            <TableHead class="w-[50px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow v-for="req in paginatedData" :key="req.id">
            <TableCell>
              <div class="flex flex-col">
                <span class="font-medium">{{ req.profiles?.full_name || 'Unknown User' }}</span>
              </div>
            </TableCell>
            <TableCell class="text-right">
              <span class="font-medium">{{ req.requested_amount?.toLocaleString() || 0 }}</span>
            </TableCell>
            <TableCell>
              <div class="flex items-center gap-1.5 text-sm">
                <component :is="statusIcons[req.status] || Circle" class="h-4 w-4 text-muted-foreground" />
                <span class="capitalize">{{ req.status }}</span>
              </div>
            </TableCell>
            <TableCell class="text-right text-muted-foreground">
              {{ new Date(req.created_at).toLocaleDateString() }}
            </TableCell>
            <TableCell>
              <DropdownMenu v-if="req.status === 'pending'">
                <DropdownMenuTrigger as-child>
                  <Button variant="ghost" class="h-8 w-8 p-0 data-[state=open]:bg-muted">
                    <Loader2 v-if="processingId === req.id" class="h-4 w-4 animate-spin text-muted-foreground" />
                    <MoreHorizontal v-else class="h-4 w-4 text-muted-foreground" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem @click="processRequest(req.id, 'approved')">
                    <CheckCircle class="w-4 h-4 mr-2 text-green-600 dark:text-green-500" />
                    Approve
                  </DropdownMenuItem>
                  <DropdownMenuItem @click="processRequest(req.id, 'rejected')">
                    <XCircle class="w-4 h-4 mr-2 text-destructive" />
                    Reject
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </TableCell>
          </TableRow>
          <TableRow v-if="filteredData.length === 0">
            <TableCell colspan="5" class="h-24 text-center text-muted-foreground">
              No token requests found.
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>

    <!-- Pagination -->
    <div class="flex flex-col sm:flex-row items-center justify-between gap-4 px-2 py-4">
      <div class="text-sm text-muted-foreground">
        Showing {{ filteredData.length > 0 ? (currentPage - 1) * pageSize + 1 : 0 }} to {{ Math.min(currentPage * pageSize, filteredData.length) }} of {{ filteredData.length }} requests.
      </div>
      <div class="flex flex-wrap items-center gap-6 lg:gap-8">
        <div class="flex items-center gap-2">
          <p class="text-sm font-medium">Rows per page</p>
          <Select v-model="pageSizeStr">
            <SelectTrigger class="h-8 w-[70px]"><SelectValue /></SelectTrigger>
            <SelectContent side="top">
              <SelectItem v-for="n in [10,20,30,40,50]" :key="n" :value="`${n}`">{{ n }}</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div class="flex w-[100px] items-center justify-center text-sm font-medium">
          Page {{ currentPage }} of {{ totalPages || 1 }}
        </div>
        <div class="flex items-center gap-2">
          <Button variant="outline" class="hidden h-8 w-8 p-0 lg:flex" :disabled="currentPage === 1" @click="currentPage = 1">
            <span class="sr-only">Go to first page</span>
            <ChevronsLeft class="h-4 w-4" />
          </Button>
          <Button variant="outline" class="h-8 w-8 p-0" :disabled="currentPage === 1" @click="currentPage--">
            <span class="sr-only">Go to previous page</span>
            <ChevronLeft class="h-4 w-4" />
          </Button>
          <Button variant="outline" class="h-8 w-8 p-0" :disabled="currentPage === totalPages || totalPages === 0" @click="currentPage++">
            <span class="sr-only">Go to next page</span>
            <ChevronRight class="h-4 w-4" />
          </Button>
          <Button variant="outline" class="hidden h-8 w-8 p-0 lg:flex" :disabled="currentPage === totalPages || totalPages === 0" @click="currentPage = totalPages">
            <span class="sr-only">Go to last page</span>
            <ChevronsRight class="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  </div>
</template>
