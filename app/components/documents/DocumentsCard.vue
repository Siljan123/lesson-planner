<script setup lang="ts">
import { useAsyncData } from '#imports'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { FileText, Download } from '@lucide/vue'
import { Button } from '@/components/ui/button'

const { fetchDocuments, getDownloadUrl } = useDocuments()

const { data: files, pending } = useAsyncData('recent-documents', () => fetchDocuments(5) as Promise<any[]>, { lazy: true })

async function downloadFile(path: string) {
  try {
    const data = await getDownloadUrl(path)
    if (data?.signedUrl) {
      window.open(data.signedUrl, '_blank')
    } else {
      alert('Failed to generate download link')
    }
  } catch (error) {
    alert('Failed to generate download link')
  }
}
</script>

<template>
  <Card>
    <CardHeader>
      <CardTitle class="flex items-center gap-2">
        <FileText class="w-5 h-5" />
        Recently Generated Documents
      </CardTitle>
    </CardHeader>
    <CardContent>
      <div v-if="pending" class="text-sm text-muted-foreground">Loading...</div>
      <div v-else-if="!files || files.length === 0" class="text-sm text-muted-foreground py-4 text-center">
        No documents generated yet.
      </div>
      <div v-else class="space-y-4">
        <div v-for="file in files" :key="file.id" class="flex items-center justify-between border-b pb-3 last:border-0 last:pb-0">
          <div>
            <p class="font-medium text-sm">{{ file.lesson_plan?.title || 'Unknown Plan' }}</p>
            <p class="text-xs text-muted-foreground mt-1 uppercase">{{ file.format }} • {{ new Date(file.created_at).toLocaleDateString() }}</p>
          </div>
          <Button variant="ghost" size="icon" @click="downloadFile(file.storage_path)" title="Download">
            <Download class="w-4 h-4" />
          </Button>
        </div>
      </div>
    </CardContent>
  </Card>
</template>
