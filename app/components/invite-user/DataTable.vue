<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { PlusCircle, ArrowUpDown, ArrowDown, ArrowUp, MoreHorizontal, Check, X, Shield, User as UserIcon, ChevronsLeft, ChevronLeft, ChevronRight, ChevronsRight } from '@lucide/vue'

const props = defineProps<{
  data: Array<any>
}>()

const searchQuery = ref('')
const roleFilter = ref<string[]>([])
const sortColumn = ref<string>('created_at')
const sortOrder = ref<'asc' | 'desc'>('desc')
const currentPage = ref(1)
const pageSizeStr = ref('10')
const pageSize = computed(() => parseInt(pageSizeStr.value))

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

const filteredData = computed(() => {
  return props.data.filter(user => {
    // Search filter
    if (searchQuery.value) {
      const query = searchQuery.value.toLowerCase()
      if (!user.full_name?.toLowerCase().includes(query) && !user.email?.toLowerCase().includes(query)) {
        return false
      }
    }
    // Role filter
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
</script>


<template>
  <div class="space-y-4">
    <!-- Toolbar -->
    <div class="flex items-center justify-between">
      <div class="flex flex-1 items-center space-x-2">
        <Input 
          v-model="searchQuery" 
          placeholder="Search users..." 
          class="h-8 w-[150px] lg:w-[250px]" 
        />
        
        <!-- Role Filter (Popover) -->
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

        <Button v-if="hasFilters" variant="ghost" class="h-8 px-2 lg:px-3" @click="resetFilters">
          Reset
          <X class="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>

    <!-- Table -->
    <div class="rounded-md border border-border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead class="w-[300px]">
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
            <TableHead>School ID</TableHead>
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
            <TableHead class="text-right">
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
            <TableCell>
              {{ user.school_id || '-' }}
            </TableCell>
            <TableCell>
              <div class="flex flex-col">
                <span class="font-medium">{{ user.document_count || 0 }}</span>
                <span v-if="user.document_kinds" class="text-xs text-muted-foreground truncate max-w-[150px]" :title="user.document_kinds">
                  {{ user.document_kinds }}
                </span>
              </div>
            </TableCell>
            <TableCell class="text-right">
              {{ user.total_tokens?.toLocaleString() || 0 }}
            </TableCell>
            <TableCell class="text-right text-muted-foreground">
              {{ new Date(user.created_at).toLocaleDateString() }}
            </TableCell>
            <TableCell>
              <DropdownMenu>
                <DropdownMenuTrigger as-child>
                  <Button variant="ghost" class="h-8 w-8 p-0">
                    <MoreHorizontal class="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem>Edit</DropdownMenuItem>
                  <DropdownMenuItem class="text-destructive">Revoke Access</DropdownMenuItem>
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
    <div class="flex items-center justify-between px-2">
      <div class="text-sm text-muted-foreground">
        Showing {{ filteredData.length > 0 ? (currentPage - 1) * pageSize + 1 : 0 }} to {{ Math.min(currentPage * pageSize, filteredData.length) }} of {{ filteredData.length }} users.
      </div>
      <div class="flex items-center space-x-6 lg:space-x-8">
        <div class="flex items-center space-x-2">
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
        <div class="flex items-center space-x-2">
          <Button variant="outline" class="h-8 w-8 p-0" :disabled="currentPage === 1" @click="currentPage = 1"><ChevronsLeft class="h-4 w-4" /></Button>
          <Button variant="outline" class="h-8 w-8 p-0" :disabled="currentPage === 1" @click="currentPage--"><ChevronLeft class="h-4 w-4" /></Button>
          <Button variant="outline" class="h-8 w-8 p-0" :disabled="currentPage === totalPages || totalPages === 0" @click="currentPage++"><ChevronRight class="h-4 w-4" /></Button>
          <Button variant="outline" class="h-8 w-8 p-0" :disabled="currentPage === totalPages || totalPages === 0" @click="currentPage = totalPages"><ChevronsRight class="h-4 w-4" /></Button>
        </div>
      </div>
    </div>
  </div>
</template>

