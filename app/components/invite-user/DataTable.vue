<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { PlusCircle, ArrowUpDown, ArrowDown, ArrowUp, MoreHorizontal, Check, X, Shield, User as UserIcon, ChevronsLeft, ChevronLeft, ChevronRight, ChevronsRight, Coins, Settings2, Plus } from '@lucide/vue'
import AddTokensDialog from './AddTokensDialog.vue'
import SetLimitDialog from './SetLimitDialog.vue'

const props = defineProps<{
  data: Array<any>
}>()

const emit = defineEmits<{
  (e: 'refresh'): void
}>()

const selectedUserForTokens = ref<any>(null)
const selectedUserForLimit = ref<any>(null)

const searchQuery = ref('')
const roleFilter = ref<string[]>([])
const sortColumn = ref<string>('created_at')
const sortOrder = ref<'asc' | 'desc'>('desc')
const currentPage = ref(1)
const pageSizeStr = ref('10')
const pageSize = computed(() => parseInt(pageSizeStr.value))

const sortOptions = [
  { value: 'full_name', label: 'Name' },
  { value: 'role', label: 'Role' },
  { value: 'document_count', label: 'Documents' },
  { value: 'total_tokens', label: 'Tokens' },
  { value: 'created_at', label: 'Date Added' },
]

const hasFilters = computed(() => searchQuery.value.length > 0 || roleFilter.value.length > 0)

function resetFilters() {
  searchQuery.value = ''
  roleFilter.value = []
  currentPage.value = 1
}

function toggleRoleFilter(role: string) {
  const index = roleFilter.value.indexOf(role)
  if (index > -1) {
    roleFilter.value.splice(index, 1)
  } else {
    roleFilter.value.push(role)
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

function toggleSortOrder() {
  sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc'
}

const filteredData = computed(() => {
  return props.data.filter(user => {
    if (searchQuery.value) {
      const query = searchQuery.value.toLowerCase()
      if (!user.full_name?.toLowerCase().includes(query) && !user.email?.toLowerCase().includes(query)) {
        return false
      }
    }
    if (roleFilter.value.length > 0 && !roleFilter.value.includes(user.role)) {
      return false
    }
    return true
  }).sort((a, b) => {
    if (!sortColumn.value) return 0
    const valA = a[sortColumn.value] ?? ''
    const valB = b[sortColumn.value] ?? ''

    let result = 0
    if (valA < valB) result = -1
    else if (valA > valB) result = 1

    return sortOrder.value === 'asc' ? result : -result
  })
})

const totalPages = computed(() => Math.ceil(filteredData.value.length / pageSize.value))

const paginatedData = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return filteredData.value.slice(start, end)
})

watch(pageSize, () => {
  currentPage.value = 1
})

watch(searchQuery, () => {
  currentPage.value = 1
})

const inviteDialogOpen = ref(false)

function handleRefresh() {
  emit('refresh')
}
</script>

