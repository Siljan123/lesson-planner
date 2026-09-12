<script setup lang="ts">
import { Button } from '@/components/ui/button'
import { onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'

definePageMeta({
  layout:'guest'
})

const router = useRouter()
const route = useRoute()

onMounted(() => {
  // If the user lands here with auth tokens (e.g. from an invite link fallback),
  // immediately redirect them to the confirm page to process the tokens.
  if (route.query.code || route.query.token_hash || route.hash.includes('access_token=')) {
    router.push({
      path: '/auth/confirm',
      query: route.query,
      hash: route.hash
    })
  }
})
</script>

<template>
  <div class="min-h-[80vh] flex flex-col items-center justify-center text-center px-4 space-y-6">
    <h1 class="text-4xl sm:text-6xl font-bold tracking-tight text-foreground max-w-3xl">
      The smart way to build your <span class="text-primary">Daily Lesson Logs</span>
    </h1>
    <p class="text-xl text-muted-foreground max-w-2xl">
      Automate your workflow. Generate, edit, and export lesson plans using AI in seconds.
    </p>
    <div class="flex mx-auto pt-4">
      <Button size="lg" as-child>
        <NuxtLink to="/login">Get Started</NuxtLink>
      </Button>
    </div>
  </div>
</template>