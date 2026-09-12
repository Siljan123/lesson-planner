<script setup lang="ts">
import { ref, computed, watchEffect } from "vue"
import { useRoute, useRouter } from "vue-router"
import {
  ArrowLeft,
  Save,
  Download,
  RotateCw,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Clock,
  BookOpen,
  FileSpreadsheet,
  Presentation,
  History,
  Trash2,
  Plus,
  Loader2,
  ExternalLink,
  ChevronRight,
  Eye,
  Edit3,
  Printer,
} from "@lucide/vue"
import type { LessonPlan, LessonPlanStatus, ActivityPhase, IlawContent } from "../../../types/lesson-plan"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"

const route = useRoute()
const router = useRouter()
const planId = computed(() => route.params.id as string)

// Fetch Plan Data
const { data, refresh, pending } = useFetch<any>(() => `/api/lesson-plans/${planId.value}`, { lazy: true })
const plan = computed<LessonPlan | undefined>(() => data.value?.plan)
const versions = computed(() => data.value?.versions || [])

const { fetchPositions } = useReferenceData()
const { data: positions } = useAsyncData('positions-view', async () => {
  return (await fetchPositions()) as any[]
}, { lazy: true })

watchEffect(() => {
  if (plan.value && !plan.value.signatory) {
    plan.value.signatory = {}
  }
  if (plan.value?.content) {
    if (!plan.value.content.intentions) plan.value.content.intentions = { learning_competency: '', learning_objectives: {} }
    if (!plan.value.content.intentions.learning_objectives) plan.value.content.intentions.learning_objectives = {}
    if (!plan.value.content.intentions.learning_objectives_per_session) plan.value.content.intentions.learning_objectives_per_session = []
    if (!plan.value.content.learning_experience) plan.value.content.learning_experience = { instructional_materials: [], sessions: [] }
    if (!plan.value.content.assessing_learning) plan.value.content.assessing_learning = { formative_assessment_per_session: [] }
    if (!plan.value.content.assessing_learning.formative_assessment_per_session) plan.value.content.assessing_learning.formative_assessment_per_session = []
    if (!plan.value.content.ways_forward) plan.value.content.ways_forward = { reflection: {} }
    if (!plan.value.content.ways_forward.reflection) plan.value.content.ways_forward.reflection = {}
  }
})

// UI Local State
const activeTab = ref("editor")
const isSaving = ref(false)
const saveSuccessMessage = ref("")
const isExporting = ref(false)
const isRegeneratingSection = ref<string | null>(null)

// Regenerate Section Modal
const showRegenerateDialog = ref(false)
const targetSection = ref<string | null>(null)
const sectionCustomPrompt = ref("")

// Edit Signatories Modal
const showEditSignatoriesDialog = ref(false)
const signatoryForm = ref({
  school_name: '',
  prepared_by_name: '',
  prepared_by_position_id: '',
  checked_by_name: '',
  checked_by_position_id: '',
  checked_by_2_name: '',
  checked_by_2_position_id: '',
})

const openEditSignatories = () => {
  const sig = plan.value?.signatory || {}
  signatoryForm.value = {
    school_name: sig.school_name || '',
    prepared_by_name: sig.prepared_by_name || '',
    prepared_by_position_id: sig.prepared_by_position_id || '',
    checked_by_name: sig.checked_by_name || '',
    checked_by_position_id: sig.checked_by_position_id || '',
    checked_by_2_name: sig.checked_by_2_name || '',
    checked_by_2_position_id: sig.checked_by_2_position_id || '',
  }
  showEditSignatoriesDialog.value = true
}

const saveSignatories = async () => {
  if (!plan.value) return
  const p1 = (positions.value || []).find((p: any) => p.id === signatoryForm.value.prepared_by_position_id)
  const p2 = (positions.value || []).find((p: any) => p.id === signatoryForm.value.checked_by_position_id)
  const p3 = (positions.value || []).find((p: any) => p.id === signatoryForm.value.checked_by_2_position_id)

  plan.value.signatory = {
    ...plan.value.signatory,
    school_name: signatoryForm.value.school_name,
    prepared_by_name: signatoryForm.value.prepared_by_name,
    prepared_by_position_id: signatoryForm.value.prepared_by_position_id,
    prepared_by_position: p1 ? { name: p1.name } : plan.value.signatory?.prepared_by_position,
    checked_by_name: signatoryForm.value.checked_by_name,
    checked_by_position_id: signatoryForm.value.checked_by_position_id,
    checked_by_position: p2 ? { name: p2.name } : plan.value.signatory?.checked_by_position,
    checked_by_2_name: signatoryForm.value.checked_by_2_name,
    checked_by_2_position_id: signatoryForm.value.checked_by_2_position_id,
    checked_by_2_position: p3 ? { name: p3.name } : plan.value.signatory?.checked_by_2_position,
  }

  showEditSignatoriesDialog.value = false
  await handleSave('Signatories updated')
}

// Helper for status badge
const getStatusBadgeVariant = (status: LessonPlanStatus) => {
  switch (status) {
    case "ready":
      return "ready"
    case "needs_review":
      return "review"
    case "exported":
      return "exported"
    case "draft":
    default:
      return "draft"
  }
}

// Save changes to backend
const handleSave = async (summary = "Teacher manual edits saved") => {
  if (!plan.value) return
  isSaving.value = true
  saveSuccessMessage.value = ""

  try {
    await $fetch(`/api/lesson-plans/${planId.value}`, {
      method: "PUT",
      body: {
        ...plan.value,
        signatory: plan.value.signatory,
        change_summary: summary,
      },
    })
    saveSuccessMessage.value = "Changes saved successfully!"
    setTimeout(() => {
      saveSuccessMessage.value = ""
    }, 3000)
    await refresh()
  } catch (err: any) {
    alert(`Failed to save changes: ${err.message}`)
  } finally {
    isSaving.value = false
  }
}

const planMediumOfInstruction = computed(() => {
  if (!plan.value) return 'English'
  const medium = (plan.value as any).medium_of_instruction ||
    (plan.value.content as any)?.medium_of_instruction ||
    (plan.value.ai_use_declaration as any)?.medium_of_instruction
  if (medium) return String(medium).toLowerCase().includes('eng') ? 'English' : 'Filipino'

  // Text heuristic check
  const sample = `${plan.value.content?.intentions?.learning_competency || ''} ${plan.value.content?.intentions?.learner_context || ''}`
  const filipino = (sample.match(/\b(ang|ng|mga|sa|para|ay|at|mula|ito|kanilang|upang|bawat|aralin|pagkatuto)\b/gi) || []).length
  const english = (sample.match(/\b(the|and|to|of|in|for|with|learning|students|learners|lesson)\b/gi) || []).length
  return english >= filipino ? 'English' : 'Filipino'
})