<template>
  <div class="space-y-4">

    <!-- Toolbar -->
    <div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">

      <div class="flex flex-1 flex-wrap items-center gap-2">
        <Input
          v-model="searchQuery"
          placeholder="Search users..."
          class="h-8 w-full sm:w-[200px] lg:w-[250px]"
        />

        <Popover>
          <PopoverTrigger as-child>
            <Button variant="outline" size="sm" class="h-8 border-dashed">
              <PlusCircle class="mr-2 h-4 w-4" />
              Role
              <template v-if="roleFilter.length > 0">
                <Separator orientation="vertical" class="mx-2 h-4" />
                <Badge variant="secondary" class="rounded-sm px-1 font-normal">
                  {{ roleFilter.length }} selected
                </Badge>
              </template>
            </Button>
          </PopoverTrigger>
          <PopoverContent class="w-[200px] p-0" align="start">
            <Command>
              <CommandInput placeholder="Role" />
              <CommandList>
                <CommandEmpty>No results found.</CommandEmpty>
                <CommandGroup>
                  <CommandItem
                    v-for="role in ['admin', 'teacher']"
                    :key="role"
                    :value="role"
                    @select="toggleRoleFilter(role)"
                  >
                    <div class="mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary"
                         :class="roleFilter.includes(role) ? 'bg-primary text-primary-foreground' : 'opacity-50 [&_svg]:invisible'">
                      <Check class="h-4 w-4" />
                    </div>
                    <span class="capitalize">{{ role }}</span>
                  </CommandItem>
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>

        <!-- Mobile sort (table headers handle this on md+) -->
        <div class="flex items-center gap-1 md:hidden">
          <Select v-model="sortColumn">
            <SelectTrigger class="h-8 w-[130px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem v-for="opt in sortOptions" :key="opt.value" :value="opt.value">
                {{ opt.label }}
              </SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" class="h-8 w-8 p-0" aria-label="Toggle sort order" @click="toggleSortOrder">
            <ArrowDown v-if="sortOrder === 'desc'" class="h-4 w-4" />
            <ArrowUp v-else class="h-4 w-4" />
          </Button>
        </div>

        <Button v-if="hasFilters" variant="ghost" size="sm" class="h-8 px-2 lg:px-3" @click="resetFilters">
          Reset
          <X class="ml-2 h-4 w-4" />
        </Button>
      </div>

      <div class="flex items-center">
        <Button class="w-full sm:w-auto" variant="outline" @click="inviteDialogOpen = true">
          <Plus class="mr-2 h-4 w-4" />
          Invite User
        </Button>
      </div>
    </div>

    <!-- Mobile: card list -->
    <div class="space-y-3 md:hidden">
      <div
        v-for="user in paginatedData"
        :key="user.id"
        class="rounded-md border border-border bg-card p-4"
      >
        <div class="flex items-start justify-between gap-2">
          <div class="min-w-0">
            <p class="truncate font-medium">{{ user.full_name }}</p>
            <p class="truncate text-sm text-muted-foreground">{{ user.email }}</p>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger as-child>
              <Button variant="ghost" class="-mr-2 -mt-1 h-8 w-8 shrink-0 p-0" aria-label="Open actions">
                <MoreHorizontal class="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem @click="selectedUserForTokens = user">
                <Coins class="mr-2 h-4 w-4" />
                Add Tokens
              </DropdownMenuItem>
              <DropdownMenuItem @click="selectedUserForLimit = user">
                <Settings2 class="mr-2 h-4 w-4" />
                Edit Limit
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <dl class="mt-3 grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
          <div>
            <dt class="text-xs text-muted-foreground">Role</dt>
            <dd class="mt-0.5 flex items-center gap-2">
              <Shield v-if="user.role === 'admin'" class="h-4 w-4 text-muted-foreground" />
              <UserIcon v-else class="h-4 w-4 text-muted-foreground" />
              <span class="capitalize">{{ user.role }}</span>
            </dd>
          </div>
          <div>
            <dt class="text-xs text-muted-foreground">School ID</dt>
            <dd class="mt-0.5">{{ user.school_id || '-' }}</dd>
          </div>
          <div>
            <dt class="text-xs text-muted-foreground">Documents</dt>
            <dd class="mt-0.5">
              <span class="font-medium">{{ user.document_count || 0 }}</span>
              <span v-if="user.document_kinds" class="block truncate text-xs text-muted-foreground" :title="user.document_kinds">
                {{ user.document_kinds }}
              </span>
            </dd>
          </div>
          <div>
            <dt class="text-xs text-muted-foreground">Tokens</dt>
            <dd class="mt-0.5">
              <span class="font-medium">{{ user.total_tokens?.toLocaleString() || 0 }}</span>
              <span class="text-xs text-muted-foreground"> / {{ user.token_limit?.toLocaleString() || '100,000' }}</span>
            </dd>
          </div>
          <div class="col-span-2">
            <dt class="text-xs text-muted-foreground">Date Added</dt>
            <dd class="mt-0.5 text-muted-foreground">{{ new Date(user.created_at).toLocaleDateString() }}</dd>
          </div>
        </dl>
      </div>

      <div
        v-if="paginatedData.length === 0"
        class="flex h-24 items-center justify-center rounded-md border border-border bg-card text-sm text-muted-foreground"
      >
        No results.
      </div>
    </div>

    <!-- Desktop: table -->
    <div class="hidden rounded-md border border-border bg-card md:block">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead class="min-w-[220px]">
              <Button variant="ghost" size="sm" class="-ml-3 h-8" @click="toggleSort('full_name')">
                <span>Name & Email</span>
                <ArrowDown v-if="sortColumn === 'full_name' && sortOrder === 'desc'" class="ml-2 h-4 w-4" />
                <ArrowUp v-else-if="sortColumn === 'full_name' && sortOrder === 'asc'" class="ml-2 h-4 w-4" />
                <ArrowUpDown v-else class="ml-2 h-4 w-4" />
              </Button>
            </TableHead>
            <TableHead>
              <Button variant="ghost" size="sm" class="-ml-3 h-8" @click="toggleSort('role')">
                <span>Role</span>
                <ArrowDown v-if="sortColumn === 'role' && sortOrder === 'desc'" class="ml-2 h-4 w-4" />
                <ArrowUp v-else-if="sortColumn === 'role' && sortOrder === 'asc'" class="ml-2 h-4 w-4" />
                <ArrowUpDown v-else class="ml-2 h-4 w-4" />
              </Button>
            </TableHead>
            <TableHead class="hidden lg:table-cell">School ID</TableHead>
            <TableHead>
              <Button variant="ghost" size="sm" class="-ml-3 h-8" @click="toggleSort('document_count')">
                <span>Documents</span>
                <ArrowDown v-if="sortColumn === 'document_count' && sortOrder === 'desc'" class="ml-2 h-4 w-4" />
                <ArrowUp v-else-if="sortColumn === 'document_count' && sortOrder === 'asc'" class="ml-2 h-4 w-4" />
                <ArrowUpDown v-else class="ml-2 h-4 w-4" />
              </Button>
            </TableHead>
            <TableHead class="text-right">
              <div class="flex justify-end">
                <Button variant="ghost" size="sm" class="-mr-3 h-8" @click="toggleSort('total_tokens')">
                  <span>Tokens</span>
                  <ArrowDown v-if="sortColumn === 'total_tokens' && sortOrder === 'desc'" class="ml-2 h-4 w-4" />
                  <ArrowUp v-else-if="sortColumn === 'total_tokens' && sortOrder === 'asc'" class="ml-2 h-4 w-4" />
                  <ArrowUpDown v-else class="ml-2 h-4 w-4" />
                </Button>
              </div>
            </TableHead>
            <TableHead class="hidden text-right lg:table-cell">
              <div class="flex justify-end">
                <Button variant="ghost" size="sm" class="-mr-3 h-8" @click="toggleSort('created_at')">
                  <span>Date Added</span>
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
          <TableRow v-for="user in paginatedData" :key="user.id">
            <TableCell>
              <div class="flex flex-col">
                <span class="font-medium">{{ user.full_name }}</span>
                <span class="text-sm text-muted-foreground">{{ user.email }}</span>
              </div>
            </TableCell>
            <TableCell>
              <div class="flex items-center gap-2">
                <Shield v-if="user.role === 'admin'" class="h-4 w-4 text-muted-foreground" />
                <UserIcon v-else class="h-4 w-4 text-muted-foreground" />
                <span class="capitalize">{{ user.role }}</span>
              </div>
            </TableCell>
            <TableCell class="hidden lg:table-cell">
              {{ user.school_id || '-' }}
            </TableCell>
            <TableCell>
              <div class="flex flex-col">
                <span class="font-medium">{{ user.document_count || 0 }}</span>
                <span v-if="user.document_kinds" class="max-w-[150px] truncate text-xs text-muted-foreground" :title="user.document_kinds">
                  {{ user.document_kinds }}
                </span>
              </div>
            </TableCell>
            <TableCell class="text-right">
              <div class="flex flex-col items-end">
                <span class="font-medium">{{ user.total_tokens?.toLocaleString() || 0 }}</span>
                <span class="text-xs text-muted-foreground">/ {{ user.token_limit?.toLocaleString() || '100,000' }}</span>
              </div>
            </TableCell>
            <TableCell class="hidden text-right text-muted-foreground lg:table-cell">
              {{ new Date(user.created_at).toLocaleDateString() }}
            </TableCell>
            <TableCell>
              <DropdownMenu>
                <DropdownMenuTrigger as-child>
                  <Button variant="ghost" class="h-8 w-8 p-0" aria-label="Open actions">
                    <MoreHorizontal class="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem @click="selectedUserForTokens = user">
                    <Coins class="mr-2 h-4 w-4" />
                    Add Tokens
                  </DropdownMenuItem>
                  <DropdownMenuItem @click="selectedUserForLimit = user">
                    <Settings2 class="mr-2 h-4 w-4" />
                    Edit Limit
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </TableCell>
          </TableRow>
          <TableRow v-if="paginatedData.length === 0">
            <TableCell colspan="7" class="h-24 text-center text-muted-foreground">
              No results.
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>

    <!-- Pagination -->
    <div class="flex flex-col gap-4 px-2 sm:flex-row sm:items-center sm:justify-between">
      <div class="text-center text-sm text-muted-foreground sm:text-left">
        Showing {{ filteredData.length > 0 ? (currentPage - 1) * pageSize + 1 : 0 }} to {{ Math.min(currentPage * pageSize, filteredData.length) }} of {{ filteredData.length }} users.
      </div>
      <div class="flex flex-col items-center gap-3 sm:flex-row sm:gap-6 lg:gap-8">
        <div class="flex items-center space-x-2">
          <p class="text-sm font-medium">Rows per page</p>
          <Select v-model="pageSizeStr">
            <SelectTrigger class="h-8 w-[70px]"><SelectValue /></SelectTrigger>
            <SelectContent side="top">
              <SelectItem v-for="n in [10,20,30,40,50]" :key="n" :value="`${n}`">{{ n }}</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div class="flex items-center gap-4">
          <div class="flex min-w-[100px] items-center justify-center text-sm font-medium">
            Page {{ currentPage }} of {{ totalPages || 1 }}
          </div>
          <div class="flex items-center space-x-2">
            <Button variant="outline" class="hidden h-8 w-8 p-0 sm:flex" aria-label="First page" :disabled="currentPage === 1" @click="currentPage = 1"><ChevronsLeft class="h-4 w-4" /></Button>
            <Button variant="outline" class="h-8 w-8 p-0" aria-label="Previous page" :disabled="currentPage === 1" @click="currentPage--"><ChevronLeft class="h-4 w-4" /></Button>
            <Button variant="outline" class="h-8 w-8 p-0" aria-label="Next page" :disabled="currentPage === totalPages || totalPages === 0" @click="currentPage++"><ChevronRight class="h-4 w-4" /></Button>
            <Button variant="outline" class="hidden h-8 w-8 p-0 sm:flex" aria-label="Last page" :disabled="currentPage === totalPages || totalPages === 0" @click="currentPage = totalPages"><ChevronsRight class="h-4 w-4" /></Button>
          </div>
        </div>
      </div>
    </div>

    <AddTokensDialog
      v-if="selectedUserForTokens"
      :user="selectedUserForTokens"
      @close="selectedUserForTokens = null"
      @success="emit('refresh'); selectedUserForTokens = null"
    />

    <SetLimitDialog
      v-if="selectedUserForLimit"
      :user="selectedUserForLimit"
      @close="selectedUserForLimit = null"
      @success="emit('refresh'); selectedUserForLimit = null"
    />

    <InviteUserDialog
      v-model:open="inviteDialogOpen"
      @success="handleRefresh"
    />
  </div>
</template>