<script setup lang="ts">
import { useRouter } from 'vue-router'
import type { Worksheet } from '~/types/worksheet'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetFooter, SheetClose } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Download, ExternalLink, BookOpen } from '@lucide/vue'
import WorksheetView from '@/components/worksheet/WorksheetView.vue'

const props = defineProps<{
  open: boolean
  worksheet: Worksheet | null
}>()

const emit = defineEmits(['update:open'])
const router = useRouter()
const { downloadExport } = useWorksheets()

function openFullPage() {
  if (!props.worksheet?.id) return
  emit('update:open', false)
  router.push(`/authenticated/worksheets/${props.worksheet.id}`)
}

function handleDownload() {
  if (!props.worksheet?.id) return
  downloadExport(props.worksheet.id, props.worksheet.title, true)
}
</script>

<template>
  <Sheet :open="open" @update:open="(val) => emit('update:open', val)">
    <SheetContent side="right" class="w-full sm:max-w-3xl flex flex-col p-0 overflow-hidden">
      <SheetHeader class="p-6 pb-4 border-b">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2">
            <div class="h-8 w-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <BookOpen class="h-4 w-4" />
            </div>
            <div>
              <SheetTitle class="text-base font-semibold truncate max-w-md">
                {{ worksheet?.title || 'Worksheet Preview' }}
              </SheetTitle>
              <SheetDescription class="text-xs">
                {{ worksheet?.subject?.name }} • {{ worksheet?.grade?.label }}
              </SheetDescription>
            </div>
          </div>
          <div class="flex items-center gap-2 mr-6">
            <Button variant="outline" size="sm" class="h-8 gap-1 text-xs" @click="handleDownload">
              <Download class="h-3.5 w-3.5" />
              <span>DOCX</span>
            </Button>
            <Button size="sm" class="h-8 gap-1 text-xs" @click="openFullPage">
              <ExternalLink class="h-3.5 w-3.5" />
              <span>Open</span>
            </Button>
          </div>
        </div>
      </SheetHeader>

      <div class="flex-1 overflow-y-auto p-6">
        <WorksheetView v-if="worksheet" :worksheet="worksheet" />
      </div>

      <SheetFooter class="p-4 border-t bg-muted/20 flex items-center justify-between sm:justify-between">
        <span class="text-xs text-muted-foreground">
          Created on {{ worksheet?.created_at ? new Date(worksheet.created_at).toLocaleDateString() : '' }}
        </span>
        <SheetClose as-child>
          <Button variant="outline" size="sm">Close</Button>
        </SheetClose>
      </SheetFooter>
    </SheetContent>
  </Sheet>
</template>
