<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  ArrowLeft,
  Save,
  Download,
  Printer,
  Trash2,
  Loader2,
  BookOpen,
  CheckCircle2,
  Sparkles,
  Eye,
  Edit3
} from '@lucide/vue'
import type { Worksheet } from '~/types/worksheet'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import WorksheetView from '@/components/worksheet/WorksheetView.vue'

const route = useRoute()
const router = useRouter()
const { fetchById, updateWorksheet, deleteWorksheet, downloadExport } = useWorksheets()

const worksheetId = computed(() => route.params.id as string)
const isSaving = ref(false)
const isDeleting = ref(false)
const saveSuccess = ref(false)

const { data, refresh, pending } = useAsyncData(`worksheet-${worksheetId.value}`, async () => {
  const res = await fetchById(worksheetId.value)
  return res.worksheet
}, { lazy: true })

const worksheet = computed<Worksheet | null>(() => (data.value as Worksheet) || null)

// Local editable copy
const editableTitle = ref('')
const editableStatus = ref('draft')
const activeTab = ref('preview')

import { ref, computed, onErrorCaptured } from 'vue'

const vueError = ref<string | null>(null)
onErrorCaptured((err, instance, info) => {
  vueError.value = `${err.toString()}\n\nInfo: ${info}\n\nStack:\n${(err as Error).stack}`
  return false
})

watch(worksheet, (ws) => {
  if (ws) {
    editableTitle.value = ws.title || ''
    editableStatus.value = ws.status || 'draft'
  }
}, { immediate: true })

async function handleSave() {
  if (!worksheet.value) return
  isSaving.value = true
  saveSuccess.value = false

  try {
    await updateWorksheet(worksheet.value.id, {
      title: editableTitle.value,
      status: editableStatus.value,
      content: worksheet.value.content
    })
    saveSuccess.value = true
    setTimeout(() => {
      saveSuccess.value = false
    }, 3000)
    await refresh()
  } catch (err) {
    console.error('Save failed:', err)
    alert('Failed to save worksheet changes')
  } finally {
    isSaving.value = false
  }
}

async function handleDelete() {
  if (!worksheet.value) return
  if (!confirm(`Are you sure you want to delete "${worksheet.value.title}"? This cannot be undone.`)) return

  isDeleting.value = true
  try {
    await deleteWorksheet(worksheet.value.id)
    router.push('/authenticated/worksheets')
  } catch (err) {
    console.error('Delete failed:', err)
    alert('Failed to delete worksheet')
    isDeleting.value = false
  }
}

function handlePrint() {
  window.print()
}

function handleDownload() {
  if (!worksheet.value) return
  downloadExport(worksheet.value.id, editableTitle.value || worksheet.value.title, true)
}
</script>

