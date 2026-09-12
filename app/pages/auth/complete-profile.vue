<script setup lang="ts">
import { ref } from 'vue'
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2, UserCheck, User, Lock, Eye, EyeOff, ShieldCheck } from '@lucide/vue'

definePageMeta({
  layout: 'guest',
})

const router = useRouter()

const fullName = ref('')
const password = ref('')
const confirmPassword = ref('')
const showPassword = ref(false)
const showConfirmPassword = ref(false)
const isLoading = ref(false)
const errorMessage = ref('')

async function handleSubmit() {
  try {
    isLoading.value = true
    errorMessage.value = ''

    // Client-side validation
    if (!fullName.value.trim()) {
      throw new Error('Full name is required')
    }
    if (password.value.length < 6) {
      throw new Error('Password must be at least 6 characters')
    }
    if (password.value !== confirmPassword.value) {
      throw new Error('Passwords do not match')
    }

    // Complete profile via server API (handles both password + profile update)
    await $fetch('/api/auth/complete-profile', {
      method: 'POST',
      body: {
        full_name: fullName.value.trim(),
        password: password.value,
      },
    })

    // Refresh client profile cache so header immediately shows name and role
    const { loadProfile } = useProfile()
    await loadProfile()

    // Refresh the user session so useSupabaseUser() gets the updated user_metadata
    const supabase = useSupabaseClient()
    await supabase.auth.refreshSession()

    // Force a hard page reload to guarantee the Nuxt server and middleware read the new cookie
    window.location.href = '/authenticated/dashboard'
  } catch (e: any) {
    errorMessage.value = e.data?.message || e.message || 'An unexpected error occurred'
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-muted/20 p-4">
    <Card class="w-full max-w-md sm:border">
      <CardHeader class="space-y-2 text-center">
        <div class="mx-auto flex size-12 items-center justify-center text-primary mb-1">
          <UserCheck class="size-12" />
        </div>
        <CardTitle class="text-2xl font-bold tracking-tight text-foreground">
          Complete Your Account
        </CardTitle>
        <CardDescription>
          Set up your teacher profile details and a secure password to get started.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form @submit.prevent="handleSubmit" class="space-y-4">
          <!-- Full Name Field with Icon -->
          <div class="space-y-2">
            <Label for="fullName">Full Name</Label>
            <div class="relative">
              <User class="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
              <Input
                id="fullName"
                v-model="fullName"
                placeholder="Juan Dela Cruz"
                required
                class="pl-9"
              />
            </div>
          </div>

          <!-- New Password Field with Lock Icon and Eye Toggle -->
          <div class="space-y-2">
            <Label for="password">New Password</Label>
            <div class="relative">
              <Lock class="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
              <Input
                id="password"
                :type="showPassword ? 'text' : 'password'"
                v-model="password"
                placeholder="Minimum 6 characters"
                required
                class="pl-9 pr-10"
              />
              <button
                type="button"
                @click="showPassword = !showPassword"
                class="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground focus:outline-none transition-colors"
                :title="showPassword ? 'Hide password' : 'Show password'"
                tabindex="-1"
              >
                <EyeOff v-if="showPassword" class="size-4" />
                <Eye v-else class="size-4" />
              </button>
            </div>
          </div>

          <!-- Confirm Password Field with Shield Check Icon and Eye Toggle -->
          <div class="space-y-2">
            <Label for="confirmPassword">Confirm Password</Label>
            <div class="relative">
              <ShieldCheck class="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
              <Input
                id="confirmPassword"
                :type="showConfirmPassword ? 'text' : 'password'"
                v-model="confirmPassword"
                placeholder="Re-enter your password"
                required
                class="pl-9 pr-10"
              />
              <button
                type="button"
                @click="showConfirmPassword = !showConfirmPassword"
                class="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground focus:outline-none transition-colors"
                :title="showConfirmPassword ? 'Hide password' : 'Show password'"
                tabindex="-1"
              >
                <EyeOff v-if="showConfirmPassword" class="size-4" />
                <Eye v-else class="size-4" />
              </button>
            </div>
          </div>

          <div v-if="errorMessage" class="p-2.5 text-xs text-destructive font-medium">
            {{ errorMessage }}
          </div>

          <Button class="w-full font-semibold shadow-" type="submit" :disabled="isLoading">
            <Loader2 v-if="isLoading" class="mr-2 h-4 w-4 animate-spin" />
            Complete Setup
          </Button>
        </form>
      </CardContent>
    </Card>
  </div>
</template>
