<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import { useSupabaseClient, useSupabaseUser, navigateTo, useRouter, useRoute } from '#imports'
import { Loader2, Mail, Lock, Eye, EyeOff, GraduationCap } from '@lucide/vue'

const supabase = useSupabaseClient()
const user = useSupabaseUser()
const router = useRouter()
const route = useRoute()

// Automatically navigate once the user state is populated
watch(user, (currentUser) => {
  if (currentUser) {
    navigateTo('/authenticated/dashboard')
  }
}, { immediate: true })

onMounted(() => {
  if (route.query.code || route.query.token_hash || route.hash.includes('access_token=')) {
    router.push({
      path: '/auth/confirm',
      query: route.query,
      hash: route.hash
    })
  }
})

definePageMeta({
  layout: 'guest'
})

const email = ref('')
const password = ref('')
const showPassword = ref(false)
const isLoading = ref(false)
const isSignUp = ref(false)
const errorMessage = ref('')

async function handleAuth() {
  try {
    isLoading.value = true
    errorMessage.value = ''
    
    if (isSignUp.value) {
      const { error } = await supabase.auth.signUp({
        email: email.value,
        password: password.value,
      })
      if (error) throw error
      alert('Sign up successful! You can now log in.')
      isSignUp.value = false
      isLoading.value = false
    } else {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.value,
        password: password.value,
      })
      if (error) throw error
      if (user.value) {
        await navigateTo('/authenticated/dashboard')
      }
    }
  } catch (e: any) {
    errorMessage.value = e.message
    isLoading.value = false
  }
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center p-2">
    <Card class="w-full max-w-md sm:border border-gray-200">
      <CardHeader class="space-y-2 text-center">
        <div class="mx-auto flex size-12 items-centerxtext-primary mb-1">
          <GraduationCap class="size-12" />
        </div>
        <CardTitle class="text-2xl font-bold tracking-tight text-foreground">
          {{ isSignUp ? 'Create an account' : 'Welcome back' }}
        </CardTitle>
        <CardDescription>
          {{ isSignUp ? 'Enter your details to create your teacher account' : 'Sign in to access your DepEd Daily Lesson Logs' }}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form @submit.prevent="handleAuth" class="space-y-4">
          <!-- Email Field with Icon -->
          <div class="space-y-2">
            <Label for="email">Email address</Label>
            <div class="relative">
              <Mail class="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
              <Input
                id="email"
                type="email"
                v-model="email"
                required
                class="pl-9"
              />
            </div>
          </div>

          <!-- Password Field with Lock Icon and Eye Toggle -->
          <div class="space-y-2">
            <div class="flex items-center justify-between">
              <Label for="password">Password</Label>
            </div>
            <div class="relative">
              <Lock class="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
              <Input
                id="password"
                :type="showPassword ? 'text' : 'password'"
                v-model="password"
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

          <div v-if="errorMessage" class="p-2.5 text-xs text-destructive font-medium">
            {{ errorMessage }}
          </div>

          <Button class="w-full font-semibold shadow-sm" type="submit" :disabled="isLoading">
            <Loader2 v-if="isLoading" class="mr-2 h-4 w-4 animate-spin" />
            {{ isSignUp ? 'Create Account' : 'Sign In' }}
          </Button>
          </form>
      </CardContent>
    </Card>
  </div>
</template>
