<script setup lang="ts">
import { ref, computed, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAsyncData } from '#imports'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger, SheetFooter, SheetClose } from '@/components/ui/sheet'
import { Checkbox } from '@/components/ui/checkbox'
import { CheckCircle2, Loader2, Plus, Sparkles, AlertCircle, BookOpen } from '@lucide/vue'

const router = useRouter()
const { fetchSubjects, fetchGrades } = useReferenceData()
const { generateWorksheet } = useWorksheets()

const { data: subjects } = useAsyncData('worksheet-subjects', async () => {
  return (await fetchSubjects()) as any[]
}, { lazy: true })

const { data: grades } = useAsyncData('worksheet-grades', async () => {
  return (await fetchGrades()) as any[]
}, { lazy: true })

const isOpen = ref(false)
const isGenerating = ref(false)
const generationStep = ref(1)
const generationProgress = ref(15)
let stepTimer: any = null
const errorMessage = ref('')

const form = ref({
  title: '',
  subject_id: '',
  grade_level_id: '',
  term: 'term_1',
  medium_of_instruction: 'English',
  topic: '',
  target_competency: '',
  custom_instructions: '',
  include_tos: false,
  q_multiple_choice: 10,
  q_true_false: 0,
  q_fill_in_blank: 0,
  q_essay: 0
})

const emit = defineEmits(['created'])

function onSubjectChange(subjectId: unknown) {
  const normalized = String(subjectId ?? '')
  const subject = subjects.value?.find((item: any) => item.id === normalized)?.name?.toLowerCase() || ''
  form.value.medium_of_instruction = ['english', 'mathematics', 'science', 'tle'].some((name) => subject.includes(name))
    ? 'English'
    : 'Filipino'
  updateAutoTitle()
}

function updateAutoTitle() {
  if (!form.value.topic.trim()) return
  const subj = subjects.value?.find((s: any) => s.id === form.value.subject_id)?.name || ''
  const isEng = form.value.medium_of_instruction === 'English'
  const prefix = isEng ? 'Worksheet' : 'Gawaing Pagkatuto'
  form.value.title = subj
    ? `${prefix} in ${subj}: ${form.value.topic.trim()}`
    : `${prefix}: ${form.value.topic.trim()}`
}

function startProgressSimulation() {
  generationStep.value = 1
  generationProgress.value = 18

  stepTimer = setInterval(() => {
    if (generationProgress.value < 90) {
      generationProgress.value += Math.floor(Math.random() * 8) + 4
      if (generationProgress.value >= 30 && generationStep.value < 2) generationStep.value = 2
      if (generationProgress.value >= 55 && generationStep.value < 3) generationStep.value = 3
      if (generationProgress.value >= 75 && generationStep.value < 4) generationStep.value = 4
      if (generationProgress.value >= 88 && generationStep.value < 5) generationStep.value = 5
    }
  }, 1200)
}

function clearProgressSimulation() {
  if (stepTimer) {
    clearInterval(stepTimer)
    stepTimer = null
  }
}

onUnmounted(() => {
  clearProgressSimulation()
})

const isFormValid = computed(() => {
  return form.value.subject_id && form.value.grade_level_id && form.value.topic.trim()
})

async function handleGenerate() {
  if (!isFormValid.value) return
  if (!form.value.title.trim()) {
    updateAutoTitle()
  }

  isGenerating.value = true
  errorMessage.value = ''
  startProgressSimulation()

  const itemReqs = [
    form.value.q_multiple_choice > 0 ? `${form.value.q_multiple_choice} Multiple Choice items` : null,
    form.value.q_true_false > 0 ? `${form.value.q_true_false} True/False items` : null,
    form.value.q_fill_in_blank > 0 ? `${form.value.q_fill_in_blank} Fill in the Blank items` : null,
    form.value.q_essay > 0 ? `${form.value.q_essay} Essay/Short Answer items` : null,
  ].filter(Boolean)

  let finalCustomInstructions = form.value.custom_instructions.trim()
  if (itemReqs.length > 0) {
    const countsText = `CRITICAL REQUIREMENT: You MUST generate EXACTLY the following items, and NOTHING ELSE:
${itemReqs.join(', ')}

    DO NOT generate any sections, parts, or questions for item types that are not listed above. For example, if Fill in the Blanks is not listed, DO NOT create a Fill in the Blank section. Omit unrequested sections entirely.`

    finalCustomInstructions = finalCustomInstructions 
      ? `${countsText}\n\n${finalCustomInstructions}`
      : countsText
  }

  try {
    const result = await generateWorksheet({
      title: form.value.title.trim() || `Worksheet: ${form.value.topic}`,
      subject_id: form.value.subject_id,
      grade_level_id: form.value.grade_level_id,
      term: form.value.term,
      medium_of_instruction: form.value.medium_of_instruction,
      topic: form.value.topic.trim(),
      target_competency: form.value.target_competency.trim() || undefined,
      custom_instructions: finalCustomInstructions || undefined,
      include_tos: form.value.include_tos
    })

    clearProgressSimulation()
    generationProgress.value = 100
    generationStep.value = 5

    setTimeout(() => {
      isOpen.value = false
      isGenerating.value = false
      emit('created', result.id)
      router.push(`/authenticated/worksheets/${result.id}`)
    }, 600)
  } catch (err: any) {
    console.error('Worksheet generation failed:', err)
    clearProgressSimulation()
    isGenerating.value = false
    errorMessage.value = err?.data?.message || err?.message || 'Failed to generate worksheet. Please try again.'
  }
}

