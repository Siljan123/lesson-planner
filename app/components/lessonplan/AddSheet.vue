<script setup lang="ts">
import { ref, computed, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAsyncData } from '#imports'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem, SelectSeparator } from '@/components/ui/select'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger, SheetFooter, SheetClose } from '@/components/ui/sheet'
import { CheckCircle2, Loader2, Plus, PlusCircle, Sparkles, X, AlertCircle } from '@lucide/vue'
import GeneratingPreview from '@/components/lessonplan/GeneratingPreview.vue'

const router = useRouter()

const { fetchSubjects, createSubject, fetchGrades, fetchPositions } = useReferenceData()
const { generatePlan } = useLessonPlans()
const { fetchUsage } = useUsage()

const { data: subjects, refresh: refreshSubjects } = useAsyncData('subjects-add', async () => {
  return await fetchSubjects() as any[]
}, { lazy: true })

const isCreatingSubject = ref(false)
const isSavingSubject = ref(false)
const isCodeManuallyEdited = ref(false)
const newSubjectName = ref('')
const newSubjectCode = ref('')
const customSubjectError = ref('')

function onSubjectNameInput() {
  customSubjectError.value = ''
  if (!isCodeManuallyEdited.value) {
    const name = newSubjectName.value.trim()
    if (!name) {
      newSubjectCode.value = ''
      return
    }
    const words = name.split(/\s+/).filter(Boolean)
    if (words.length > 1) {
      newSubjectCode.value = words.map(w => w[0]).join('').toUpperCase()
    } else {
      newSubjectCode.value = name.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 8)
    }
  }
}

function onSubjectCodeInput() {
  isCodeManuallyEdited.value = true
}

function openCreateSubject() {
  isCreatingSubject.value = true
  isCodeManuallyEdited.value = false
  newSubjectName.value = ''
  newSubjectCode.value = ''
  customSubjectError.value = ''
}

function cancelCreateSubject() {
  isCreatingSubject.value = false
  newSubjectName.value = ''
  newSubjectCode.value = ''
  customSubjectError.value = ''
}

function onSubjectChange(val: unknown) {
  if (val === '__new_custom__') {
    form.value.subject_id = ''
    openCreateSubject()
    return
  }
  suggestMedium(val)
}

async function handleCreateSubject() {
  const name = newSubjectName.value.trim()
  if (!name) {
    customSubjectError.value = 'Please enter a subject name.'
    return
  }
  try {
    isSavingSubject.value = true
    customSubjectError.value = ''
    const result = await createSubject({
      name,
      code: newSubjectCode.value.trim() || undefined
    })

    if (subjects.value && !subjects.value.some((s: any) => s.id === result.id)) {
      subjects.value.push(result)
    }
    await refreshSubjects()

    form.value.subject_id = result.id
    suggestMedium(result.id)
    isCreatingSubject.value = false
  } catch (err: any) {
    console.error('Failed to create custom subject', err)
    customSubjectError.value = err?.data?.statusMessage || err?.message || 'Failed to create subject'
  } finally {
    isSavingSubject.value = false
  }
}

const { data: grades } = useAsyncData('grades-add', async () => {
  return await fetchGrades() as any[]
}, { lazy: true })

const { data: positions } = useAsyncData('positions-add', async () => {
  return await fetchPositions() as any[]
}, { lazy: true })

const { data: usage, refresh: refreshUsage } = useAsyncData('usage-add', async () => {
  return await fetchUsage() as any
}, { lazy: true })

const isOpen = ref(false)
const isGenerating = ref(false)
const generationStep = ref(1)
const generationProgress = ref(15)
let stepTimer: any = null

const form = ref({
  title: '',
  subject_id: '',
  grade_level_id: '',
  term: 'term_1',
  medium_of_instruction: 'Filipino',
  matatag_competency_code: '',
  topic: '',
  content_standard: '',
  performance_standard: '',
  session_duration: 'Day 1',
  school_name: '',
  prepared_by_name: '',
  prepared_by_position_id: '',
  checked_by_name: '',
  checked_by_position_id: '',
  checked_by_2_name: '',
  checked_by_2_position_id: ''
})

const sessionOption = ref('Day 1')
const customSessionDuration = ref('')

const resolvedSessionDuration = computed(() => {
  if (sessionOption.value === 'custom') {
    return customSessionDuration.value.trim() || 'Day 1'
  }
  return sessionOption.value
})