const isEnglishPlan = computed(() => planMediumOfInstruction.value === 'English')

// Direct Export
const executeExport = async (format: "docx" | "pptx") => {
  if (!plan.value) return
  isExporting.value = true

  try {
    const lang = planMediumOfInstruction.value
    const res = await fetch(`/api/lesson-plans/${plan.value.id}/export?format=${format}&lang=${lang}`, {
      method: "GET",
    })

    if (!res.ok) throw new Error("Export request failed")

    const blob = await res.blob()
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `Lesson_Plan_${plan.value.title.replace(/[^a-z0-9_-]/gi, "_")}.${format}`
    document.body.appendChild(a)
    a.click()
    window.URL.revokeObjectURL(url)
    document.body.removeChild(a)

    await refresh()
  } catch (err: any) {
    alert(`Could not generate download file: ${err.message}`)
  } finally {
    isExporting.value = false
  }
}

// Open Single Section or Full Plan Regenerate Dialog
const openRegenerateSection = (section: string) => {
  targetSection.value = section
  sectionCustomPrompt.value = ""
  showRegenerateDialog.value = true
}

// Execute Single Section or Full Plan Regeneration
const executeRegenerateSection = async () => {
  if (!plan.value || !targetSection.value) return
  isRegeneratingSection.value = targetSection.value
  const sectionLabel = targetSection.value === 'all' ? 'entire lesson plan' : targetSection.value.replace('_', ' ')
  showRegenerateDialog.value = false

  try {
    const res = await $fetch<any>(`/api/lesson-plans/${planId.value}/regenerate`, {
      method: "POST",
      body: {
        section: targetSection.value,
        custom_instructions: sectionCustomPrompt.value.trim() || undefined,
        topic: plan.value.title || (plan.value.content as any)?.topic,
      },
    })

    if (res?.content && plan.value) {
      plan.value.content = res.content
      if (res.plan?.ai_use_declaration) plan.value.ai_use_declaration = res.plan.ai_use_declaration
      saveSuccessMessage.value = `Successfully regenerated ${sectionLabel}!`
      setTimeout(() => {
        saveSuccessMessage.value = ""
      }, 3000)
      await refresh()
    }
  } catch (err: any) {
    alert(`Failed to regenerate: ${err?.data?.message || err.message || 'Unknown error'}`)
  } finally {
    isRegeneratingSection.value = null
    targetSection.value = null
  }
}

// Removed old phase methods, adding session helpers
const normalizedSessions = computed(() => {
  if (!plan.value) return []
  if (plan.value.content.learning_experience.sessions?.length) {
    return plan.value.content.learning_experience.sessions
  }
  // Legacy mapping
  return [{
    day: "Session 1",
    phases: plan.value.content.learning_experience.phases || []
  }]
})

const getFormativeAssessment = (day: string) => {
  if (!plan.value) return null
  if (!plan.value.content.assessing_learning.formative_assessment_per_session) {
    plan.value.content.assessing_learning.formative_assessment_per_session = []
  }
  
  let assessment = plan.value.content.assessing_learning.formative_assessment_per_session.find((a: any) => a.day === day)
  if (!assessment) {
    if (plan.value.content.assessing_learning.formative_assessment && plan.value.content.assessing_learning.formative_assessment_per_session.length === 0) {
      assessment = {
        day: day,
        description: plan.value.content.assessing_learning.formative_assessment.description,
        sample_questions: plan.value.content.assessing_learning.formative_assessment.sample_questions || []
      }
    } else {
      assessment = {
        day: day,
        description: "",
        sample_questions: []
      }
    }
    plan.value.content.assessing_learning.formative_assessment_per_session.push(assessment)
  }
  return assessment
}

const getSessionObjectives = (day: string) => {
  if (!plan.value) return { day, cognitive: '', psychomotor: '', affective: '' }
  const intentions = plan.value.content.intentions
  if (!intentions.learning_objectives_per_session) intentions.learning_objectives_per_session = []
  let objectives = intentions.learning_objectives_per_session.find((item: any) => item.day === day)
  if (!objectives) {
    objectives = {
      day,
      cognitive: intentions.learning_objectives?.cognitive || '',
      psychomotor: intentions.learning_objectives?.psychomotor || '',
      affective: intentions.learning_objectives?.affective || ''
    }
    intentions.learning_objectives_per_session.push(objectives)
  }
  return objectives
}

const addPhaseToSession = (session: any) => {
  if (!session.phases) session.phases = []
  session.phases.push({ phase: 'New Phase', teacher_activity: '', learner_activity: '' })
}

const updateInstructionalMaterials = (value: unknown) => {
  if (!plan.value) return
  plan.value.content.learning_experience.instructional_materials = String(value)
    .split(";")
    .map((item) => item.trim())
    .filter(Boolean)
}

const addSession = () => {
  if (!plan.value) return
  if (!plan.value.content.learning_experience.sessions) {
    plan.value.content.learning_experience.sessions = []
  }
  const nextNum = plan.value.content.learning_experience.sessions.length + 1
  const newDay = `Day ${nextNum}`
  plan.value.content.learning_experience.sessions.push({
    day: newDay,
    pre_lesson: '',
    learning_resources: '',
    integration: '',
    phases: [
      { phase: 'Engage / Motivation', teacher_activity: '', learner_activity: '' },
      { phase: 'Explore / Presentation', teacher_activity: '', learner_activity: '' },
      { phase: 'Experience / Discussion', teacher_activity: '', learner_activity: '' },
      { phase: 'Empathize / Application', teacher_activity: '', learner_activity: '' }
    ]
  })
}

const removeSession = (index: number) => {
  if (!plan.value?.content.learning_experience.sessions) return
  if (plan.value.content.learning_experience.sessions.length <= 1) {
    alert('The lesson plan must contain at least one day/session.')
    return
  }
  const sessionDay = plan.value.content.learning_experience.sessions[index]?.day
  if (confirm(`Are you sure you want to remove ${sessionDay}?`)) {
    plan.value.content.learning_experience.sessions.splice(index, 1)
  }
}