const generationSteps = [
  { step: 1, label: 'Aligning with curriculum & competencies' },
  { step: 2, label: 'Drafting Part I: Concept recall & multiple-choice items' },
  { step: 3, label: 'Structuring Part II: Guided practice & fill-in exercises' },
  { step: 4, label: 'Designing Part III: Real-world application & reflection' },
  { step: 5, label: 'Generating complete Answer Key and scoring rubric' },
]
</script>

<template>
  <Sheet v-model:open="isOpen">
    <SheetTrigger as-child>
      <Button class="gap-2 shadow-xs cursor-pointer">
        <Plus class="h-4 w-4" />
        <span>Create Worksheet</span>
      </Button>
    </SheetTrigger>

    <SheetContent side="right" class="w-full sm:max-w-xl flex flex-col p-0 overflow-hidden">
      <SheetHeader class="p-6 pb-4 border-b">
        <div class="flex items-center gap-2">
          <div class="h-8 w-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
            <BookOpen class="h-4 w-4" />
          </div>
          <div>
            <SheetTitle>Generate Learning Activity Sheet</SheetTitle>
            <SheetDescription>
              Create a scaffolded, student-ready worksheet with an answer key.
            </SheetDescription>
          </div>
        </div>
      </SheetHeader>

      <div class="flex-1 overflow-y-auto p-6 space-y-5">
        <!-- Error Alert -->
        <div v-if="errorMessage" class="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm flex items-start gap-2">
          <AlertCircle class="h-4 w-4 mt-0.5 shrink-0" />
          <span>{{ errorMessage }}</span>
        </div>

        <!-- Generating State -->
        <div v-if="isGenerating" class="py-8 space-y-6">
          <div class="text-center space-y-2">
            <div class="inline-flex p-3 rounded-full bg-primary/10 text-primary animate-pulse">
              <Sparkles class="h-6 w-6" />
            </div>
            <h3 class="font-semibold text-lg">AI is Generating Your Worksheet...</h3>
            <p class="text-xs text-muted-foreground max-w-sm mx-auto">
              Creating age-appropriate exercises, questions, answer keys, and pedagogical rubrics.
            </p>
          </div>

          <!-- Progress Bar -->
          <div class="space-y-2">
            <div class="h-2 w-full bg-muted rounded-full overflow-hidden">
              <div
                class="h-full bg-primary transition-all duration-500 ease-out"
                :style="{ width: `${generationProgress}%` }"
              ></div>
            </div>
            <div class="flex justify-between text-xs text-muted-foreground font-mono">
              <span>Progress</span>
              <span>{{ generationProgress }}%</span>
            </div>
          </div>

          <!-- Step Checkpoints -->
          <div class="space-y-3 pt-2">
            <div
              v-for="s in generationSteps"
              :key="s.step"
              class="flex items-center gap-3 text-xs transition-opacity duration-300"
              :class="{
                'text-primary font-semibold': generationStep === s.step,
                'text-muted-foreground/60': generationStep < s.step,
                'text-foreground': generationStep > s.step,
              }"
            >
              <div
                class="w-5 h-5 rounded-full flex items-center justify-center text-[10px]"
                :class="{
                  'bg-primary text-primary-foreground': generationStep > s.step,
                  'border-2 border-primary text-primary animate-spin': generationStep === s.step,
                  'border border-muted-foreground/30': generationStep < s.step,
                }"
              >
                <CheckCircle2 v-if="generationStep > s.step" class="w-3.5 h-3.5" />
                <span v-else>{{ s.step }}</span>
              </div>
              <span>{{ s.label }}</span>
            </div>
          </div>
        </div>

        <!-- Form Fields -->
        <div v-else class="space-y-4">
          <!-- Subject & Grade -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div class="space-y-2">
              <Label for="subject">Subject <span class="text-destructive">*</span></Label>
              <Select v-model="form.subject_id" @update:model-value="onSubjectChange">
                <SelectTrigger id="subject">
                  <SelectValue placeholder="Select Subject" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem v-for="s in subjects" :key="s.id" :value="s.id">
                    {{ s.name }}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div class="space-y-2">
              <Label for="grade">Grade Level <span class="text-destructive">*</span></Label>
              <Select v-model="form.grade_level_id">
                <SelectTrigger id="grade">
                  <SelectValue placeholder="Select Grade" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem v-for="g in grades" :key="g.id" :value="g.id">
                    {{ g.label }}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <!-- Term & Language -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div class="space-y-2">
              <Label for="term">School Term</Label>
              <Select v-model="form.term">
                <SelectTrigger id="term">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="term_1">Quarter 1 / Term 1</SelectItem>
                  <SelectItem value="term_2">Quarter 2 / Term 2</SelectItem>
                  <SelectItem value="term_3">Quarter 3 / Term 3</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div class="space-y-2">
              <Label for="medium">Medium of Instruction</Label>
              <Select v-model="form.medium_of_instruction" @update:model-value="updateAutoTitle">
                <SelectTrigger id="medium">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="English">English</SelectItem>
                  <SelectItem value="Filipino">Filipino (Tagalog)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <!-- Topic -->
          <div class="space-y-2">
            <Label for="topic">Lesson Topic / Concept <span class="text-destructive">*</span></Label>
            <Input
              id="topic"
              v-model="form.topic"
              placeholder="e.g. Types of Rocks, Fractions, Pagiging Magalang sa Kapwa"
              @input="updateAutoTitle"
            />
          </div>

          <!-- Question Types Configuration -->
          <div class="space-y-3 p-4 bg-muted/30 rounded-lg border">
            <Label class="text-base font-semibold">Question Types & Quantities</Label>
            <div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div class="space-y-1.5">
                <Label for="q_mc" class="text-xs text-muted-foreground font-medium">Multiple Choice</Label>
                <Input id="q_mc" type="number" min="0" max="100" v-model="form.q_multiple_choice" class="h-9" />
              </div>
              <div class="space-y-1.5">
                <Label for="q_tf" class="text-xs text-muted-foreground font-medium">True/False</Label>
                <Input id="q_tf" type="number" min="0" max="100" v-model="form.q_true_false" class="h-9" />
              </div>
              <div class="space-y-1.5">
                <Label for="q_fib" class="text-xs text-muted-foreground font-medium">Fill in the Blanks</Label>
                <Input id="q_fib" type="number" min="0" max="100" v-model="form.q_fill_in_blank" class="h-9" />
              </div>
              <div class="space-y-1.5">
                <Label for="q_essay" class="text-xs text-muted-foreground font-medium">Essay</Label>
                <Input id="q_essay" type="number" min="0" max="10" v-model="form.q_essay" class="h-9" />
              </div>
            </div>
            <p class="text-[11px] text-muted-foreground">Leave at 0 if you do not want to include that question type.</p>
          </div>

          <!-- Title -->
          <div class="space-y-2">
            <Label for="title">Worksheet Title</Label>
            <Input
              id="title"
              v-model="form.title"
              placeholder="Auto-generated or custom title"
            />
          </div>

          <!-- Target Competency -->
          <div class="space-y-2">
            <Label for="competency">Target Learning Competency</Label>
            <Textarea
              id="competency"
              v-model="form.target_competency"
              rows="2"
              placeholder="e.g. Describe the changes in properties of materials when exposed to certain conditions..."
            />
          </div>

          <!-- Custom Instructions -->
          <div class="space-y-2">
            <Label for="instructions">Teacher Instructions / Special Focus</Label>
            <Textarea
              id="instructions"
              v-model="form.custom_instructions"
              rows="2"
              placeholder="e.g. Include localized Filipino scenarios, add 2 word problems, keep questions suitable for beginner readers..."
            />
          </div>

          <!-- Include TOS Checkbox -->
          <div class="flex items-center space-x-2 pt-2">
            <Checkbox id="include_tos" :checked="form.include_tos" @update:checked="form.include_tos = $event" />
            <label
              for="include_tos"
              class="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Include Table of Specification (TOS)
            </label>
          </div>
        </div>
      </div>

      <SheetFooter class="p-6 border-t bg-muted/20">
        <div class="flex items-center justify-end gap-3 w-full">
          <SheetClose as-child>
            <Button variant="outline" :disabled="isGenerating">Cancel</Button>
          </SheetClose>
          <Button
            class="gap-2 cursor-pointer"
            :disabled="!isFormValid || isGenerating"
            @click="handleGenerate"
          >
            <Sparkles class="h-4 w-4" />
            <span>Generate with AI</span>
          </Button>
        </div>
      </SheetFooter>
    </SheetContent>
  </Sheet>
</template>
