<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card'
import { Loader2, AlertCircle, CheckCircle } from '@lucide/vue'

definePageMeta({
  layout: 'guest',
})

const supabase = useSupabaseClient()
const router = useRouter()

const status = ref<'loading' | 'success' | 'error'>('loading')
const errorMessage = ref('')

onMounted(async () => {
  try {
    const route = useRoute()

    const code = (route.query.code as string) || ''
    const tokenHash = (route.query.token_hash as string) || ''
    const type = (route.query.type as string) || ''

    // 1. PKCE code exchange
    if (code) {
      const { error } = await supabase.auth.exchangeCodeForSession(code)
      if (error) throw error
    }
    // 2. Token hash (OTP / invite verify)
    else if (tokenHash && type) {
      const { error } = await supabase.auth.verifyOtp({
        token_hash: tokenHash,
        type: type as any,
      })
      if (error) throw error
    }

    // 3. Wait for session to settle (handles hash fragment access_token if present)
    let session = (await supabase.auth.getSession()).data.session
    let retries = 0
    while (!session && retries < 10) {
      await new Promise((resolve) => setTimeout(resolve, 500))
      session = (await supabase.auth.getSession()).data.session
      retries++
    }

    if (!session) {
      const errorMsg = route.hash.includes('error_description') 
        ? decodeURIComponent(route.hash.split('error_description=')[1]?.split('&')[0] || 'Unknown error')
        : 'The invite link may have expired or is invalid.'
      throw new Error('Unable to verify your account. ' + errorMsg)
    }

    status.value = 'success'

    // 4. Check profile completion via session metadata
    let isComplete = session.user.user_metadata?.profile_completed === true

    await new Promise((resolve) => setTimeout(resolve, 600))

    // 5. Redirect based on profile status
    if (!isComplete) {
      router.push('/auth/complete-profile')
    } else {
      router.push('/authenticated/dashboard')
    }
  } catch (e: any) {
    status.value = 'error'
    errorMessage.value = e.message || 'An unexpected error occurred while verifying the invitation link.'
  }
})
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-muted/20 p-4">
    <Card class="w-full max-w-md">
      <CardHeader class="text-center space-y-2">
        <div class="mx-auto">
          <Loader2 v-if="status === 'loading'" class="h-10 w-10 animate-spin text-primary" />
          <CheckCircle v-else-if="status === 'success'" class="h-10 w-10 text-green-500" />
          <AlertCircle v-else class="h-10 w-10 text-destructive" />
        </div>
        <CardTitle class="text-xl font-bold tracking-tight">
          {{ status === 'loading' ? 'Verifying your invitation...' : status === 'success' ? 'Invitation verified!' : 'Verification failed' }}
        </CardTitle>
        <CardDescription>
          <template v-if="status === 'loading'">
            Please wait while we verify your invite link and set up your session.
          </template>
          <template v-else-if="status === 'success'">
            Redirecting you to complete your profile setup...
          </template>
          <template v-else>
            {{ errorMessage }}
          </template>
        </CardDescription>
      </CardHeader>
      <CardContent v-if="status === 'error'" class="text-center">
        <NuxtLink to="/login" class="text-primary hover:underline text-sm font-medium">
          Return to login
        </NuxtLink>
      </CardContent>
    </Card>
  </div>
</template>