const selectedSubjectName = computed(() => {
  const match = subjects.value?.find((s: any) => s.id === form.value.subject_id)
  return match?.name || 'Subject Area'
})

const selectedGradeLabel = computed(() => {
  const match = grades.value?.find((g: any) => g.id === form.value.grade_level_id)
  return match?.label || 'Grade Level'
})

const parsedDays = computed(() => {
  const dur = resolvedSessionDuration.value || 'Day 1'
  const items = dur.split(',').map(s => s.trim()).filter(Boolean)
  return items.length > 0 ? items : ['Day 1']
})

const emit = defineEmits(['created'])

function suggestMedium(subjectId: unknown) {
  const normalizedSubjectId = String(subjectId ?? '')
  const subject = subjects.value?.find((item: any) => item.id === normalizedSubjectId)?.name?.toLowerCase() || ''
  form.value.medium_of_instruction = ['english', 'mathematics', 'science', 'tle'].some((name) => subject.includes(name))
    ? 'English'
    : 'Filipino'
}

// Calculate hours until reset
const hoursUntilReset = computed(() => {
  if (!usage.value?.resetTime) return 0
  const reset = new Date(usage.value.resetTime)
  const now = new Date()
  const diffHours = Math.max(0, (reset.getTime() - now.getTime()) / (1000 * 60 * 60))
  return Math.ceil(diffHours)
})

function startProgressSimulation() {
  generationStep.value = 1
  generationProgress.value = 18

  stepTimer = setInterval(() => {
    if (generationProgress.value < 92) {
      generationProgress.value += Math.floor(Math.random() * 8) + 4
      if (generationProgress.value >= 30 && generationStep.value < 2) generationStep.value = 2
      if (generationProgress.value >= 55 && generationStep.value < 3) generationStep.value = 3
      if (generationProgress.value >= 75 && generationStep.value < 4) generationStep.value = 4
      if (generationProgress.value >= 90 && generationStep.value < 5) generationStep.value = 5
    }
  }, 1800)
}

function stopProgressSimulation() {
  if (stepTimer) {
    clearInterval(stepTimer)
    stepTimer = null
  }
}

onUnmounted(() => {
  stopProgressSimulation()
})

async function onSubmit() {
  if (usage.value?.isLimitReached) return
  
  try {
    isGenerating.value = true
    startProgressSimulation()

    const payload = {
      ...form.value,
      session_duration: resolvedSessionDuration.value
    }
    const response = await generatePlan(payload)
    
    if (response && response.id) {
      generationProgress.value = 100
      generationStep.value = 5
      await new Promise(r => setTimeout(r, 600))

      isOpen.value = false
      emit('created', response.id)
      await refreshUsage()
      router.push(`/authenticated/generated-lesson-plan/${response.id}`)
    }
  } catch (error: any) {
    console.error('Failed to generate lesson plan', error)
    const msg = error?.data?.message || error?.message || 'Unknown error'
    alert('Failed to generate lesson plan: ' + msg)
  } finally {
    stopProgressSimulation()
    isGenerating.value = false
  }
}
</script>

