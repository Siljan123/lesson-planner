<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  useStaticData,
  type PresetLesson,
  type LessonObjective,
  type LessonActivity,
  type LessonAssessment
} from '@/composables/useStaticData'
import {
  Sparkles,
  CheckCircle2,
  Loader2,
  Play,
  Pause,
  RotateCcw,
  FileCheck2,
  ArrowRight,
  ArrowDown
} from '@lucide/vue'

const { presets, stepLabels } = useStaticData()

const activePresetIndex = ref(0)
const currentPreset = computed<PresetLesson>(() => {
  return presets[activePresetIndex.value] ?? (presets[0] as PresetLesson)
})

const isEnglish = computed(() => currentPreset.value.mediumOfInstruction === 'English')

function getObjective(idx: number): LessonObjective {
  return (currentPreset.value.objectives[idx] ?? currentPreset.value.objectives[0]) as LessonObjective
}

function getActivity(idx: number): LessonActivity {
  return (currentPreset.value.activities[idx] ?? currentPreset.value.activities[0]) as LessonActivity
}

function getAssessment(idx: number): LessonAssessment {
  return (currentPreset.value.assessment[idx] ?? currentPreset.value.assessment[0]) as LessonAssessment
}

// Simulation State
const generationStep = ref(1)
const generationProgress = ref(20)
const isAutoPlaying = ref(true)
let simulationInterval: any = null

// Auto-Scroll Engine
const tableScrollContainer = ref<HTMLElement | null>(null)
const isAutoScrolling = ref(true)
const isHovered = ref(false)
let scrollRafId: number | null = null

function updateAutoScroll() {
  if (tableScrollContainer.value && isAutoScrolling.value && !isHovered.value) {
    const el = tableScrollContainer.value
    const maxScroll = el.scrollHeight - el.clientHeight

    if (maxScroll > 0) {
      // Map generationProgress (from 20% to 100%) to target scroll (from 0 to maxScroll)
      const progressRatio = Math.max(0, Math.min(1, (generationProgress.value - 20) / 80))
      const targetScroll = progressRatio * maxScroll

      const currentScroll = el.scrollTop
      const delta = targetScroll - currentScroll

      // Smooth linear interpolation for gentle 60fps auto-scroll
      if (Math.abs(delta) > 0.8) {
        el.scrollTop = currentScroll + delta * 0.08
      } else {
        el.scrollTop = targetScroll
      }
    }
  }
  scrollRafId = requestAnimationFrame(updateAutoScroll)
}

function startSimulation() {
  stopSimulation()
  isAutoPlaying.value = true

  simulationInterval = setInterval(() => {
    if (!isAutoPlaying.value) return

    if (generationProgress.value >= 100) {
      // Paused briefly at 100% (bottom of document with signatories)
      stopSimulation()
      setTimeout(() => {
        if (!isHovered.value) {
          generationStep.value = 1
          generationProgress.value = 20
        }
        startSimulation()
      }, 3000)
    } else {
      generationProgress.value = Math.min(100, Math.round((generationProgress.value + 0.8) * 10) / 10)
      if (generationProgress.value >= 95) generationStep.value = 5
      else if (generationProgress.value >= 75) generationStep.value = 4
      else if (generationProgress.value >= 50) generationStep.value = 3
      else if (generationProgress.value >= 25) generationStep.value = 2
      else generationStep.value = 1
    }
  }, 160)
}

function stopSimulation() {
  if (simulationInterval) {
    clearInterval(simulationInterval)
    simulationInterval = null
  }
  isAutoPlaying.value = false
}

function toggleAutoPlay() {
  if (isAutoPlaying.value) {
    stopSimulation()
  } else {
    startSimulation()
  }
}

function restartSimulation() {
  stopSimulation()
  generationStep.value = 1
  generationProgress.value = 20
  if (tableScrollContainer.value) {
    tableScrollContainer.value.scrollTo({ top: 0, behavior: 'smooth' })
  }
  startSimulation()
}

function selectStep(step: number) {
  stopSimulation()
  generationStep.value = step
  if (step === 1) generationProgress.value = 20
  else if (step === 2) generationProgress.value = 45
  else if (step === 3) generationProgress.value = 70
  else if (step === 4) generationProgress.value = 88
  else if (step === 5) generationProgress.value = 100
}

