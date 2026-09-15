<script setup lang="ts">
import { GraduationCap, Heart, ShieldCheck, FileText, Sparkles } from '@lucide/vue'
</script>

<template>
  <footer id="compliance" class="border-t bg-card text-card-foreground">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16 space-y-12">
      <div class="pt-6 border-t flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
        <p class="flex items-center gap-1">
          <span>&copy; 2026 Lesson Plan AI</span>
        </p>
        <div class="flex items-center gap-6">
          <NuxtLink to="/login" class="hover:text-foreground transition-colors">Privacy</NuxtLink>
          <NuxtLink to="/login" class="hover:text-foreground transition-colors">Terms of Service</NuxtLink>
        </div>
      </div>
    </div>
  </footer>
</template>
