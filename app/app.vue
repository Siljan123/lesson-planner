<script setup lang="ts">
import { Toaster } from 'vue-sonner'
import 'vue-sonner/style.css'
</script>

<template>
  <div class="min-h-screen bg-background text-foreground font-sans">
    <ClientOnly>
      <Toaster position="top-right" :duration="4000" rich-colors close-button />
    </ClientOnly>
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </div>
</template>