<template>
  <Sheet v-model:open="isOpen">
    <SheetTrigger as-child>
      <Button variant="outline" size="sm" class="h-8 gap-1.5 text-[13px] text-gray-600 border-gray-200 hover:bg-gray-50 font-normal">
        <Plus class="size-4" />
        <span>New</span>
      </Button>
    </SheetTrigger>
    <SheetContent class="sm:max-w-4xl overflow-y-auto p-8">
      <div class="flex items-center gap-2 border-b py-4">
        <PlusCircle class="size-7 text-primary" /> <h1 class="text-sm font-semibold font-mono">Daily Log Lesson</h1> 
      </div>
      <!-- GENERATION PREVIEW & PROCESS COMPONENT -->
      <GeneratingPreview
        v-if="isGenerating"
        :form="form"
        :selected-subject-name="selectedSubjectName"
        :selected-grade-label="selectedGradeLabel"
        :resolved-session-duration="resolvedSessionDuration"
        :parsed-days="parsedDays"
        :generation-step="generationStep"
        :generation-progress="generationProgress"
      />

      <form v-else @submit.prevent="onSubmit" class="space-y-5 mt-6">
        <div class="space-y-2">
          <Label for="title">Lesson Plan Title</Label>
          <Input id="title" v-model="form.title" required/>
        </div>
        
        <div class="grid sm:grid-cols-3 gap-3">
          <div class="space-y-2 min-w-xs">
            <div class="flex items-center justify-between">
              <Label>Subject</Label>
            </div>
            <!-- Inline Custom Subject Creator -->
            <div v-if="isCreatingSubject" class="rounded-md border border-primary/20 bg-primary/5 p-3 min-w-50 max-w-54 space-y-2.5">
              <div class="flex items-center justify-between">
                <span class="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <PlusCircle class="size-3.5 text-primary" /> Create Subject
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  class="size-5 text-muted-foreground hover:text-foreground"
                  @click="cancelCreateSubject"
                >
                  <X class="size-3" />
                </Button>
              </div>
              <div class="space-y-1.5">
                <div>
                  <Label class="text-[11px] text-muted-foreground font-medium">Subject Name *</Label>
                  <Input
                    v-model="newSubjectName"
                    placeholder="e.g. Araling Panlipunan"
                    class="h-8 text-xs bg-background mt-0.5"
                    @input="onSubjectNameInput"
                    @keydown.enter.prevent="handleCreateSubject"
                  />
                </div>
                <div>
                  <Label class="text-[11px] text-muted-foreground font-medium">Subject Code / Abbr</Label>
                  <Input
                    v-model="newSubjectCode"
                    placeholder="e.g. Aral-pan"
                    class="h-8 text-xs bg-background uppercase mt-0.5"
                    @input="onSubjectCodeInput"
                    @keydown.enter.prevent="handleCreateSubject"
                  />
                </div>
              </div>
              <div v-if="customSubjectError" class="text-[11px] text-destructive flex items-center gap-1">
                <AlertCircle class="size-3 shrink-0" />
                <span>{{ customSubjectError }}</span>
              </div>
              <div class="flex items-center justify-end gap-1.5 pt-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  class="h-7 text-xs"
                  :disabled="isSavingSubject"
                  @click="cancelCreateSubject"
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  size="sm"
                  class="h-7 text-xs gap-1.5"
                  :disabled="!newSubjectName.trim() || isSavingSubject"
                  @click="handleCreateSubject"
                >
                  <Loader2 v-if="isSavingSubject" class="size-3 animate-spin" />
                  <Plus v-else class="size-3" />
                  <span>{{ isSavingSubject ? 'Saving...' : 'Save & Select' }}</span>
                </Button>
              </div>
            </div>

            <!-- Subject Select -->
            <Select v-else v-model="form.subject_id" required @update:model-value="onSubjectChange">
              <SelectTrigger>
                <SelectValue placeholder="Select subject" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem v-for="subject in subjects" :key="subject.id" :value="subject.id">
                  {{ subject.name || subject.code }}
                </SelectItem>
                <SelectSeparator />
                <SelectItem value="__new_custom__" class="text-primary font-medium focus:text-primary focus:bg-primary/10">
                  <div class="flex items-center gap-1.5 py-0.5">
                    <Plus class="size-3.5" />
                    <span>Create custom subject...</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div class="space-y-2 min-w-xs">
            <Label>Grade Level</Label>
            <Select v-model="form.grade_level_id" required>
              <SelectTrigger>
                <SelectValue placeholder="Select grade" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem v-for="grade in grades" :key="grade.id" :value="grade.id">
                  {{ grade.label }}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div class="space-y-2 min-w-xs">
            <Label>Term</Label>
            <Select v-model="form.term" required>
              <SelectTrigger>
                <SelectValue placeholder="Select term" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="term_1">Term 1</SelectItem>
                <SelectItem value="term_2">Term 2</SelectItem>
                <SelectItem value="term_3">Term 3</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div class="space-y-2">
          <Label for="topic">Topic / Content Focus</Label>
          <Textarea id="topic" v-model="form.topic" required rows="4" placeholder="Describe what should be included in the lesson plan. Example: Learners will explore how to compose and decompose numbers 4 to 10 using counters, drawings, and partner activities." />
        </div>
        <div class="space-y-2">
            <Label for="competency">Learning Competency</Label>
            <Textarea id="competency" v-model="form.matatag_competency_code" rows="2" placeholder="Paste or write the full learning competency." />
        </div>
        <div class="grid gap-4 sm:grid-cols-2">
          <div class="space-y-2">
            <Label for="content_standard">Content Standard</Label>
            <Textarea id="content_standard" v-model="form.content_standard" rows="3" />
          </div>
          <div class="space-y-2">
            <Label for="performance_standard">Performance Standard</Label>
            <Textarea id="performance_standard" v-model="form.performance_standard" rows="3"  />
          </div>
        </div>

        <div class="grid gap-4 sm:grid-cols-2">
          <div class="space-y-2">
            <Label for="session_duration">Number of Days / Sessions</Label>
            <Select v-model="sessionOption">
              <SelectTrigger id="session_duration">
                <SelectValue placeholder="Select session days" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Day 1">1 Day (Day 1)</SelectItem>
                <SelectItem value="Day 1, Day 2">2 Days (Day 1, Day 2)</SelectItem>
                <SelectItem value="Day 1, Day 2, Day 3">3 Days (Day 1 to Day 3)</SelectItem>
                <SelectItem value="Day 1, Day 2, Day 3, Day 4">4 Days (Day 1 to Day 4)</SelectItem>
                <SelectItem value="Day 1, Day 2, Day 3, Day 4, Day 5">5 Days (Day 1 to Day 5)</SelectItem>
                <SelectItem value="custom">Custom...</SelectItem>
              </SelectContent>
            </Select>
            <Input
              v-if="sessionOption === 'custom'"
              v-model="customSessionDuration"
              placeholder="e.g. Day 2 or Day 1, Day 2"
              class="mt-1"
            />
          </div>
          <div class="space-y-2">
            <Label>Medium of Instruction</Label>
            <Select v-model="form.medium_of_instruction">
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="English">English</SelectItem>
                <SelectItem value="Filipino">Filipino / Tagalog</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div class="space-y-2">
          <Label for="school_name">School Name</Label>
          <Input id="school_name" v-model="form.school_name" placeholder="School name" />
        </div>

        <div class="grid gap-4 sm:grid-cols-2">
          <div class="space-y-2">
            <Label for="prepared_by_name">Prepared By Name</Label>
            <Input id="prepared_by_name" v-model="form.prepared_by_name" placeholder="Teacher's name" />
          </div>
          <div class="space-y-2">
            <Label for="prepared_by_position">Prepared By Position</Label>
            <Select v-model="form.prepared_by_position_id">
              <SelectTrigger id="prepared_by_position"><SelectValue placeholder="Position" /></SelectTrigger>
              <SelectContent>
                <SelectItem v-for="pos in positions" :key="pos.id" :value="pos.id">{{ pos.name }}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div class="grid gap-4 sm:grid-cols-2">
          <div class="space-y-2">
            <Label for="checked_by_name">Checked By Name</Label>
            <Input id="checked_by_name" v-model="form.checked_by_name" placeholder="Checker's name" />
          </div>
          <div class="space-y-2">
            <Label for="checked_by_position">Checked By Position</Label>
            <Select v-model="form.checked_by_position_id">
              <SelectTrigger id="checked_by_position"><SelectValue placeholder="Position" /></SelectTrigger>
              <SelectContent>
                <SelectItem v-for="pos in positions" :key="pos.id" :value="pos.id">{{ pos.name }}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div class="grid gap-4 sm:grid-cols-2">
          <div class="space-y-2">
            <Label for="checked_by_2_name">Checked By 2 Name</Label>
            <Input id="checked_by_2_name" v-model="form.checked_by_2_name" placeholder="Second checker's name" />
          </div>
          <div class="space-y-2">
            <Label for="checked_by_2_position">Checked By 2 Position</Label>
            <Select v-model="form.checked_by_2_position_id">
              <SelectTrigger id="checked_by_2_position"><SelectValue placeholder="Position" /></SelectTrigger>
              <SelectContent>
                <SelectItem v-for="pos in positions" :key="pos.id" :value="pos.id">{{ pos.name }}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

       
        
        <SheetFooter class="pt-6 flex-col sm:flex-col gap-4">
          <div class="flex justify-end gap-2 w-full">
            <SheetClose as-child>
              <Button variant="outline" type="button">Cancel</Button>
            </SheetClose>
            <Button type="submit" :disabled="isGenerating || usage?.isLimitReached">
              <Loader2 v-if="isGenerating" class="w-4 h-4 mr-2 animate-spin" />
              {{ isGenerating ? 'Generating...' : 'Generate' }}
            </Button>
          </div>
        </SheetFooter>
      </form>
    </SheetContent>
  </Sheet>
</template>
