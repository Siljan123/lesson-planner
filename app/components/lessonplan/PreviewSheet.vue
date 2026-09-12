<script setup lang="ts">
import { computed } from 'vue'
import { BookOpen, ExternalLink, GraduationCap, Lightbulb, ListChecks } from '@lucide/vue'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet'

const props = defineProps<{ open: boolean; plan: any }>()
const emit = defineEmits(['update:open'])
const intentions = computed(() => props.plan?.content?.intentions || {})
const objectives = computed(() => intentions.value.learning_objectives || {})
const sessionObjectives = computed(() => intentions.value.learning_objectives_per_session || [])
const sessions = computed(() => props.plan?.content?.learning_experience?.sessions || [])
const assessments = computed(() => props.plan?.content?.assessing_learning?.formative_assessment_per_session || [])

function onOpenChange(value: boolean) { emit('update:open', value) }
function assessmentFor(day: string) { return assessments.value.find((assessment: any) => assessment.day === day) }
function objectivesFor(day: string) { return sessionObjectives.value.find((objective: any) => objective.day === day) || objectives.value }
</script>

<template>
  <Sheet :open="open" @update:open="onOpenChange">
    <SheetContent class="sm:max-w-3xl flex h-full flex-col overflow-hidden p-0">
      <SheetHeader class="border-b bg-muted/30 px-6 py-5 text-left">
        <div class="flex items-start justify-between gap-4 pr-8">
          <div class="min-w-0">
            <div class="mb-2 flex items-center gap-2"><Badge variant="outline">DLL Preview</Badge><Badge v-if="plan?.status" variant="secondary" class="capitalize">{{ plan.status.replace('_', ' ') }}</Badge></div>
            <SheetTitle class="truncate text-xl">{{ plan?.title || 'Untitled lesson plan' }}</SheetTitle>
            <SheetDescription class="mt-1">{{ plan?.subject?.name || 'Subject' }} · {{ plan?.grade?.label || 'Grade level' }} · {{ String(plan?.term || 'Term').replace('_', ' ') }}</SheetDescription>
          </div>
          <Button v-if="plan?.id" size="sm" as-child class="shrink-0 gap-1.5"><NuxtLink :to="`/authenticated/generated-lesson-plan/${plan.id}`" @click="onOpenChange(false)">Open editor <ExternalLink class="size-3.5" /></NuxtLink></Button>
        </div>
      </SheetHeader>

      <div v-if="plan?.content" class="flex-1 space-y-5 overflow-y-auto bg-muted/20 p-6">
        <section class="rounded-xl border bg-background p-5 shadow-sm">
          <div class="mb-3 flex items-center gap-2 text-sm font-semibold"><GraduationCap class="size-4 text-primary" /> Intentions</div>
          <p class="text-sm leading-6 text-muted-foreground">{{ intentions.learning_competency || 'No learning competency added yet.' }}</p>
          <div v-if="intentions.content_standards || intentions.performance_standards" class="mt-4 grid gap-3 sm:grid-cols-2"><div class="rounded-lg bg-muted/50 p-3"><p class="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Content standard</p><p class="mt-1 text-sm">{{ intentions.content_standards || '—' }}</p></div><div class="rounded-lg bg-muted/50 p-3"><p class="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Performance standard</p><p class="mt-1 text-sm">{{ intentions.performance_standards || '—' }}</p></div></div>
        </section>

        <section class="rounded-xl border bg-background p-5 shadow-sm"><div class="mb-3 flex items-center gap-2 text-sm font-semibold"><ListChecks class="size-4 text-primary" /> Learning objectives</div><div class="space-y-3"><div v-for="item in [{ label: 'Cognitive', value: objectives.cognitive }, { label: 'Psychomotor', value: objectives.psychomotor }, { label: 'Affective', value: objectives.affective }]" :key="item.label" class="flex gap-3 text-sm"><span class="w-24 shrink-0 font-medium text-foreground">{{ item.label }}</span><span class="leading-6 text-muted-foreground">{{ item.value || 'To be completed in the editor.' }}</span></div></div></section>

        <section class="space-y-3"><div class="flex items-center gap-2 text-sm font-semibold"><BookOpen class="size-4 text-primary" /> Learning experience</div><article v-for="session in sessions" :key="session.day" class="rounded-xl border bg-background p-5 shadow-sm"><div class="flex items-center justify-between gap-3"><h3 class="font-semibold">{{ session.day }}</h3><span class="text-xs text-muted-foreground">{{ session.integration || 'Integrated learning' }}</span></div><div class="mt-3 rounded-lg bg-primary/5 p-3 text-sm"><p class="mb-2 font-medium">Session objectives</p><p class="text-muted-foreground"><span class="font-medium text-foreground">Cognitive: </span>{{ objectivesFor(session.day).cognitive || '—' }}</p><p class="mt-1 text-muted-foreground"><span class="font-medium text-foreground">Psychomotor: </span>{{ objectivesFor(session.day).psychomotor || '—' }}</p><p class="mt-1 text-muted-foreground"><span class="font-medium text-foreground">Affective: </span>{{ objectivesFor(session.day).affective || '—' }}</p></div><p v-if="session.pre_lesson" class="mt-3 rounded-lg bg-primary/5 p-3 text-sm leading-6"><span class="font-medium">Before the lesson: </span>{{ session.pre_lesson }}</p><div class="mt-4 space-y-3"><div v-for="phase in session.phases || []" :key="phase.phase" class="border-l-2 border-primary/30 pl-3"><p class="text-sm font-medium">{{ phase.phase }}</p><p class="mt-1 text-sm leading-6 text-muted-foreground">{{ phase.teacher_activity }}</p></div></div><div v-if="assessmentFor(session.day)" class="mt-4 rounded-lg bg-muted/50 p-3 text-sm"><span class="font-medium">Quick check: </span>{{ assessmentFor(session.day).description }}</div></article><div v-if="!sessions.length" class="rounded-xl border border-dashed bg-background p-6 text-center text-sm text-muted-foreground">No sessions have been generated yet.</div></section>
        <section v-if="plan.content.ways_forward" class="rounded-xl border bg-background p-5 shadow-sm"><div class="mb-2 flex items-center gap-2 text-sm font-semibold"><Lightbulb class="size-4 text-primary" /> Ways forward</div><p class="text-sm leading-6 text-muted-foreground">{{ plan.content.ways_forward.extended_learning || plan.content.ways_forward.enrichment || 'Open the editor to add an extension activity.' }}</p></section>
      </div>
      <div v-else class="flex flex-1 items-center justify-center p-6 text-sm text-muted-foreground">No content generated yet. Open the editor to build the DLL.</div>
    </SheetContent>
  </Sheet>
</template>
