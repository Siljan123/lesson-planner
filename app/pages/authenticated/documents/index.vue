<script setup lang="ts">
import DocumentsTable from '@/components/documents/DocumentsTable.vue'
</script>

<template>
  <div class="space-y-6">
    <div>
      <h2 class="text-2xl font-semibold tracking-tight">Documents Library</h2>
      <p class="text-muted-foreground text-sm">View and download all your exported lesson plans and resources.</p>
    </div>

    <DocumentsTable />
  </div>
</template>