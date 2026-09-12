<script setup lang="ts">
import { Button } from '@/components/ui/button'
definePageMeta({
  layout:'guest'
})
</script>

<template>
  <div class="min-h-[80vh] flex flex-col items-center justify-center text-center px-4 space-y-6">
    <div class="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-primary text-primary-foreground hover:bg-primary/80">
      DepEd MATATAG Ready
    </div>
    <h1 class="text-4xl sm:text-6xl font-bold tracking-tight text-foreground max-w-3xl">
      The smart way to build <span class="text-primary">ILAW Lesson Plans</span>
    </h1>
    <p class="text-xl text-muted-foreground max-w-2xl">
      Automate your workflow. Generate, edit, and export compliant DepEd lesson plans using AI in seconds.
    </p>
    <div class="flex gap-4 pt-4">
      <Button size="lg" as-child>
        <NuxtLink to="/login">Get Started</NuxtLink>
      </Button>
      <Button size="lg" variant="outline" as-child>
        <NuxtLink to="/authenticated/dashboard">Go to Dashboard</NuxtLink>
      </Button>
    </div>
  </div>
</template>