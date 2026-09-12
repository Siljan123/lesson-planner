<script setup lang="ts">
import { ref, watch } from 'vue'
import { useAsyncData } from '#imports'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetFooter } from '@/components/ui/sheet'
import { Loader2, Sparkles, RotateCw } from '@lucide/vue'

const props = defineProps<{ open: boolean; plan: any }>()
const emit = defineEmits(['update:open', 'updated'])
const { fetchSubjects, fetchGrades } = useReferenceData()
const { updatePlan, regeneratePlan } = useLessonPlans()
const { data: subjects } = useAsyncData('subjects-edit', async () => await fetchSubjects() as any[], { lazy: true })
const { data: grades } = useAsyncData('grades-edit', async () => await fetchGrades() as any[], { lazy: true })
const isUpdating = ref(false)
const isRegeneratingObjectives = ref(false)
const isRegeneratingPlan = ref(false)

const form = ref({
  title: '',
  subject_id: '',
  grade_level_id: '',
  term: 'term_1',
  matatag_competency_code: '',
  topic: '',
  content_standard: '',
  performance_standard: '',
  cognitive: '',
  psychomotor: '',
  affective: ''
})

watch(() => props.plan, (plan) => {
  if (!plan) return
  const intentions = plan.content?.intentions || {}
  const objectives = intentions.learning_objectives || {}
  form.value = {
    title: plan.title || '',
    subject_id: plan.subject_id || '',
    grade_level_id: plan.grade_level_id || '',
    term: plan.term || 'term_1',
    matatag_competency_code: plan.matatag_competency_code || '',
    topic: plan.topic || plan.content?.topic || intentions.topic || '',
    content_standard: intentions.content_standards || plan.content_standard || '',
    performance_standard: intentions.performance_standards || plan.performance_standard || '',
    cognitive: objectives.cognitive || '',
    psychomotor: objectives.psychomotor || '',
    affective: objectives.affective || ''
  }
}, { immediate: true })

function onOpenChange(value: boolean) {
  emit('update:open', value)
}

async function regenerateObjectives() {
  if (!props.plan?.id) return
  try {
    isRegeneratingObjectives.value = true
    const res = await regeneratePlan(props.plan.id, {
      section: 'objectives_only',
      title: form.value.title,
      subject_id: form.value.subject_id,
      grade_level_id: form.value.grade_level_id,
      term: form.value.term,
      topic: form.value.topic || form.value.title,
      matatag_competency_code: form.value.matatag_competency_code,
      content_standard: form.value.content_standard,
      performance_standard: form.value.performance_standard
    })
    if (res?.content?.intentions?.learning_objectives) {
      const obj = res.content.intentions.learning_objectives
      form.value.cognitive = obj.cognitive || form.value.cognitive
      form.value.psychomotor = obj.psychomotor || form.value.psychomotor
      form.value.affective = obj.affective || form.value.affective
    }
  } catch (err: any) {
    alert('Failed to regenerate objectives: ' + (err.data?.message || err.message || 'Unknown error'))
  } finally {
    isRegeneratingObjectives.value = false
  }
}

async function regenerateFullPlan() {
  if (!props.plan?.id) return
  if (!confirm('Regenerate the entire lesson plan with AI? This will re-draft all four sections based on your current inputs.')) return
  try {
    isRegeneratingPlan.value = true
    await regeneratePlan(props.plan.id, {
      section: 'all',
      title: form.value.title,
      subject_id: form.value.subject_id,
      grade_level_id: form.value.grade_level_id,
      term: form.value.term,
      topic: form.value.topic || form.value.title,
      matatag_competency_code: form.value.matatag_competency_code,
      content_standard: form.value.content_standard,
      performance_standard: form.value.performance_standard
    })
    onOpenChange(false)
    emit('updated')
  } catch (err: any) {
    alert('Failed to regenerate lesson plan: ' + (err.data?.message || err.message || 'Unknown error'))
  } finally {
    isRegeneratingPlan.value = false
  }
}

async function onSubmit() {
  if (!props.plan) return
  try {
    isUpdating.value = true
    const existingContent = props.plan.content || {}
    await updatePlan(props.plan.id, {
      ...form.value,
      content: {
        ...existingContent,
        topic: form.value.topic,
        intentions: {
          ...(existingContent.intentions || {}),
          topic: form.value.topic,
          content_standards: form.value.content_standard,
          performance_standards: form.value.performance_standard,
          learning_objectives: {
            cognitive: form.value.cognitive,
            psychomotor: form.value.psychomotor,
            affective: form.value.affective
          }
        }
      }
    })
    onOpenChange(false)
    emit('updated')
  } catch (error: any) {
    alert('Failed to update lesson plan: ' + (error.data?.message || error.message || 'Unknown error'))
  } finally {
    isUpdating.value = false
  }
}
</script>