const triggerPrint = () => {
  window.print()
}
</script>

<template>
  <div v-if="plan" class="w-full max-w-[1600px] mx-auto sm:px-4 lg:px-6 space-y-6 print:p-0 print:m-0">
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4 print:hidden">
      <div class="flex items-center gap-2">
       
      </div>

      <!-- Action Buttons -->
      <div class="flex items-center gap-2.5">
        <!-- Status Switcher -->
        <div class="flex items-center gap-1.5">
          <span class="text-xs text-muted-foreground hidden sm:inline">Status:</span>
          <select
            v-model="plan.status"
            class="h-8 text-xs font-medium w-36 rounded-md border border-input bg-background px-2 ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            @change="() => handleSave('Status updated')"
          >
            <option value="draft">AI Draft</option>
            <option value="needs_review">Needs Review</option>
            <option value="ready">Ready for Class</option>
            <option value="exported">Exported</option>
          </select>
        </div>

        <!-- Save Button -->
        <Button
          size="sm"
          variant="outline"
          :disabled="isSaving"
          class="gap-1.5"
          @click="() => handleSave()"
        >
          <Loader2 v-if="isSaving" class="size-3.5 animate-spin" />
          <Save v-else class="size-3.5 text-primary" />
          <span>{{ isSaving ? "Saving..." : "Save" }}</span>
        </Button>

        <!-- Regenerate Dropdown -->
        <DropdownMenu>
          <DropdownMenuTrigger as-child>
            <Button
              size="sm"
              variant="outline"
              :disabled="isRegeneratingSection !== null"
              class="gap-1.5 font-semibold"
            >
              <Loader2 v-if="isRegeneratingSection !== null" class="size-3.5 animate-spin" />
              <RotateCw v-else class="size-3.5 text-primary" />
              <span>Regenerate</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" class="w-56">
            <DropdownMenuItem @click="openRegenerateSection('all')">
              <Sparkles class="size-4 mr-2 text-primary" />
              <div class="flex flex-col">
                <span class="font-medium">Full Lesson Plan</span>
                <span class="text-[11px] text-muted-foreground">Re-draft all four sections</span>
              </div>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem @click="openRegenerateSection('intentions')">
              <span class="font-medium text-xs">Section I: Intentions</span>
            </DropdownMenuItem>
            <DropdownMenuItem @click="openRegenerateSection('learning_experience')">
              <span class="font-medium text-xs">Section II: Learning Experience</span>
            </DropdownMenuItem>
            <DropdownMenuItem @click="openRegenerateSection('assessing_learning')">
              <span class="font-medium text-xs">Section III: Assessment</span>
            </DropdownMenuItem>
            <DropdownMenuItem @click="openRegenerateSection('ways_forward')">
              <span class="font-medium text-xs">Section IV: Ways Forward</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <!-- Print Button -->
        <Button
          size="sm"
          variant="outline"
          class="gap-1.5 font-semibold"
          @click="triggerPrint"
        >
          <Printer class="size-3.5" />
          <span class="hidden sm:inline">Print Landscape</span>
        </Button>

        <!-- Export Dropdown - Direct export -->
        <DropdownMenu>
          <DropdownMenuTrigger as-child>
            <Button size="sm" :disabled="isExporting" class="gap-1.5 font-semibold">
              <Loader2 v-if="isExporting" class="size-3.5 animate-spin" />
              <Download v-else class="size-3.5" />
              <span>Export</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" class="w-56">
            <DropdownMenuItem @click="executeExport('docx')">
              <FileSpreadsheet class="size-4 mr-2 text-primary" />
              <div class="flex flex-col">
                <span class="font-medium">Microsoft Word (.docx)</span>
                <span class="text-[11px] text-muted-foreground">Official DepEd DLL Format</span>
              </div>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem @click="executeExport('pptx')">
              <Presentation class="size-4 mr-2 text-primary" />
              <div class="flex flex-col">
                <span class="font-medium">PowerPoint Slides (.pptx)</span>
                <span class="text-[11px] text-muted-foreground">Presentation Slides</span>
              </div>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>

    <div
      v-if="saveSuccessMessage"
      class="bg-status-ready/15 text-foreground border border-status-ready/30 px-3 py-2 rounded-md text-xs flex items-center gap-2 animate-in fade-in print:hidden"
    >
      <CheckCircle2 class="size-4 text-status-ready shrink-0" />
      <span>{{ saveSuccessMessage }}</span>
    </div>

    <!-- Landscape Document Canvas -->
    <div class="mt-4 w-full overflow-x-auto pb-8 print:overflow-visible print:p-0 print:m-0">
      <div class="bg-white text-black w-full min-w-[1100px] max-w-[1550px] mx-auto rounded-xl border border-gray-200 shadow-sm print:border-none print:shadow-none print:p-0 print:min-w-full print:rounded-none">
        

        <table class="lp-table w-full border-collapse table-fixed text-sm">
          <tr class="lp-row">
            <td class="lp-cell lp-label-cell w-[240px]">{{ isEnglishPlan ? 'Lesson Title' : 'Pangalan ng Aralin' }}</td>
            <td :colspan="normalizedSessions.length || 1" class="lp-cell lp-content-cell p-0 align-top">
              <textarea v-model="plan.title" class="w-full h-full p-3 bg-transparent border-0 resize-none focus:ring-0 focus:outline-none font-semibold text-sm text-gray-900" rows="2" />
            </td>
          </tr>
          <tr class="lp-row">
            <td class="lp-cell lp-label-cell">{{ isEnglishPlan ? 'Learning Area' : 'Asignatura' }}</td>
            <td :colspan="normalizedSessions.length || 1" class="lp-cell lp-content-cell font-medium text-gray-900">{{ plan.subject?.name || plan.subject }}</td>
          </tr>
          <tr class="lp-row">
            <td class="lp-cell lp-label-cell">{{ isEnglishPlan ? 'Prepared by' : 'Inihanda ni' }}</td>
            <td :colspan="normalizedSessions.length || 1" class="lp-cell lp-content-cell font-medium text-gray-900">{{ plan.signatory?.prepared_by_name || 'Teacher' }}</td>
          </tr>
          <tr class="lp-row">
            <td class="lp-cell lp-label-cell">{{ isEnglishPlan ? 'Grade Level & Section' : 'Baitang at Seksyon' }}</td>
            <td :colspan="normalizedSessions.length || 1" class="lp-cell lp-content-cell font-medium text-gray-900">{{ plan.grade?.label || plan.grade_level }}</td>
          </tr>
          <tr class="lp-row">
            <td class="lp-cell lp-label-cell">{{ isEnglishPlan ? 'No. of Sessions' : 'Bilang ng Araw/Sesyon' }}</td>
            <td :colspan="normalizedSessions.length || 1" class="lp-cell lp-content-cell">
              <div class="flex items-center justify-between">
                <span class="font-medium text-gray-900">{{ normalizedSessions.length }} {{ isEnglishPlan ? (normalizedSessions.length === 1 ? 'Session' : 'Sessions') : (normalizedSessions.length === 1 ? 'Sesyon' : 'mga Sesyon') }}</span>
              </div>
            </td>
          </tr>
          <tr class="lp-row">
            <td class="lp-cell lp-label-cell align-top">
              {{ isEnglishPlan ? 'Learning Resources / References' : 'Mga Sanggunian' }}
              <span class="block text-[11px] font-normal text-gray-400 mt-0.5 leading-tight">{{ isEnglishPlan ? '(books, websites, toolkits, etc.)' : '(mga aklat, website, toolkit, atbp.)' }}</span>
            </td>
            <td :colspan="normalizedSessions.length || 1" class="lp-cell lp-content-cell p-0 align-top">
              <Textarea
                :model-value="(plan.content.learning_experience.instructional_materials || []).join(', ')"
                @update:model-value="(val: string | number) => {
                  const text = String(val)
                  plan!.content.learning_experience.instructional_materials = text
                    .split(',')
                    .map(s => s.trim())
                    .filter(Boolean)
                }"
                class="w-full h-full p-3 bg-transparent border-0 resize-y focus:ring-0 focus:outline-none text-sm"
              />
            </td>
          </tr>
          <tr class="lp-row">
            <td class="lp-cell lp-label-cell align-top">
              {{ isEnglishPlan ? 'AI Use Declaration' : 'Deklarasyon ng Paggamit ng AI' }}
              <span class="block text-[11px] font-normal text-gray-400 mt-0.5 leading-tight">(DO 3, s. 2026 Annex A)</span>
            </td>
            <td :colspan="normalizedSessions.length || 1" class="lp-cell lp-content-cell text-xs text-gray-500 leading-relaxed">
              {{ isEnglishPlan
                ? `This lesson plan was prepared with the assistance of ${plan.ai_use_declaration?.tool || 'Gemini 3.6 Flash'} as a pedagogical drafting assistant.`
                : `Ang lesson plan na ito ay binuo gamit ang ${plan.ai_use_declaration?.tool || 'Gemini 3.6 Flash'} bilang pedagogical drafting assistant.`
              }}
            </td>
          </tr>

          <!-- I. INTENTIONS -->
          <tr>
            <td class="lp-section-header" :colspan="(normalizedSessions.length || 1) + 1">
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-3">
                  <span class="lp-section-badge lp-section-badge--blue">I</span>
                  <div>
                    <span class="text-[13px] font-bold text-gray-900 tracking-wide uppercase">{{ isEnglishPlan ? 'Intentions' : 'Mga Layunin' }}</span>
                    <span class="block text-[11px] font-normal text-gray-400 mt-0.5 italic">{{ isEnglishPlan ? 'Meaningful learning experiences are grounded on how we intentionally design them.' : 'Ang mga makabuluhang karanasan sa pagkatuto ay nakabatay sa kung paano natin ito binabalangkas.' }}</span>
                  </div>
                </div>
              </div>
            </td>
          </tr>

          <!-- Session Headers for Intentions -->
          <tr v-if="normalizedSessions.length > 0">
            <td class="lp-cell lp-col-header-cell"></td>
            <td v-for="(session, sIdx) in normalizedSessions" :key="'in_h_'+sIdx" class="lp-cell lp-col-header-cell text-center relative group">
              <div class="flex items-center justify-center gap-1">
                <input v-model="session.day" class="w-full bg-transparent border-0 text-center font-bold focus:ring-0 focus:outline-none uppercase p-1 text-xs tracking-widest text-gray-600" placeholder="DAY 1" />
                
              </div>
            </td>
          </tr>

          <!-- Kasanayang Pampagkatuto (Learning Competency) -->
          <tr class="lp-row">
            <td class="lp-cell lp-label-cell align-top">
              <span class="text-gray-700">{{ isEnglishPlan ? 'Learning Competency' : 'Kasanayang Pampagkatuto' }}</span>
              <span class="block text-[11px] font-normal text-gray-400 mt-0.5 leading-tight">{{ isEnglishPlan ? 'Specify the curriculum competencies targeted for this lesson.' : 'Isulat ang mga kasanayan mula sa kurikulum na ating pinupuntirya.' }}</span>
            </td>
            <td :colspan="normalizedSessions.length || 1" class="lp-cell lp-content-cell p-0 align-top">
              <Textarea v-model="plan.content.intentions.learning_competency" class="w-full h-full p-3 bg-transparent border-0 resize-y focus:ring-0 focus:outline-none text-sm" />
            </td>
          </tr>

          <!-- Mga Layunin sa Pagkatuto (Learning Objectives) -->
          <tr class="lp-row">
            <td class="lp-cell lp-label-cell align-top">
              <span class="text-gray-700">{{ isEnglishPlan ? 'Learning Objectives' : 'Mga Layunin sa Pagkatuto' }}</span>
              <span class="block text-[11px] font-normal text-gray-400 mt-0.5 leading-tight">{{ isEnglishPlan ? 'Specify discrete knowledge, skills, or attitudes to develop.' : 'Isulat ang mas maliliit na kaalaman, kasanayan, o gawain.' }}</span>
            </td>
            <td v-for="session in normalizedSessions" :key="`objective_${session.day}`" class="lp-cell lp-content-cell p-3 align-top">
              <div class="space-y-3">
                <div class="flex flex-col">
                  <label class="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1">Cognitive</label>
                  <Textarea v-model="getSessionObjectives(session.day).cognitive" class="w-full bg-gray-50/50 border border-gray-100 rounded-lg resize-y focus:ring-1 focus:ring-gray-200 focus:border-gray-200 text-sm p-2 transition-colors hover:bg-gray-50" />
                </div>
                <div class="flex flex-col">
                  <label class="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1">Psychomotor</label>
                  <Textarea v-model="getSessionObjectives(session.day).psychomotor" class="w-full bg-gray-50/50 border border-gray-100 rounded-lg resize-y focus:ring-1 focus:ring-gray-200 focus:border-gray-200 text-sm p-2 transition-colors hover:bg-gray-50" />
                </div>
                <div class="flex flex-col">
                  <label class="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1">Affective</label>
                  <Textarea v-model="getSessionObjectives(session.day).affective" class="w-full bg-gray-50/50 border border-gray-100 rounded-lg resize-y focus:ring-1 focus:ring-gray-200 focus:border-gray-200 text-sm p-2 transition-colors hover:bg-gray-50" />
                </div>
              </div>
            </td>
          </tr>

          <!-- Konteksto ng Mag-aaral -->
          <tr class="lp-row">
            <td class="lp-cell lp-label-cell align-top">
              <span class="text-gray-700">{{ isEnglishPlan ? 'Learner Context' : 'Konteksto ng Mag-aaral' }}</span>
              <span class="block text-[11px] font-normal text-gray-400 mt-0.5 leading-tight">{{ isEnglishPlan ? "Record observations about your learners' readiness and background." : 'Isulat ang iyong mga obserbasyon sa iyong mga mag-aaral.' }}</span>
            </td>
            <td :colspan="normalizedSessions.length || 1" class="lp-cell lp-content-cell p-0 align-top">
              <TableHeader v-model="plan.content.intentions.learner_context" class="w-full h-full p-3 bg-transparent border-0 resize-y focus:ring-0 focus:outline-none text-sm" :placeholder="isEnglishPlan ? 'Observations on learner readiness, behavior, and context...' : 'Obserbasyon sa kahandaan, gawi, at konteksto ng mag-aaral...'" />
            </td>
          </tr>

          <!-- II. LEARNING EXPERIENCE -->
          <tr>
            <td class="lp-section-header" :colspan="(normalizedSessions.length || 1) + 1">
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-3">
                  <span class="lp-section-badge lp-section-badge--emerald">II</span>
                  <div>
                    <span class="text-[13px] font-bold text-gray-900 tracking-wide uppercase">{{ isEnglishPlan ? 'Learning Experience' : 'Karanasan sa Pagkatuto' }}</span>
                    <span class="block text-[11px] font-normal text-gray-400 mt-0.5 italic">{{ isEnglishPlan ? 'A learning experience is like a thoughtfully planned journey.' : 'Ang isang karanasan sa pagkatuto ay parang isang pinag-isipang paglalakbay.' }}</span>
                  </div>
                </div>
              </div>
            </td>
          </tr>
          
          <!-- Session Headers for Learning Experience -->
          <tr v-if="normalizedSessions.length > 0">
            <td class="lp-cell lp-col-header-cell"></td>
            <td v-for="(session, sIdx) in normalizedSessions" :key="'le_h_'+sIdx" class="lp-cell lp-col-header-cell text-center font-bold uppercase text-xs tracking-widest text-gray-600">
              {{ session.day }}
            </td>
          </tr>

          <!-- Bago ang Aralin (Pre-Lesson) -->
          <tr v-if="normalizedSessions.length > 0" class="lp-row">
            <td class="lp-cell lp-label-cell align-top">
              <span class="text-gray-700">{{ isEnglishPlan ? 'Before the Lesson' : 'Bago ang Aralin' }}</span>
              <span class="block text-[11px] font-normal text-gray-400 mt-0.5 leading-tight">{{ isEnglishPlan ? 'Describe how you will prepare learners and activate prior knowledge.' : 'Ilarawan kung paano mo tutulungan ang mga mag-aaral na maging handa.' }}</span>
            </td>
            <td v-for="(session, sIdx) in normalizedSessions" :key="'pre_'+sIdx" class="lp-cell lp-content-cell p-0 align-top">
              <Textarea v-model="session.pre_lesson" class="w-full h-full p-3 bg-transparent border-0 resize-y focus:ring-0 focus:outline-none text-sm" :placeholder="isEnglishPlan ? 'Preparation, drill, or review...' : 'Paghahanda, drill, o balik-aral...'" />
            </td>
          </tr>

          <!-- Daloy ng Aralin (Procedures) -->
          <tr v-if="normalizedSessions.length > 0" class="lp-row">
            <td class="lp-cell lp-label-cell align-top">
              <span class="text-gray-700">{{ isEnglishPlan ? 'Lesson Flow' : 'Daloy ng Aralin' }}</span>
              <span class="block text-[11px] font-normal text-gray-400 mt-0.5 leading-tight">{{ isEnglishPlan ? 'Describe the instructional activities to be implemented across sessions.' : 'Ilarawan ang mga gawain na maaari mong ipatupad sa mga sesyon.' }}</span>
            </td>
            <td v-for="(session, sIdx) in normalizedSessions" :key="'le_d_'+sIdx" class="lp-cell lp-content-cell p-3 align-top">
              <div v-for="(phase, pIdx) in session.phases" :key="pIdx" class="mb-4 pb-3 border-b border-gray-100 last:border-0 last:pb-0 last:mb-0 relative group">
            
                <input v-model="phase.phase" class="font-semibold w-full bg-transparent border-0 focus:ring-0 focus:outline-none p-0 text-sm mb-2 text-primary" placeholder="Phase Title" />
                <div class="text-sm">
                  <span class="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Teacher</span>
                  <Textarea v-model="phase.teacher_activity" class="w-full bg-gray-50/50 border border-gray-100 rounded-lg p-2 mt-1 text-sm resize-y transition-colors hover:bg-gray-50 focus:ring-1 focus:ring-gray-200 focus:border-gray-200" placeholder="Teacher's activity..." />
                </div>
                <div class="text-sm mt-2">
                  <span class="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Learner</span>
                  <Textarea v-model="phase.learner_activity" class="w-full bg-gray-50/50 border border-gray-100 rounded-lg p-2 mt-1 text-sm resize-y transition-colors hover:bg-gray-50 focus:ring-1 focus:ring-gray-200 focus:border-gray-200" placeholder="Learner's activity..." />
                </div>
              </div>
           
            </td>
          </tr>

          <!-- Mga Kagamitang Panturo (Learning Resources) -->
          <tr v-if="normalizedSessions.length > 0" class="lp-row">
            <td class="lp-cell lp-label-cell align-top">
              <span class="text-gray-700">{{ isEnglishPlan ? 'Learning Resources' : 'Mga Kagamitang Panturo' }}</span>
              <span class="block text-[11px] font-normal text-gray-400 mt-0.5 leading-tight">{{ isEnglishPlan ? 'List instructional materials that will help achieve lesson goals.' : 'Ilista ang mga kagamitang panturo para sa sesyon.' }}</span>
            </td>
            <td v-for="(session, sIdx) in normalizedSessions" :key="'res_'+sIdx" class="lp-cell lp-content-cell p-0 align-top">
              <Textarea v-model="session.learning_resources" class="w-full h-full p-3 bg-transparent border-0 resize-y focus:ring-0 focus:outline-none text-sm" placeholder="Flashcards, visual aids, manipulatives..." />
            </td>
          </tr>

          <!-- Mga Pagkakataon para sa Integrasyon -->
          <tr v-if="normalizedSessions.length > 0" class="lp-row">
            <td class="lp-cell lp-label-cell align-top">
              <span class="text-gray-700">{{ isEnglishPlan ? 'Opportunities for Integration' : 'Mga Pagkakataon para sa Integrasyon' }}</span>
              <span class="block text-[11px] font-normal text-gray-400 mt-0.5 leading-tight">{{ isEnglishPlan ? 'Note any meaningful cross-curricular connections with other subject areas.' : 'Posibilidad na maiugnay ang iba pang asignatura.' }}</span>
            </td>
            <td v-for="(session, sIdx) in normalizedSessions" :key="'intg_'+sIdx" class="lp-cell lp-content-cell p-0 align-top">
              <Textarea v-model="session.integration" class="w-full h-full p-3 bg-transparent border-0 resize-y focus:ring-0 focus:outline-none text-sm" :placeholder="isEnglishPlan ? 'E.g., Art, Health, Language, GMRC...' : 'Hal. Art, Health, Wika, GMRC...'" />
            </td>
          </tr>

          <!-- III. ASSESSMENT -->
          <tr>
            <td class="lp-section-header" :colspan="(normalizedSessions.length || 1) + 1">
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-3">
                  <span class="lp-section-badge lp-section-badge--amber">III</span>
                  <div>
                    <span class="text-[13px] font-bold text-gray-900 tracking-wide uppercase">{{ isEnglishPlan ? 'Assessment' : 'Pagtataya ng Pagkatuto' }}</span>
                    <span class="block text-[11px] font-normal text-gray-400 mt-0.5 italic">{{ isEnglishPlan ? 'Assessments demonstrate what learners have understood and achieved.' : 'Ipinapakita ng mga pagtataya kung ano ang natutunan ng mga mag-aaral.' }}</span>
                  </div>
                </div>
              </div>
            </td>
          </tr>

          <!-- Session Headers for Assessment -->
          <tr v-if="normalizedSessions.length > 0">
            <td class="lp-cell lp-col-header-cell"></td>
            <td v-for="(session, sIdx) in normalizedSessions" :key="'as_h_'+sIdx" class="lp-cell lp-col-header-cell text-center font-bold uppercase text-xs tracking-widest text-gray-600">
              {{ session.day }}
            </td>
          </tr>

          <!-- Pormatibong Pagtataya -->
          <tr v-if="normalizedSessions.length > 0" class="lp-row">
            <td class="lp-cell lp-label-cell align-top">
              <span class="text-gray-700">{{ isEnglishPlan ? 'Formative Assessment' : 'Pormatibong Pagtataya' }}</span>
              <span class="block text-[11px] font-normal text-gray-400 mt-0.5 leading-tight">{{ isEnglishPlan ? 'Create tasks or checks to evaluate ongoing learning and provide feedback.' : 'Lumikha ng gawain o aktibidad upang suriin ang pagkatuto at magbigay ng feedback.' }}</span>
            </td>
            <td v-for="(session, sIdx) in normalizedSessions" :key="'as_'+sIdx" class="lp-cell lp-content-cell p-3 align-top">
              <div v-if="getFormativeAssessment(session.day)">
                <Textarea v-model="getFormativeAssessment(session.day)!.description" class="w-full bg-transparent border-0 border-b border-gray-100 resize-y focus:ring-0 focus:outline-none p-1 text-sm font-medium" placeholder="Assessment Title / Description..." />
                <div class="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mt-3 mb-1.5">Sample Questions / Tasks</div>
                <Textarea :model-value="getFormativeAssessment(session.day)!.sample_questions.join('\n')" @update:model-value="(val: string | number) => getFormativeAssessment(session.day)!.sample_questions = String(val).split('\n')" class="w-full bg-gray-50/50 border border-gray-100 rounded-lg p-2 text-sm resize-y transition-colors hover:bg-gray-50 focus:ring-1 focus:ring-gray-200 focus:border-gray-200" placeholder="One question per line..." />
              </div>
            </td>
          </tr>

          <!-- IV. WAYS FORWARD -->
          <tr>
            <td class="lp-section-header" :colspan="(normalizedSessions.length || 1) + 1">
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-3">
                  <span class="lp-section-badge lp-section-badge--violet">IV</span>
                  <div>
                    <span class="text-[13px] font-bold text-gray-900 tracking-wide uppercase">{{ isEnglishPlan ? 'Ways Forward' : 'Mga Hakbang Pasulong' }}</span>
                    <span class="block text-[11px] font-normal text-gray-400 mt-0.5 italic">{{ isEnglishPlan ? 'Meaningful learning can also happen outside the classroom.' : 'Ang makabuluhang pagkatuto ay maaari ring mangyari sa labas ng silid-aralan.' }}</span>
                  </div>
                </div>
              </div>
            </td>
          </tr>

          <!-- Mga Karagdagang Gawain -->
          <tr class="lp-row">
            <td class="lp-cell lp-label-cell align-top">
              <span class="text-gray-700">{{ isEnglishPlan ? 'Additional Activities / Homework' : 'Mga Karagdagang Gawain' }}</span>
              <span class="block text-[11px] font-normal text-gray-400 mt-0.5 leading-tight">{{ isEnglishPlan ? 'Suggest enrichment, remediation, or extended home/community learning tasks.' : 'Magmungkahi ng iba pang karanasan sa pagkatuto sa labas ng silid-aralan.' }}</span>
            </td>
            <td :colspan="normalizedSessions.length || 1" class="lp-cell lp-content-cell p-0 align-top">
              <Textarea v-model="plan.content.ways_forward.extended_learning" class="w-full h-full p-3 bg-transparent border-0 resize-y focus:ring-0 focus:outline-none text-sm" :placeholder="isEnglishPlan ? 'Enrichment and home practice activities...' : 'Gawaing pampalalim sa tahanan kasama ang pamilya...'" />
            </td>
          </tr>

          <!-- Mga Pagninilay -->
          <tr class="lp-row">
            <td class="lp-cell lp-label-cell align-top">
              <span class="text-gray-700">{{ isEnglishPlan ? "Teacher's Reflection" : 'Mga Pagninilay' }}</span>
              <span class="block text-[11px] font-normal text-gray-400 mt-0.5 leading-tight">{{ isEnglishPlan ? 'Reflect on what needs to be adapted or improved for subsequent sessions.' : 'Isipin kung ano ang kailangan mong baguhin para sa susunod na sesyon.' }}</span>
            </td>
            <td :colspan="normalizedSessions.length || 1" class="lp-cell lp-content-cell p-3 align-top">
              <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <span class="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Learners at Mastery</span>
                  <Textarea v-model="plan.content.ways_forward.reflection.learners_at_mastery" class="w-full bg-gray-50/50 border border-gray-100 rounded-lg p-2 mt-1 text-xs resize-y transition-colors hover:bg-gray-50 focus:ring-1 focus:ring-gray-200 focus:border-gray-200" rows="2" />
                </div>
                <div>
                  <span class="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Requiring Remediation</span>
                  <Textarea v-model="plan.content.ways_forward.reflection.learners_requiring_remediation" class="w-full bg-gray-50/50 border border-gray-100 rounded-lg p-2 mt-1 text-xs resize-y transition-colors hover:bg-gray-50 focus:ring-1 focus:ring-gray-200 focus:border-gray-200" rows="2" />
                </div>
                <div>
                  <span class="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Effective Strategies</span>
                  <Textarea v-model="plan.content.ways_forward.reflection.effective_strategies" class="w-full bg-gray-50/50 border border-gray-100 rounded-lg p-2 mt-1 text-xs resize-y transition-colors hover:bg-gray-50 focus:ring-1 focus:ring-gray-200 focus:border-gray-200" rows="2" />
                </div>
                <div>
                  <span class="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Challenges Encountered</span>
                  <Textarea v-model="plan.content.ways_forward.reflection.challenges_encountered" class="w-full bg-gray-50/50 border border-gray-100 rounded-lg p-2 mt-1 text-xs resize-y transition-colors hover:bg-gray-50 focus:ring-1 focus:ring-gray-200 focus:border-gray-200" rows="2" />
                </div>
              </div>
            </td>
          </tr>

          <!-- V. SIGNATORIES -->
          <tr>
            <td :colspan="(normalizedSessions.length || 1) + 1" class="p-6 border-t border-gray-100 relative">
              <div class="flex items-center justify-between mb-2">
                <span class="text-xs font-semibold text-gray-400 uppercase tracking-wider">V. Signatories</span>
                <Button variant="ghost" size="sm" class="h-7 text-xs text-muted-foreground hover:text-primary gap-1" @click="openEditSignatories">
                  <Edit3 class="size-3.5" />
                  <span>Edit Signatories</span>
                </Button>
              </div>
              <div class="flex justify-around items-start mt-4 mb-4">
                <div class="text-center min-w-[180px]">
                  <p class="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-8 text-left">Prepared by:</p>
                  <p class="font-bold underline uppercase px-4 text-sm text-gray-900">{{ plan.signatory?.prepared_by_name || '_________________________' }}</p>
                  <p class="text-sm mt-1 text-gray-500">{{ plan.signatory?.prepared_by_position?.name || 'Teacher' }}</p>
                </div>
                <div class="text-center min-w-[180px]">
                  <p class="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-8 text-left">Checked by:</p>
                  <p class="font-bold underline uppercase px-4 text-sm text-gray-900">{{ plan.signatory?.checked_by_name || '_________________________' }}</p>
                  <p class="text-sm mt-1 text-gray-500">{{ plan.signatory?.checked_by_position?.name || 'Master Teacher / Head Teacher' }}</p>
                </div>
                <div v-if="plan.signatory?.checked_by_2_name" class="text-center min-w-[180px]">
                  <p class="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-8 text-left">Checked by (2):</p>
                  <p class="font-bold underline uppercase px-4 text-sm text-gray-900">{{ plan.signatory?.checked_by_2_name }}</p>
                  <p class="text-sm mt-1 text-gray-500">{{ plan.signatory?.checked_by_2_position?.name || 'School Head / Principal' }}</p>
                </div>
                <div v-else class="text-center min-w-[180px] pt-8">
                  <Button variant="outline" size="sm" class="text-xs text-muted-foreground hover:text-primary gap-1.5 border-dashed" @click="openEditSignatories">
                    <Plus class="size-3.5" />
                    <span>Add Second Checker</span>
                  </Button>
                </div>
              </div>
            </td>
          </tr>
        </table>
      </div>
    </div>

    <!-- SINGLE SECTION / FULL PLAN REGENERATE MODAL -->
    <Dialog v-model:open="showRegenerateDialog">
      <DialogContent class="max-w-md">
        <DialogHeader>
          <DialogTitle class="text-base font-bold flex items-center gap-2">
            <RotateCw class="size-4 text-primary" />
            <span>Regenerate {{ targetSection === 'all' ? 'Entire Lesson Plan' : (targetSection ? targetSection.replace('_', ' ').toUpperCase() : '') }}</span>
          </DialogTitle>
          <DialogDescription class="text-xs">
            {{ targetSection === 'all' ? 'Re-prompt the AI to draft all four sections under the MATATAG & ILAW curriculum framework.' : 'Re-prompt the AI to draft this specific section without altering the rest of your lesson plan.' }}
          </DialogDescription>
        </DialogHeader>

        <div class="space-y-3 my-2 pb-4 text-xs">
          <div class="space-y-1.5 pb-4">
            <label class="font-semibold text-foreground">Custom Instructions</label>
            <Textarea
              v-model="sectionCustomPrompt"
              class="text-xs resize-none mt-4"
            />
          </div>
        </div>

        <DialogFooter class="gap-2 sm:gap-4">
          <Button variant="outline" size="sm" @click="showRegenerateDialog = false">
            Cancel
          </Button>
          <Button size="sm" class="gap-1.5 font-semibold" @click="executeRegenerateSection">
            <span>Regenerate</span>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <!-- EDIT SIGNATORIES MODAL -->
    <Dialog v-model:open="showEditSignatoriesDialog">
      <DialogContent class="max-w-md">
        <DialogHeader>
          <DialogTitle class="text-base font-bold flex items-center gap-2">
            <Edit3 class="size-4 text-primary" />
            <span>Edit Signatories</span>
          </DialogTitle>
          <DialogDescription class="text-xs">
            Update teachers and reviewers assigned to this lesson plan.
          </DialogDescription>
        </DialogHeader>

        <div class="space-y-4 my-2 text-xs">
          <!-- Prepared By -->
          <div class="space-y-2 p-3 bg-muted/40 rounded-lg border border-border/50">
            <p class="font-semibold text-foreground text-xs uppercase tracking-wider">Prepared By</p>
            <div class="space-y-1">
              <Label class="text-[11px] text-muted-foreground">Name</Label>
              <Input v-model="signatoryForm.prepared_by_name" placeholder="Teacher name" class="h-8 text-xs" />
            </div>
            <div class="space-y-1">
              <Label class="text-[11px] text-muted-foreground">Position</Label>
              <Select v-model="signatoryForm.prepared_by_position_id">
                <SelectTrigger class="h-8 text-xs">
                  <SelectValue placeholder="Select position" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem v-for="pos in positions || []" :key="pos.id" :value="pos.id">
                    {{ pos.name }}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <!-- Checked By 1 -->
          <div class="space-y-2 p-3 bg-muted/40 rounded-lg border border-border/50">
            <p class="font-semibold text-foreground text-xs uppercase tracking-wider">Checked By (1)</p>
            <div class="space-y-1">
              <Label class="text-[11px] text-muted-foreground">Name</Label>
              <Input v-model="signatoryForm.checked_by_name" placeholder="First checker name" class="h-8 text-xs" />
            </div>
            <div class="space-y-1">
              <Label class="text-[11px] text-muted-foreground">Position</Label>
              <Select v-model="signatoryForm.checked_by_position_id">
                <SelectTrigger class="h-8 text-xs">
                  <SelectValue placeholder="Select position" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem v-for="pos in positions || []" :key="pos.id" :value="pos.id">
                    {{ pos.name }}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <!-- Checked By 2 -->
          <div class="space-y-2 p-3 bg-muted/40 rounded-lg border border-border/50">
            <div class="flex items-center justify-between">
              <p class="font-semibold text-foreground text-xs uppercase tracking-wider">Checked By (2)</p>
              <span class="text-[10px] text-muted-foreground">Optional</span>
            </div>
            <div class="space-y-1">
              <Label class="text-[11px] text-muted-foreground">Name</Label>
              <Input v-model="signatoryForm.checked_by_2_name" placeholder="Second checker name (e.g. Principal)" class="h-8 text-xs" />
            </div>
            <div class="space-y-1">
              <Label class="text-[11px] text-muted-foreground">Position</Label>
              <Select v-model="signatoryForm.checked_by_2_position_id">
                <SelectTrigger class="h-8 text-xs">
                  <SelectValue placeholder="Select position" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem v-for="pos in positions || []" :key="pos.id" :value="pos.id">
                    {{ pos.name }}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <DialogFooter class="gap-2 sm:gap-4">
          <Button variant="outline" size="sm" @click="showEditSignatoriesDialog = false">
            Cancel
          </Button>
          <Button size="sm" class="font-semibold" @click="saveSignatories">
            Save Signatories
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>
</template>

