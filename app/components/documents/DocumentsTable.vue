<script setup lang="ts">
import { useAsyncData } from '#imports'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Download, FileText } from '@lucide/vue'

const { fetchDocuments, getDownloadUrl } = useDocuments()

const { data: files, pending } = useAsyncData('all-documents', () => fetchDocuments() as Promise<any[]>, { lazy: true })

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
  <div class="border rounded-md bg-card">
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>File Name</TableHead>
          <TableHead>Lesson Plan</TableHead>
          <TableHead>Subject & Grade</TableHead>
          <TableHead>Format</TableHead>
          <TableHead>Generated On</TableHead>
          <TableHead class="text-right">Action</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableRow v-if="pending">
          <TableCell colspan="6" class="text-center py-8 text-muted-foreground">Loading documents...</TableCell>
        </TableRow>
        <TableRow v-else-if="!files || files.length === 0">
          <TableCell colspan="6" class="text-center py-12 text-muted-foreground">
            <div class="flex flex-col items-center gap-2">
              <FileText class="w-8 h-8 opacity-50 mb-2" />
              <p>No documents found.</p>
              <p class="text-xs">Export a lesson plan to see generated files here.</p>
            </div>
          </TableCell>
        </TableRow>
        <TableRow v-for="file in files" :key="file.id" v-else>
          <TableCell class="font-medium">
            <div class="flex items-center gap-2">
              <FileText class="w-4 h-4 text-muted-foreground" />
              {{ file.lesson_plan?.title || 'Unknown' }} Export
            </div>
          </TableCell>
          <TableCell>{{ file.lesson_plan?.title }}</TableCell>
          <TableCell>
            <span v-if="file.lesson_plan?.subject && file.lesson_plan?.grade">
              {{ file.lesson_plan?.subject?.name }} - {{ file.lesson_plan?.grade?.label }}
            </span>
            <span v-else class="text-muted-foreground italic">N/A</span>
          </TableCell>
          <TableCell class="uppercase font-semibold text-xs">{{ file.format }}</TableCell>
          <TableCell>{{ new Date(file.created_at).toLocaleString() }}</TableCell>
          <TableCell class="text-right">
            <Button variant="ghost" size="sm" @click="downloadFile(file.storage_path)">
              <Download class="w-4 h-4 mr-2" />
              Download
            </Button>
          </TableCell>
        </TableRow>
      </TableBody>
    </Table>
  </div>
</template>
