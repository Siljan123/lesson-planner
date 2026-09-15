<script setup lang="ts">
import AppSidebar from '@/components/custom/AppSidebar.vue'
import UserProfileDropdown from '@/components/custom/UserProfileDropdown.vue'
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar'
import { Separator } from '@/components/ui/separator'
</script>

<template>
  <SidebarProvider>
    <AppSidebar />
    <SidebarInset>
      <header class="flex h-16 sticky z-10 top-0 shrink-0 items-center justify-between border-b bg-card px-2">
        <div class="flex items-center gap-2">
          <SidebarTrigger class="-ml-1" />
          <Separator orientation="vertical" class="h-6" />
        </div>
        <UserProfileDropdown />
      </header>
      <main class="flex-1 min-w-0 bg-muted/20 p-4 md:p-8">
        <slot />
      </main>
    </SidebarInset>
  </SidebarProvider>
</template>