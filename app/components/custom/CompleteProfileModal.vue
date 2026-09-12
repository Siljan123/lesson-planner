<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2, User, Lock, Eye, EyeOff, ShieldCheck } from '@lucide/vue'

const user = useSupabaseUser()
const { profile, loadProfile } = useProfile()

const hasPassword = computed(() => user.value?.amr?.some((a: any) => a.method === 'password'))
const isProfileCompleted = computed(() => user.value?.user_metadata?.profile_completed === true)

// Open if they are logged in, haven't completed profile, and don't have a password
const isOpen = computed(() => !!user.value && !isProfileCompleted.value && !hasPassword.value)

const fullName = ref(profile.value?.full_name || '')
const password = ref('')
const confirmPassword = ref('')
const showPassword = ref(false)
const showConfirmPassword = ref(false)
const isLoading = ref(false)
const errorMessage = ref('')

// Watch profile load to pre-fill name
watch(profile, (p) => {
  if (p?.full_name && !fullName.value) {
    fullName.value = p.full_name
  }
})

async function handleSubmit() {
  try {
    isLoading.value = true
    errorMessage.value = ''

    if (!fullName.value.trim()) throw new Error('Full name is required')
    if (password.value.length < 6) throw new Error('Password must be at least 6 characters')
    if (password.value !== confirmPassword.value) throw new Error('Passwords do not match')

    await $fetch('/api/auth/complete-profile', {
      method: 'POST',
      body: {
        full_name: fullName.value.trim(),
        password: password.value,
      },
    })

    await loadProfile()
    const supabase = useSupabaseClient()
    await supabase.auth.refreshSession()
    
    // Force a reload to ensure all layout/middleware state is completely fresh
    window.location.reload()
  } catch (e: any) {
    errorMessage.value = e.data?.message || e.message || 'An unexpected error occurred'
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <Dialog :open="isOpen" @update:open="() => {}">
    <!-- Prevent closing by clicking outside or pressing Escape -->
    <DialogContent class="sm:max-w-[425px]" @interact-outside="(e) => e.preventDefault()" @escape-key-down="(e) => e.preventDefault()">
      <DialogHeader>
        <DialogTitle class="text-2xl font-bold">Complete Your Account</DialogTitle>
        <DialogDescription>
          Set up your teacher profile details and a secure password to get started.
        </DialogDescription>
      </DialogHeader>
      
      <form @submit.prevent="handleSubmit" class="space-y-4 pt-4">
        <!-- Form Fields -->
        <div class="space-y-2">
          <Label for="modal-fullName">Full Name</Label>
          <div class="relative">
            <User class="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
            <Input id="modal-fullName" v-model="fullName" required class="pl-9" />
          </div>
        </div>

        <div class="space-y-2">
          <Label for="modal-password">New Password</Label>
          <div class="relative">
            <Lock class="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
            <Input id="modal-password" :type="showPassword ? 'text' : 'password'" v-model="password" required class="pl-9 pr-10" />
            <button type="button" @click="showPassword = !showPassword" class="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
              <EyeOff v-if="showPassword" class="size-4" />
              <Eye v-else class="size-4" />
            </button>
          </div>
        </div>

        <div class="space-y-2">
          <Label for="modal-confirmPassword">Confirm Password</Label>
          <div class="relative">
            <ShieldCheck class="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
            <Input id="modal-confirmPassword" :type="showConfirmPassword ? 'text' : 'password'" v-model="confirmPassword" required class="pl-9 pr-10" />
            <button type="button" @click="showConfirmPassword = !showConfirmPassword" class="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
              <EyeOff v-if="showConfirmPassword" class="size-4" />
              <Eye v-else class="size-4" />
            </button>
          </div>
        </div>

        <div v-if="errorMessage" class="p-2 text-xs text-destructive font-medium bg-destructive/10 rounded-md">
          {{ errorMessage }}
        </div>

        <Button class="w-full font-semibold" type="submit" :disabled="isLoading">
          <Loader2 v-if="isLoading" class="mr-2 h-4 w-4 animate-spin" />
          Complete Setup
        </Button>
      </form>
    </DialogContent>
  </Dialog>
</template>
