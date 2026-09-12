<script setup lang="ts">
import { LogOut, ChevronsUpDown } from '@lucide/vue'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

const supabase = useSupabaseClient()
const router = useRouter()
const { displayName, displayEmail, initials, roleName, loadProfile, clearProfile } = useProfile()

onMounted(()=>{
  loadProfile()
})

const roleBadgeClass = computed(() => {
  switch (roleName.value) {
    case 'admin':
      return 'bg-red-100 text-red-700'
    case 'teacher':
      return 'bg-blue-100 text-blue-700'
    default:
      return 'bg-muted text-muted-foreground'
  }
})

async function logout() {
  await supabase.auth.signOut()
  clearProfile()
  router.push('/login')
}
</script>

<template>
  <DropdownMenu>
    <DropdownMenuTrigger as-child>
      <button
        class="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-muted/50 transition-colors focus:outline-none focus:ring-2 focus:ring-ring"
      >
        <Avatar class="h-8 w-8 rounded-lg">
          <AvatarFallback class="rounded-lg text-xs">{{ initials }}</AvatarFallback>
        </Avatar>
        <div class="hidden md:grid text-left text-sm leading-tight">
          <span class="truncate font-medium">{{ displayName }}</span>
          <span class="truncate text-xs text-muted-foreground">{{ displayEmail }}</span>
        </div>
        <ChevronsUpDown class="hidden md:block ml-1 size-4 text-muted-foreground" />
      </button>
    </DropdownMenuTrigger>
    <DropdownMenuContent class="w-64" align="end">
      <div class="px-3 py-2">
        <p class="truncate font-medium text-sm">{{ displayName }}</p>
        <p class="truncate text-xs text-muted-foreground">{{ displayEmail }}</p>
        <span
          :class="roleBadgeClass"
          class="mt-1.5 inline-block rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider"
        >
          {{ roleName }}
        </span>
      </div>
      <DropdownMenuSeparator />
      <DropdownMenuItem @click="logout">
        <LogOut class="mr-2 size-4" />
        Log out
      </DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
</template>