<template>
  <Sheet :open="open" @update:open="onOpenChange">
    <SheetContent class="sm:max-w-2xl overflow-y-auto p-7">
      <SheetHeader>
        <SheetTitle>Quick edit DLL</SheetTitle>
        <SheetDescription>Update essential details and objectives. Use the full editor for lesson activities and assessments.</SheetDescription>
      </SheetHeader>
      <form class="mt-6 space-y-6" @submit.prevent="onSubmit">
        <section class="space-y-4">
          <h3 class="text-sm font-semibold">Lesson details</h3>
          <div class="space-y-2">
            <Label for="edit-title">Lesson plan title</Label>
            <Input id="edit-title" v-model="form.title" required />
          </div>
          <div class="grid gap-4 sm:grid-cols-2">
            <div class="space-y-2">
              <Label>Subject</Label>
              <Select v-model="form.subject_id">
                <SelectTrigger>
                  <SelectValue placeholder="Select subject" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem v-for="subject in subjects" :key="subject.id" :value="subject.id">{{ subject.name }}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div class="space-y-2">
              <Label>Grade level</Label>
              <Select v-model="form.grade_level_id">
                <SelectTrigger>
                  <SelectValue placeholder="Select grade" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem v-for="grade in grades" :key="grade.id" :value="grade.id">{{ grade.label }}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div class="grid gap-4 sm:grid-cols-[.7fr_1.3fr]">
            <div class="space-y-2">
              <Label>Term</Label>
              <Select v-model="form.term">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="term_1">Term 1</SelectItem>
                  <SelectItem value="term_2">Term 2</SelectItem>
                  <SelectItem value="term_3">Term 3</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div class="space-y-2">
              <Label for="edit-competency">Learning competency</Label>
              <Textarea id="edit-competency" v-model="form.matatag_competency_code" rows="2" />
            </div>
          </div>
          <div class="space-y-2">
            <Label for="edit-topic">Topic / content focus</Label>
            <Textarea id="edit-topic" v-model="form.topic" rows="3" required />
          </div>
          <div class="grid gap-4 sm:grid-cols-2">
            <div class="space-y-2">
              <Label>Content standard</Label>
              <Textarea v-model="form.content_standard" rows="3" />
            </div>
            <div class="space-y-2">
              <Label>Performance standard</Label>
              <Textarea v-model="form.performance_standard" rows="3" />
            </div>
          </div>
        </section>

        <section class="space-y-3 rounded-xl border bg-muted/30 p-4">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <Sparkles class="size-4 text-primary" />
              <h3 class="text-sm font-semibold">Learning objectives</h3>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              class="h-7 text-xs gap-1 font-semibold"
              :disabled="isRegeneratingObjectives"
              @click="regenerateObjectives"
            >
              <Loader2 v-if="isRegeneratingObjectives" class="size-3 animate-spin" />
              <Sparkles v-else class="size-3 text-primary" />
              <span>{{ isRegeneratingObjectives ? 'Generating...' : 'AI Re-draft' }}</span>
            </Button>
          </div>
          <p class="text-xs text-muted-foreground">These are saved directly into the DLL and displayed in its preview and export.</p>
          <div class="space-y-2">
            <Label>Cognitive</Label>
            <Textarea v-model="form.cognitive" rows="2" placeholder="Learners will be able to identify, explain, or solve..." />
          </div>
          <div class="space-y-2">
            <Label>Psychomotor</Label>
            <Textarea v-model="form.psychomotor" rows="2" placeholder="Learners will be able to demonstrate or create..." />
          </div>
          <div class="space-y-2">
            <Label>Affective</Label>
            <Textarea v-model="form.affective" rows="2" placeholder="Learners will be able to value, participate, or show..." />
          </div>
        </section>

        <SheetFooter class="flex sm:justify-between items-center w-full gap-2 pt-2">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            class="gap-1.5 font-semibold text-xs text-primary mr-auto"
            :disabled="isRegeneratingPlan || isUpdating"
            @click="regenerateFullPlan"
          >
            <Loader2 v-if="isRegeneratingPlan" class="size-3.5 animate-spin" />
            <RotateCw v-else class="size-3.5" />
            <span>{{ isRegeneratingPlan ? 'Regenerating...' : 'Regenerate full plan with AI' }}</span>
          </Button>
          <div class="flex gap-2">
            <Button variant="outline" type="button" @click="onOpenChange(false)">Cancel</Button>
            <Button type="submit" :disabled="isUpdating || isRegeneratingPlan">
              <Loader2 v-if="isUpdating" class="mr-2 size-4 animate-spin" />
              {{ isUpdating ? 'Saving...' : 'Save changes' }}
            </Button>
          </div>
        </SheetFooter>
      </form>
    </SheetContent>
  </Sheet>
</template>