<template>
  <div class="space-y-6 max-w-5xl mx-auto py-6">
    <!-- Top Action Bar (hidden in print) -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden border-b pb-4">
      <div class="flex items-center gap-3">
        <Button variant="ghost" size="icon" as-child class="cursor-pointer">
          <NuxtLink to="/authenticated/worksheets">
            <ArrowLeft class="h-4 w-4" />
          </NuxtLink>
        </Button>
        <div>
          <div class="flex items-center gap-2">
            <h1 class="text-xl font-bold tracking-tight text-foreground truncate max-w-md sm:max-w-lg">
              {{ editableTitle || 'Worksheet' }}
            </h1>
            <Badge variant="outline" class="text-xs shrink-0 capitalize">
              {{ editableStatus }}
            </Badge>
          </div>
          <p class="text-xs text-muted-foreground mt-0.5">
            {{ worksheet?.subject?.name }} • {{ worksheet?.grade?.label }} • {{ worksheet?.medium_of_instruction || 'English' }}
          </p>
        </div>
      </div>

      <div class="flex flex-wrap items-center gap-2 sm:justify-end">
        <!-- Status Select -->
        <Select v-model="editableStatus" @update:model-value="handleSave">
          <SelectTrigger class="h-8 w-32 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="ready">Ready</SelectItem>
            <SelectItem value="exported">Exported</SelectItem>
          </SelectContent>
        </Select>

        <!-- Print -->
        <Button variant="outline" size="sm" class="h-8 gap-1.5 text-xs cursor-pointer" @click="handlePrint">
          <Printer class="h-3.5 w-3.5" />
          <span>Print</span>
        </Button>

        <!-- Download DOCX -->
        <Button variant="outline" size="sm" class="h-8 gap-1.5 text-xs cursor-pointer" @click="handleDownload">
          <Download class="h-3.5 w-3.5" />
          <span>DOCX</span>
        </Button>

        <!-- Save -->
        <Button size="sm" class="h-8 gap-1.5 text-xs cursor-pointer" :disabled="isSaving" @click="handleSave">
          <Loader2 v-if="isSaving" class="h-3.5 w-3.5 animate-spin" />
          <CheckCircle2 v-else-if="saveSuccess" class="h-3.5 w-3.5 text-emerald-400" />
          <Save v-else class="h-3.5 w-3.5" />
          <span>{{ saveSuccess ? 'Saved' : 'Save' }}</span>
        </Button>

        <!-- Delete -->
        <Button
          variant="ghost"
          size="icon"
          class="h-8 w-8 text-destructive hover:bg-destructive/10 cursor-pointer"
          :disabled="isDeleting"
          @click="handleDelete"
        >
          <Loader2 v-if="isDeleting" class="h-3.5 w-3.5 animate-spin" />
          <Trash2 v-else class="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="pending" class="py-20 text-center space-y-3">
      <Loader2 class="h-8 w-8 animate-spin text-primary mx-auto" />
      <p class="text-sm text-muted-foreground">Loading worksheet...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="vueError" class="py-10 text-center space-y-4">
      <div class="text-destructive font-bold text-xl">Vue Rendering Error</div>
      <pre class="bg-red-50 text-red-900 p-4 rounded text-left overflow-auto max-w-full text-xs">{{ vueError }}</pre>
    </div>

    <!-- Worksheet Content -->
    <div v-else-if="worksheet" class="space-y-6">
      <Tabs v-model="activeTab" class="w-full">
        <TabsList class="print:hidden">
          <TabsTrigger value="preview" class="gap-1.5 text-xs">
            <Eye class="h-3.5 w-3.5" />
            <span>Student Worksheet</span>
          </TabsTrigger>
          <TabsTrigger value="edit" class="gap-1.5 text-xs">
            <Edit3 class="h-3.5 w-3.5" />
            <span>Edit Questions</span>
          </TabsTrigger>
        </TabsList>

        <!-- Tab 1: Formatted Student Worksheet -->
        <TabsContent value="preview" class="pt-4">
          <WorksheetView :worksheet="worksheet" :show-answer-key-initial="false" />
        </TabsContent>

        <!-- Tab 2: Edit Questions & Details -->
        <TabsContent value="edit" class="pt-4 space-y-6 print:hidden">
          <!-- General Details -->
          <div class="border rounded-lg p-5 bg-card space-y-4">
            <h3 class="text-sm font-semibold text-foreground">Worksheet Header Details</h3>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div class="space-y-1.5">
                <Label for="title-input">Title</Label>
                <Input id="title-input" v-model="editableTitle" />
              </div>
              <div class="space-y-1.5">
                <Label for="topic-input">Topic</Label>
                <Input id="topic-input" v-model="worksheet.topic" />
              </div>
            </div>
            <div class="space-y-1.5">
              <Label for="instructions-input">General Instructions</Label>
              <Textarea
                id="instructions-input"
                v-model="worksheet.content.instructions"
                rows="2"
              />
            </div>
          </div>

          <!-- Section Items Editor -->
          <div
            v-for="(section, sIdx) in worksheet.content.sections"
            :key="section.id || sIdx"
            class="border rounded-lg p-5 bg-card space-y-4"
          >
            <div class="flex items-center justify-between border-b pb-3">
              <div class="space-y-1 grow mr-4">
                <Input v-model="section.title" class="font-semibold text-base h-8" />
                <Input v-model="section.instructions" class="text-xs text-muted-foreground h-7" placeholder="Section instructions..." />
              </div>
              <Badge variant="outline">{{ section.items.length }} items</Badge>
            </div>

            <div class="space-y-4 pt-2">
              <div
                v-for="(item, iIdx) in section.items"
                :key="item.id || iIdx"
                class="p-4 rounded-lg border bg-muted/20 space-y-3"
              >
                <div class="flex items-start gap-2">
                  <span class="font-bold text-sm text-primary pt-2">#{{ item.item_number || iIdx + 1 }}</span>
                  <div class="grow space-y-2">
                    <Textarea v-model="item.question" rows="2" class="text-sm" />
                    <div class="flex items-center gap-3">
                      <div class="flex items-center gap-1.5">
                        <Label class="text-xs text-muted-foreground">Points:</Label>
                        <Input v-model.number="item.points" type="number" class="w-16 h-7 text-xs" />
                      </div>
                      <div class="flex items-center gap-1.5 grow">
                        <Label class="text-xs text-muted-foreground whitespace-nowrap">Correct Answer:</Label>
                        <Input v-model="item.correct_answer" class="h-7 text-xs grow" />
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Editable Choices if Multiple Choice -->
                <div v-if="item.type === 'multiple_choice' && item.options" class="pl-6 space-y-1.5">
                  <Label class="text-[11px] text-muted-foreground uppercase">Options</Label>
                  <div v-for="(opt, optIdx) in item.options" :key="optIdx" class="flex items-center gap-2">
                    <Input v-model="item.options[optIdx]" class="h-7 text-xs" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="flex justify-end">
            <Button class="gap-2 cursor-pointer" :disabled="isSaving" @click="handleSave">
              <Save class="h-4 w-4" />
              <span>Save All Changes</span>
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  </div>
</template>