<style>
/* ─── Modern Clean Table Design ─── */
.lp-table {
  font-family: -apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', sans-serif;
}

.lp-cell {
  border-bottom: 1px solid #f0f0f0;
  border-right: 1px solid #f0f0f0;
  padding: 12px 16px;
}

.lp-cell:last-child {
  border-right: none;
}

.lp-label-cell {
  font-weight: 600;
  font-size: 13px;
  color: #374151;
  background-color: #fafafa;
  vertical-align: top;
}

.lp-content-cell {
  color: #4b5563;
  font-size: 13px;
}

.lp-row {
  transition: background-color 0.15s ease;
}

.lp-row:hover {
  background-color: #fafbfc;
}

.lp-col-header-cell {
  background-color: #f9fafb;
  border-bottom: 1px solid #e5e7eb;
  border-right: 1px solid #f0f0f0;
  padding: 10px 16px;
  font-size: 12px;
  color: #6b7280;
}

.lp-col-header-cell:last-child {
  border-right: none;
}

/* ─── Section Headers ─── */
.lp-section-header {
  background: linear-gradient(to right, #f8fafc, #ffffff);
  border-bottom: 1px solid #e5e7eb;
  border-top: 2px solid #e5e7eb;
  padding: 14px 20px;
}

.lp-section-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 700;
  flex-shrink: 0;
}