function selectPreset(index: number) {
  activePresetIndex.value = index
  restartSimulation()
}

onMounted(() => {
  startSimulation()
  scrollRafId = requestAnimationFrame(updateAutoScroll)
})

onUnmounted(() => {
  stopSimulation()
  if (scrollRafId) {
    cancelAnimationFrame(scrollRafId)
    scrollRafId = null
  }
})
</script>

<template>
  <section id="demo-preview" class="py-16 md:py-24 bg-muted/30 border-y scroll-mt-14">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
      <!-- Section Header -->
      <div class="text-left max-w-7xl mx-auto space-y-3">
        <h2 class="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
         Tired of Manual Encoding Your DLL?
        </h2>
        <p class="text-base text-muted-foreground">
          Experience exactly how AI synthesizes DepEd competencies, structures the ILAW framework, and drafts DLL activities in real time.
        </p>
      </div>
      <div class="grid gap-8 lg:grid-cols-[1.15fr_.85fr] items-start">
        <div class="rounded-md border overflow-hidden flex flex-col">
          <!-- Document Header Bar -->
          <div
            ref="tableScrollContainer"
            class="overflow-auto bg-white p-4 sm:p-6 text-black font-serif max-h-145 select-text scroll-smooth"
            @mouseenter="isHovered = true"
            @mouseleave="isHovered = false"
            @touchstart="isHovered = true"
            @touchend="isHovered = false"
          >
            <table class="w-full border-collapse border border-black table-fixed text-[11px] leading-tight">
              <tbody>
              <!-- Pangalan ng Aralin / Lesson Title -->
              <tr>
                <td class="border border-black p-2 w-36 sm:w-44 font-bold bg-gray-50 text-gray-900">
                  {{ isEnglish ? 'Lesson Title' : 'Pangalan ng Aralin' }}
                </td>
                <td :colspan="currentPreset.parsedDays.length || 1" class="border border-black p-2 font-bold text-xs text-gray-950">
                  {{ currentPreset.title }}
                </td>
              </tr>

              <!-- Asignatura / Learning Area -->
              <tr>
                <td class="border border-black p-2 font-bold bg-gray-50 text-gray-900">
                  {{ isEnglish ? 'Learning Area / Subject' : 'Asignatura' }}
                </td>
                <td :colspan="currentPreset.parsedDays.length || 1" class="border border-black p-2 font-semibold text-gray-900">
                  {{ currentPreset.subjectName }} ({{ currentPreset.mediumOfInstruction }})
                </td>
              </tr>

              <!-- Inihanda ni / Prepared by -->
              <tr>
                <td class="border border-black p-2 font-bold bg-gray-50 text-gray-900">
                  {{ isEnglish ? 'Prepared by' : 'Inihanda ni' }}
                </td>
                <td :colspan="currentPreset.parsedDays.length || 1" class="border border-black p-2 text-gray-900">
                  {{ currentPreset.teacherName }}
                </td>
              </tr>

              <!-- Baitang at Seksyon / Grade & Section -->
              <tr>
                <td class="border border-black p-2 font-bold bg-gray-50 text-gray-900">
                  {{ isEnglish ? 'Grade & Section' : 'Baitang at Seksyon' }}
                </td>
                <td :colspan="currentPreset.parsedDays.length || 1" class="border border-black p-2 text-gray-900">
                  {{ currentPreset.gradeLabel }}
                </td>
              </tr>

              <!-- Bilang ng Araw/Sesyon / Session Duration -->
              <tr>
                <td class="border border-black p-2 font-bold bg-gray-50 text-gray-900">
                  {{ isEnglish ? 'Session Duration' : 'Bilang ng Araw/Sesyon' }}
                </td>
                <td :colspan="currentPreset.parsedDays.length || 1" class="border border-black p-2 text-gray-900 font-medium">
                  {{ currentPreset.sessionDuration }} ({{ currentPreset.parsedDays.length }} {{ isEnglish ? (currentPreset.parsedDays.length === 1 ? 'Session' : 'Sessions') : (currentPreset.parsedDays.length === 1 ? 'Sesyon' : 'mga Sesyon') }})
                </td>
              </tr>

              <!-- Mga Sanggunian / References -->
              <tr>
                <td class="border border-black p-2 font-bold bg-gray-50 align-top text-gray-900">
                  {{ isEnglish ? 'References' : 'Mga Sanggunian' }}<br>
                  <span class="text-[9px] font-normal text-gray-600">
                    {{ isEnglish ? '(curriculum guides, exemplars, toolkits)' : '(mga aklat, website, toolkit)' }}
                  </span>
                </td>
                <td :colspan="currentPreset.parsedDays.length || 1" class="border border-black p-2 text-gray-700">
                  DepEd MATATAG Curriculum Guide, Lesson Exemplars, Learning Activity Sheets (LAS)
                </td>
              </tr>

              <!-- Deklarasyon ng Paggamit ng AI / AI Declaration -->
              <tr>
                <td class="border border-black p-2 font-bold bg-gray-50 align-top text-gray-900">
                  {{ isEnglish ? 'AI Transparency Declaration' : 'Deklarasyon ng Paggamit ng AI' }}<br>
                  <span class="text-[9px] font-normal text-gray-600">(DO 3, s. 2026 Annex A)</span>
                </td>
                <td :colspan="currentPreset.parsedDays.length || 1" class="border border-black p-2 text-[10px] text-gray-700 italic">
                  {{ isEnglish
                    ? 'This lesson plan was generated with AI assistance as a pedagogical drafting tool pursuant to DepEd Order No. 3, s. 2026.'
                    : 'Ang lesson plan na ito ay binuo sa tulong ng AI bilang pedagogical drafting assistant batay sa DepEd Order No. 3, s. 2026.' }}
                </td>
              </tr>

              <!-- I. INTENTIONS -->
              <tr>
                <td class="border border-black bg-gray-200 font-bold p-1.5 text-xs uppercase text-gray-900">I. INTENTIONS</td>
                <td :colspan="currentPreset.parsedDays.length || 1" class="border border-black bg-gray-200 p-1.5 text-[10px] text-gray-700 italic">
                  {{ isEnglish
                    ? 'Meaningful learning experiences depend on how intentionally we design them.'
                    : 'Ang mga makabuluhang karanasan sa pagkatuto ay nakabatay sa kung paano natin ito binabalangkas.' }}
                </td>
              </tr>

              <!-- Session Headers for Intentions -->
              <tr v-if="currentPreset.parsedDays.length > 0">
                <td class="border border-black bg-gray-100 p-1 align-top"></td>
                <td v-for="day in currentPreset.parsedDays" :key="'in_h_'+day" class="border border-black bg-gray-100 p-1 text-center font-bold uppercase text-[10px] text-gray-900">
                  {{ day }}
                </td>
              </tr>

              <!-- Kasanayang Pampagkatuto / Learning Competency -->
              <tr>
                <td class="border border-black p-2 italic align-top font-semibold bg-gray-50 text-gray-900">
                  {{ isEnglish ? 'Learning Competency:' : 'Kasanayang Pampagkatuto:' }}<br>
                  <span class="text-[9px] font-normal text-gray-600">
                    {{ isEnglish ? 'From MATATAG curriculum standards.' : 'Mula sa MATATAG kurikulum.' }}
                  </span>
                </td>
                <td :colspan="currentPreset.parsedDays.length || 1" class="border border-black p-2 align-top leading-relaxed text-gray-900">
                  <span class="font-medium text-black">
                    {{ currentPreset.competencyCode }}
                  </span>
                </td>
              </tr>

              <!-- Mga Layunin sa Pagkatuto / Objectives (Step >= 2) -->
              <tr>
                <td class="border border-black p-2 italic align-top font-semibold bg-gray-50 text-gray-900">
                  {{ isEnglish ? 'Learning Objectives:' : 'Mga Layunin sa Pagkatuto:' }}<br>
                  <span class="text-[9px] font-normal text-gray-600">Cognitive, Psychomotor, Affective</span>
                </td>
                <td v-for="(day, idx) in currentPreset.parsedDays" :key="`obj_${day}`" class="border border-black p-2 align-top">
                  <!-- Render populated objectives when step >= 2 -->
                  <div v-if="generationStep >= 2" class="space-y-1.5">
                    <div>
                      <span class="font-bold text-blue-900 block text-[10px]">Cognitive:</span>
                      <p class="text-gray-800 text-[10px] mt-0.5">
                        {{ getObjective(idx).cognitive }}
                      </p>
                    </div>
                    <div>
                      <span class="font-bold text-amber-900 block text-[10px]">Psychomotor:</span>
                      <p class="text-gray-800 text-[10px] mt-0.5">
                        {{ getObjective(idx).psychomotor }}
                      </p>
                    </div>
                    <div>
                      <span class="font-bold text-purple-900 block text-[10px]">Affective:</span>
                      <p class="text-gray-800 text-[10px] mt-0.5">
                        {{ getObjective(idx).affective }}
                      </p>
                    </div>
                  </div>
                  <!-- Skeletons when Step 1 -->
                  <div v-else class="space-y-2 py-1">
                    <div class="h-2 w-3/4 animate-pulse rounded bg-gray-200" />
                    <div class="h-2 w-4/5 animate-pulse rounded bg-gray-200" />
                    <div class="h-2 w-2/3 animate-pulse rounded bg-gray-200" />
                  </div>
                </td>
              </tr>

              <!-- Konteksto ng Mag-aaral / Learner Context -->
              <tr>
                <td class="border border-black p-2 italic align-top font-semibold bg-gray-50 text-gray-900">
                  {{ isEnglish ? 'Learner Context:' : 'Konteksto ng Mag-aaral:' }}
                </td>
                <td :colspan="currentPreset.parsedDays.length || 1" class="border border-black p-2 align-top text-[10px] text-gray-700">
                  {{ currentPreset.learnerContext }}
                </td>
              </tr>

              <!-- II. LEARNING EXPERIENCE -->
              <tr>
                <td class="border border-black bg-gray-200 font-bold p-1.5 text-xs uppercase text-gray-900">II. LEARNING EXPERIENCE</td>
                <td :colspan="currentPreset.parsedDays.length || 1" class="border border-black bg-gray-200 p-1.5 text-[10px] text-gray-700 italic">
                  {{ isEnglish
                    ? 'A learning experience is like a thoughtfully planned journey.'
                    : 'Ang isang karanasan sa pagkatuto ay parang isang pinag-isipang paglalakbay.' }}
                </td>
              </tr>

              <!-- Session Headers for Learning Experience -->
              <tr v-if="currentPreset.parsedDays.length > 0">
                <td class="border border-black bg-gray-100 p-1 align-top"></td>
                <td v-for="day in currentPreset.parsedDays" :key="'le_h_'+day" class="border border-black bg-gray-100 p-1 text-center font-bold uppercase text-[10px] text-gray-900">
                  {{ day }}
                </td>
              </tr>

              <!-- Bago ang Aralin / Before the Lesson (Step >= 3) -->
              <tr v-if="currentPreset.parsedDays.length > 0">
                <td class="border border-black p-2 italic align-top font-semibold bg-gray-50 text-gray-900">
                  {{ isEnglish ? 'Before the Lesson:' : 'Bago ang Aralin:' }}<br>
                  <span class="text-[9px] font-normal text-gray-600">
                    {{ isEnglish ? 'Preparation & review.' : 'Paghahanda at balik-aral.' }}
                  </span>
                </td>
                <td v-for="(day, idx) in currentPreset.parsedDays" :key="'pre_'+day" class="border border-black p-2 align-top text-[10px]">
                  <div v-if="generationStep >= 3" class="space-y-1">
                    <p class="font-semibold text-gray-900">
                      • {{ isEnglish ? 'Preliminary Activity & Review' : 'Panimulang Gawain & Balik-aral' }}
                    </p>
                    <p class="text-gray-700">{{ getActivity(idx).preLesson }}</p>
                  </div>
                  <div v-else class="space-y-1 py-1">
                    <div class="h-2 w-full animate-pulse rounded bg-gray-200" />
                    <div class="h-2 w-4/5 animate-pulse rounded bg-gray-200" />
                  </div>
                </td>
              </tr>

              <!-- Daloy ng Aralin / Lesson Flow (Step >= 3) -->
              <tr v-if="currentPreset.parsedDays.length > 0">
                <td class="border border-black p-2 italic align-top font-semibold bg-gray-50 text-gray-900">
                  {{ isEnglish ? 'Lesson Flow:' : 'Daloy ng Aralin:' }}<br>
                  <span class="text-[9px] font-normal text-gray-600">
                    {{ isEnglish ? 'Interactions & activities.' : 'Mga gawain at interaksyon.' }}
                  </span>
                </td>
                <td v-for="(day, idx) in currentPreset.parsedDays" :key="'flow_'+day" class="border border-black p-2 align-top text-[10px]">
                  <div v-if="generationStep >= 3" class="space-y-2">
                    <div class="border-b border-gray-200 pb-1.5">
                      <p class="font-bold text-primary">
                        • {{ isEnglish ? 'Presentation & Discussion' : 'Paglalahad at Pagtatalakay' }}
                      </p>
                      <p class="text-gray-700">
                        <span class="font-semibold">{{ isEnglish ? 'Teacher:' : 'Guro:' }}</span> {{ getActivity(idx).teacherAction }}
                      </p>
                      <p class="text-gray-700 mt-0.5">
                        <span class="font-semibold">{{ isEnglish ? 'Learners:' : 'Mag-aaral:' }}</span> {{ getActivity(idx).learnerAction }}
                      </p>
                    </div>
                    <div>
                      <p class="font-bold text-primary">
                        • {{ isEnglish ? 'Guided Practice' : 'Pinatnubayang Pagsasanay' }}
                      </p>
                      <p class="text-gray-700">
                        <span class="font-semibold">{{ isEnglish ? 'Teacher:' : 'Guro:' }}</span> {{ getActivity(idx).guidedTeacher }}
                      </p>
                      <p class="text-gray-700 mt-0.5">
                        <span class="font-semibold">{{ isEnglish ? 'Learners:' : 'Mag-aaral:' }}</span> {{ getActivity(idx).guidedLearner }}
                      </p>
                    </div>
                  </div>
                  <div v-else class="space-y-1.5 py-1">
                    <div class="h-2 w-full animate-pulse rounded bg-gray-200" />
                    <div class="h-2 w-5/6 animate-pulse rounded bg-gray-200" />
                    <div class="h-2 w-3/4 animate-pulse rounded bg-gray-200" />
                  </div>
                </td>
              </tr>

              <!-- Mga Kagamitang Panturo / Resources -->
              <tr v-if="currentPreset.parsedDays.length > 0">
                <td class="border border-black p-2 italic align-top font-semibold bg-gray-50 text-gray-900">
                  {{ isEnglish ? 'Learning Resources:' : 'Mga Kagamitang Panturo:' }}
                </td>
                <td v-for="(day, idx) in currentPreset.parsedDays" :key="'mat_'+day" class="border border-black p-2 align-top text-[10px] text-gray-700">
                  {{ getActivity(idx).materials }}
                </td>
              </tr>

              <!-- Integrasyon / Integration -->
              <tr v-if="currentPreset.parsedDays.length > 0">
                <td class="border border-black p-2 italic align-top font-semibold bg-gray-50 text-gray-900">
                  {{ isEnglish ? 'Integration:' : 'Integrasyon:' }}
                </td>
                <td v-for="(day, idx) in currentPreset.parsedDays" :key="'int_'+day" class="border border-black p-2 align-top text-[10px] text-gray-700">
                  {{ getActivity(idx).integration }}
                </td>
              </tr>

              <!-- III. ASSESSMENT -->
              <tr>
                <td class="border border-black bg-gray-200 font-bold p-1.5 text-xs uppercase text-gray-900">III. ASSESSMENT</td>
                <td :colspan="currentPreset.parsedDays.length || 1" class="border border-black bg-gray-200 p-1.5 text-[10px] text-gray-700 italic">
                  {{ isEnglish
                    ? 'Assessments reveal what learners have mastered and where they need support.'
                    : 'Ipinapakita ng mga pagtataya kung ano ang natutunan ng mga mag-aaral.' }}
                </td>
              </tr>

              <!-- Pormatibong Pagtataya / Formative Assessment (Step >= 4) -->
              <tr v-if="currentPreset.parsedDays.length > 0">
                <td class="border border-black p-2 italic align-top font-semibold bg-gray-50 text-gray-900">
                  {{ isEnglish ? 'Formative Assessment:' : 'Pormatibong Pagtataya:' }}
                </td>
                <td v-for="(day, idx) in currentPreset.parsedDays" :key="'as_'+day" class="border border-black p-2 align-top text-[10px]">
                  <div v-if="generationStep >= 4">
                    <p class="font-bold text-gray-900">
                      • {{ isEnglish ? 'Formative Evaluation Item' : 'Pormatibong Pagtataya' }}
                    </p>
                    <p class="text-gray-700 mt-0.5">{{ getAssessment(idx).formative }}</p>
                  </div>
                  <div v-else class="h-2 w-3/4 animate-pulse rounded bg-gray-200 my-1" />
                </td>
              </tr>

              <!-- IV. WAYS FORWARD -->
              <tr>
                <td class="border border-black bg-gray-200 font-bold p-1.5 text-xs uppercase text-gray-900">IV. WAYS FORWARD</td>
                <td :colspan="currentPreset.parsedDays.length || 1" class="border border-black bg-gray-200 p-1.5 text-[10px] text-gray-700 italic">
                  {{ isEnglish
                    ? 'Meaningful learning continues beyond the four walls of the classroom.'
                    : 'Ang makabuluhang pagkatuto ay maaari ring mangyari sa labas ng silid-aralan.' }}
                </td>
              </tr>

              <!-- Karagdagang Gawain / Ways Forward Content -->
              <tr>
                <td class="border border-black p-2 italic align-top font-semibold bg-gray-50 text-gray-900">
                  {{ isEnglish ? 'Remediation & Enrichment:' : 'Mga Karagdagang Gawain:' }}
                </td>
                <td :colspan="currentPreset.parsedDays.length || 1" class="border border-black p-2 text-[10px] text-gray-700">
                  {{ currentPreset.waysForward }}
                </td>
              </tr>

              <tr>
                <td :colspan="(currentPreset.parsedDays.length || 1) + 1" class="border border-black p-3 bg-gray-50">
                  <div class="flex justify-around items-center text-[10px]">
                    <div class="text-center">
                      <p class="font-bold text-left mb-4 text-gray-700">
                        {{ isEnglish ? 'Prepared by:' : 'Inihanda ni (Prepared by):' }}
                      </p>
                      <p class="font-bold underline uppercase tracking-wide text-gray-900">{{ currentPreset.teacherName }}</p>
                      <p class="text-[9px] text-gray-600 mt-0.5">Teacher</p>
                    </div>
                    <div class="text-center">
                      <p class="font-bold text-left mb-4 text-gray-700">
                        {{ isEnglish ? 'Checked by:' : 'Sinuri ni (Checked by):' }}
                      </p>
                      <p class="font-bold underline uppercase tracking-wide text-gray-900">{{ currentPreset.checkerName }}</p>
                      <p class="text-[9px] text-gray-600 mt-0.5">Master Teacher / Head Teacher</p>
                    </div>
                    <div class="text-center">
                      <p class="font-bold text-left mb-4 text-gray-700">
                        {{ isEnglish ? 'Approved by:' : 'Pinagtibay ni (Approved by):' }}
                      </p>
                      <p class="font-bold underline uppercase tracking-wide text-gray-900">{{ currentPreset.principalName }}</p>
                      <p class="text-[9px] text-gray-600 mt-0.5">School Head / Principal</p>
                    </div>
                  </div>
                </td>
              </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- RIGHT: Stepper & Progress Details -->
        <div class="flex flex-col justify-center space-y-6">
          <div class="space-y-2.5">
            <h3 class="text-2xl font-bold tracking-tight text-foreground">
              Building your Daily Lesson Log
            </h3>
            <p class="text-sm leading-relaxed text-muted-foreground">
              AI is authoring structured ILAW sections, multi-day session plans, formative assessments, and reflections in
              <strong class="text-foreground">{{ currentPreset.mediumOfInstruction }}</strong>.
            </p>
          </div>

          <!-- Progress Bar Widget -->
          <div class="space-y-2 rounded-xl border bg-muted/40 p-4">
            <div class="flex justify-between text-xs font-semibold">
              <span class="text-primary flex items-center gap-1.5">
                 Generation Progress
              </span>
              <span class="font-mono text-foreground">{{ Math.round(generationProgress) }}%</span>
            </div>
            <div class="w-full bg-muted rounded-full h-2.5 overflow-hidden">
              <div
                class="bg-primary rounded-full h-2.5 transition-all duration-300 ease-out"
                :style="{ width: `${generationProgress}%` }"
              />
            </div>
          </div>

          <!-- Step-by-Step Status List -->
          <div class="space-y-3.5 text-sm">
            <!-- Step 1 -->
            <div class="flex items-start gap-3">
              <CheckCircle2 v-if="generationStep > 1" class="size-4 text-emerald-600 mt-0.5 shrink-0" />
              <Loader2 v-else-if="generationStep === 1" class="size-4 animate-spin text-primary mt-0.5 shrink-0" />
              <span v-else class="size-4 rounded-full border border-muted-foreground/40 mt-0.5 shrink-0" />
              <div>
                <p :class="generationStep === 1 ? 'font-semibold text-foreground' : generationStep > 1 ? 'text-foreground/80' : 'text-muted-foreground/60'">
                  Aligning to {{ currentPreset.competencyCode.split(':')[0] || 'MATATAG standards' }}
                </p>
                <p class="text-xs text-muted-foreground">Integrates official DepEd competencies and prerequisites.</p>
              </div>
            </div>

            <!-- Step 2 -->
            <div class="flex items-start gap-3">
              <CheckCircle2 v-if="generationStep > 2" class="size-4 text-emerald-600 mt-0.5 shrink-0" />
              <Loader2 v-else-if="generationStep === 2" class="size-4 animate-spin text-primary mt-0.5 shrink-0" />
              <span v-else class="size-4 rounded-full border border-muted-foreground/40 mt-0.5 shrink-0" />
              <div>
                <p :class="generationStep === 2 ? 'font-semibold text-foreground' : generationStep > 2 ? 'text-foreground/80' : 'text-muted-foreground/60'">
                  Formulating Cognitive, Psychomotor &amp; Affective objectives
                </p>
                <p class="text-xs text-muted-foreground">Differentiated 3-domain goals tailored to learner context.</p>
              </div>
            </div>

            <!-- Step 3 -->
            <div class="flex items-start gap-3">
              <CheckCircle2 v-if="generationStep > 3" class="size-4 text-emerald-600 mt-0.5 shrink-0" />
              <Loader2 v-else-if="generationStep === 3" class="size-4 animate-spin text-primary mt-0.5 shrink-0" />
              <span v-else class="size-4 rounded-full border border-muted-foreground/40 mt-0.5 shrink-0" />
              <div>
                <p :class="generationStep === 3 ? 'font-semibold text-foreground' : generationStep > 3 ? 'text-foreground/80' : 'text-muted-foreground/60'">
                  Generating {{ currentPreset.sessionDuration }} learning activities &amp; flow
                </p>
                <p class="text-xs text-muted-foreground">DepEd 2-column teacher modeling &amp; learner practice flow.</p>
              </div>
            </div>

            <!-- Step 4 -->
            <div class="flex items-start gap-3">
              <CheckCircle2 v-if="generationStep > 4" class="size-4 text-emerald-600 mt-0.5 shrink-0" />
              <Loader2 v-else-if="generationStep === 4" class="size-4 animate-spin text-primary mt-0.5 shrink-0" />
              <span v-else class="size-4 rounded-full border border-muted-foreground/40 mt-0.5 shrink-0" />
              <div>
                <p :class="generationStep === 4 ? 'font-semibold text-foreground' : generationStep > 4 ? 'text-foreground/80' : 'text-muted-foreground/60'">
                  Drafting formative assessment items &amp; reflection
                </p>
                <p class="text-xs text-muted-foreground">Standardized evaluation items to gauge student mastery.</p>
              </div>
            </div>

            <!-- Step 5 -->
            <div class="flex items-start gap-3">
              <CheckCircle2 v-if="generationStep === 5 && generationProgress >= 95" class="size-4 text-emerald-600 mt-0.5 shrink-0" />
              <Loader2 v-else-if="generationStep >= 5" class="size-4 animate-spin text-primary mt-0.5 shrink-0" />
              <span v-else class="size-4 rounded-full border border-muted-foreground/40 mt-0.5 shrink-0" />
              <div>
                <p :class="generationStep >= 5 ? 'font-semibold text-foreground' : 'text-muted-foreground/60'">
                  Ready to edit DLL, download &amp; export
                </p>
                <p class="text-xs text-muted-foreground">Annex A signatories added. One click export to Word or PowerPoint.</p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  </section>
</template>