.lp-section-badge--blue {
  background-color: #eff6ff;
  color: #2563eb;
}

.lp-section-badge--emerald {
  background-color: #ecfdf5;
  color: #059669;
}

.lp-section-badge--amber {
  background-color: #fffbeb;
  color: #d97706;
}

.lp-section-badge--violet {
  background-color: #f5f3ff;
  color: #7c3aed;
}

/* ─── First and last row rounding ─── */
.lp-table tr:first-child td:first-child {
  border-top-left-radius: 12px;
}

.lp-table tr:first-child td:last-child {
  border-top-right-radius: 12px;
}

.lp-table tr:last-child td:first-child {
  border-bottom-left-radius: 12px;
}

.lp-table tr:last-child td:last-child {
  border-bottom-right-radius: 12px;
}

/* ─── Textarea focus within table ─── */
.lp-table textarea:focus,
.lp-table input:focus {
  background-color: #fafbfc;
}

/* ─── Print overrides ─── */
@media print {
  @page {
    size: landscape;
    margin: 10mm;
  }

  .lp-section-header {
    background: #f3f4f6 !important;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }

  .lp-section-badge {
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }

  .lp-label-cell {
    background-color: #fafafa !important;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }

  .lp-row:hover {
    background-color: transparent;
  }

  .lp-cell {
    border-bottom: 1px solid #d1d5db;
    border-right: 1px solid #d1d5db;
  }

  .lp-table {
    border: 1px solid #d1d5db;
  }
}
</style>
