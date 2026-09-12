<script setup lang="ts">
import {
  FileText,
  Sparkles,
  CheckCircle2,
  Loader2,
  WandSparkles
} from '@lucide/vue'

defineProps<{
  form: {
    title: string
    subject_id: string
    grade_level_id: string
    term: string
    medium_of_instruction: string
    matatag_competency_code: string
    topic: string
    content_standard: string
    performance_standard: string
    session_duration: string
    school_name: string
    prepared_by_name: string
    prepared_by_position_id: string
    checked_by_name: string
    checked_by_position_id: string
    checked_by_2_name?: string
    checked_by_2_position_id?: string
  }
  selectedSubjectName: string
  selectedGradeLabel: string
  resolvedSessionDuration: string
  parsedDays: string[]
  generationStep: number
  generationProgress: number
}>()
</script>

<template>
  <div class="mt-8 grid min-h-160 gap-8 lg:grid-cols-[1.15fr_.85fr]">
    <!-- LEFT: Official DepEd DLL Document Table Template Preview -->
    <div class="rounded-md border flex flex-col min-h-160">
      <div class="flex-1 overflow-auto rounded-md border bg-white p-5 text-black font-serif max-h-160">

        <table class="w-full border-collapse border border-black table-fixed text-[11px] leading-tight">
          <tr>
            <td class="border border-black p-2 w-40 font-bold bg-gray-50">Pangalan ng Aralin</td>
            <td :colspan="parsedDays.length || 1" class="border border-black p-2 font-bold text-xs">
              {{ form.title || 'Untitled Lesson Plan' }}
            </td>
          </tr>
          <!-- Asignatura -->
          <tr>
            <td class="border border-black p-2 font-bold bg-gray-50">Asignatura</td>
            <td :colspan="parsedDays.length || 1" class="border border-black p-2 font-semibold">
              {{ selectedSubjectName }} ({{ form.medium_of_instruction }})
            </td>
          </tr>
          <!-- Inihanda ni -->
          <tr>
            <td class="border border-black p-2 font-bold bg-gray-50">Inihanda ni</td>
            <td :colspan="parsedDays.length || 1" class="border border-black p-2">
              {{ form.prepared_by_name || 'Teacher' }}
            </td>
          </tr>
          <!-- Baitang at Seksyon -->
          <tr>
            <td class="border border-black p-2 font-bold bg-gray-50">Baitang at Seksyon</td>
            <td :colspan="parsedDays.length || 1" class="border border-black p-2">
              {{ selectedGradeLabel }}
            </td>
          </tr>
          <!-- Bilang ng Araw/Sesyon -->
          <tr>
            <td class="border border-black p-2 font-bold bg-gray-50">Bilang ng Araw/Sesyon</td>
            <td :colspan="parsedDays.length || 1" class="border border-black p-2">
              {{ resolvedSessionDuration }} ({{ parsedDays.length }} {{ parsedDays.length === 1 ? 'Sesyon' : 'mga Sesyon' }})
            </td>
          </tr>
          <!-- Mga Sanggunian -->
          <tr>
            <td class="border border-black p-2 font-bold bg-gray-50 align-top">
              Mga Sanggunian<br>
              <span class="text-[9px] font-normal text-gray-600">(mga aklat, website, toolkit, atbp.)</span>
            </td>
            <td :colspan="parsedDays.length || 1" class="border border-black p-2 text-gray-700">
              DepEd MATATAG Curriculum Guide, Lesson Exemplars, Learning Activity Sheets (LAS)
            </td>
          </tr>
          <!-- Deklarasyon ng Paggamit ng AI -->
          <tr>
            <td class="border border-black p-2 font-bold bg-gray-50 align-top">
              Deklarasyon ng Paggamit ng AI<br>
              <span class="text-[9px] font-normal text-gray-600">(DO 3, s. 2026 Annex A)</span>
            </td>
            <td :colspan="parsedDays.length || 1" class="border border-black p-2 text-[10px] text-gray-700 italic">
              Ang lesson plan na ito ay binuo sa tulong ng AI bilang pedagogical drafting assistant batay sa DepEd Order No. 3, s. 2026.
            </td>
          </tr>

          <!-- I. INTENTIONS -->
          <tr>
            <td class="border border-black bg-gray-200 font-bold p-1.5 text-xs uppercase">INTENTIONS</td>
            <td :colspan="parsedDays.length || 1" class="border border-black bg-gray-200 p-1.5 text-[10px] text-gray-700 italic">
              Ang mga makabuluhang karanasan sa pagkatuto ay nakabatay sa kung paano natin ito binabalangkas.
            </td>
          </tr>

          <!-- Session Headers for Intentions -->
          <tr v-if="parsedDays.length > 0">
            <td class="border border-black bg-gray-100 p-1 align-top"></td>
            <td v-for="day in parsedDays" :key="'in_h_'+day" class="border border-black bg-gray-100 p-1 text-center font-bold uppercase text-[10px]">
              {{ day }}
            </td>
          </tr>

          <!-- Kasanayang Pampagkatuto -->
          <tr>
            <td class="border border-black p-2 italic align-top font-semibold bg-gray-50">
              Kasanayang Pampagkatuto:<br>
              <span class="text-[9px] font-normal text-gray-600">Isulat ang mga kasanayan mula sa kurikulum.</span>
            </td>
            <td :colspan="parsedDays.length || 1" class="border border-black p-2 align-top leading-relaxed">
              <span class="font-medium text-black">
                {{ form.matatag_competency_code || 'Nilalayon na maunawaan at maipamalas ang mga batayang kasanayan ayon sa MATATAG curriculum standards.' }}
              </span>
            </td>
          </tr>

          <!-- Mga Layunin sa Pagkatuto -->
          <tr>
            <td class="border border-black p-2 italic align-top font-semibold bg-gray-50">
              Mga Layunin sa Pagkatuto:<br>
              <span class="text-[9px] font-normal text-gray-600">Mas maliliit na kaalaman, kasanayan, o gawain.</span>
            </td>
            <td v-for="day in parsedDays" :key="`obj_${day}`" class="border border-black p-2 align-top">
              <div class="space-y-1.5">
                <div>
                  <span class="font-bold text-blue-900 block text-[10px]">Cognitive:</span>
                  <p v-if="generationStep >= 2" class="text-gray-800 text-[10px] mt-0.5">
                    Natutukoy at naipaliliwanag ang mga mahahalagang konsepto sa {{ form.topic || form.title || 'aralin' }}.
                  </p>
                  <div v-else class="h-2 w-3/4 animate-pulse rounded bg-gray-200 mt-1" />
                </div>
                <div>
                  <span class="font-bold text-amber-900 block text-[10px]">Psychomotor:</span>
                  <p v-if="generationStep >= 2" class="text-gray-800 text-[10px] mt-0.5">
                    Naisasagawa ang mga tiyak na gawain at pagsasanay gamit ang angkop na kagamitan.
                  </p>
                  <div v-else class="h-2 w-4/5 animate-pulse rounded bg-gray-200 mt-1" />
                </div>
                <div>
                  <span class="font-bold text-purple-900 block text-[10px]">Affective:</span>
                  <p v-if="generationStep >= 2" class="text-gray-800 text-[10px] mt-0.5">
                    Naipamamalas ang pagpapahalaga at aktibong pakikilahok sa mga pangkatang gawain.
                  </p>
                  <div v-else class="h-2 w-2/3 animate-pulse rounded bg-gray-200 mt-1" />
                </div>
              </div>
            </td>
          </tr>

          <!-- Konteksto ng Mag-aaral -->
          <tr>
            <td class="border border-black p-2 italic align-top font-semibold bg-gray-50">
              Konteksto ng Mag-aaral:<br>
              <span class="text-[9px] font-normal text-gray-600">Obserbasyon sa mga mag-aaral.</span>
            </td>
            <td :colspan="parsedDays.length || 1" class="border border-black p-2 align-top text-[10px] text-gray-700">
              Ang mga mag-aaral ay aktibong nakikilahok sa pamamagitan ng visual at interactive na mga kagamitan na angkop sa {{ selectedGradeLabel }}.
            </td>
          </tr>

          <!-- II. LEARNING EXPERIENCE -->
          <tr>
            <td class="border border-black bg-gray-200 font-bold p-1.5 text-xs uppercase">LEARNING EXPERIENCE</td>
            <td :colspan="parsedDays.length || 1" class="border border-black bg-gray-200 p-1.5 text-[10px] text-gray-700 italic">
              Ang isang karanasan sa pagkatuto ay parang isang pinag-isipang paglalakbay.
            </td>
          </tr>

          <!-- Session Headers for Learning Experience -->
          <tr v-if="parsedDays.length > 0">
            <td class="border border-black bg-gray-100 p-1 align-top"></td>
            <td v-for="day in parsedDays" :key="'le_h_'+day" class="border border-black bg-gray-100 p-1 text-center font-bold uppercase text-[10px]">
              {{ day }}
            </td>
          </tr>

          <!-- Bago ang Aralin -->
          <tr v-if="parsedDays.length > 0">
            <td class="border border-black p-2 italic align-top font-semibold bg-gray-50">
              Bago ang Aralin:<br>
              <span class="text-[9px] font-normal text-gray-600">Paghahanda at balik-aral.</span>
            </td>
            <td v-for="day in parsedDays" :key="'pre_'+day" class="border border-black p-2 align-top text-[10px]">
              <div v-if="generationStep >= 3" class="space-y-1">
                <p class="font-semibold text-gray-900">• Panimulang Gawain & Balik-aral</p>
                <p class="text-gray-700">Maikling pagganyak at pag-uugnay ng dating kaalaman sa {{ form.topic || form.title || 'bagong aralin' }}.</p>
              </div>
              <div v-else class="space-y-1 py-1">
                <div class="h-2 w-full animate-pulse rounded bg-gray-200" />
                <div class="h-2 w-4/5 animate-pulse rounded bg-gray-200" />
              </div>
            </td>
          </tr>

          <!-- Daloy ng Aralin -->
          <tr v-if="parsedDays.length > 0">
            <td class="border border-black p-2 italic align-top font-semibold bg-gray-50">
              Daloy ng Aralin:<br>
              <span class="text-[9px] font-normal text-gray-600">Mga gawain at interaksyon.</span>
            </td>
            <td v-for="day in parsedDays" :key="'flow_'+day" class="border border-black p-2 align-top text-[10px]">
              <div v-if="generationStep >= 3" class="space-y-2">
                <div class="border-b border-gray-200 pb-1">
                  <p class="font-bold text-primary">• Paglalahad at Pagtatalakay</p>
                  <p class="text-gray-700"><span class="font-semibold">Guro:</span> Pagpapaliwanag at pagmomodelo ng konsepto.</p>
                  <p class="text-gray-700"><span class="font-semibold">Mag-aaral:</span> Pakikinig, pagsagot sa mga tanong, at obserbasyon.</p>
                </div>
                <div>
                  <p class="font-bold text-primary">• Pinatnubayang Pagsasanay</p>
                  <p class="text-gray-700"><span class="font-semibold">Guro:</span> Pagsubaybay at pagbibigay ng gabay sa klase.</p>
                  <p class="text-gray-700"><span class="font-semibold">Mag-aaral:</span> Pagsasagawa ng pangkatang gawain kaugnay ng paksa.</p>
                </div>
              </div>
              <div v-else class="space-y-1.5 py-1">
                <div class="h-2 w-full animate-pulse rounded bg-gray-200" />
                <div class="h-2 w-5/6 animate-pulse rounded bg-gray-200" />
                <div class="h-2 w-3/4 animate-pulse rounded bg-gray-200" />
              </div>
            </td>
          </tr>

          <!-- Mga Kagamitang Panturo -->
          <tr v-if="parsedDays.length > 0">
            <td class="border border-black p-2 italic align-top font-semibold bg-gray-50">
              Mga Kagamitang Panturo:
            </td>
            <td v-for="day in parsedDays" :key="'mat_'+day" class="border border-black p-2 align-top text-[10px] text-gray-700">
              Tsart, mga larawan, activity sheets, at visual aids para sa {{ selectedSubjectName }}.
            </td>
          </tr>

          <!-- Integrasyon -->
          <tr v-if="parsedDays.length > 0">
            <td class="border border-black p-2 italic align-top font-semibold bg-gray-50">
              Integrasyon:
            </td>
            <td v-for="day in parsedDays" :key="'int_'+day" class="border border-black p-2 align-top text-[10px] text-gray-700">
              Wika, Edukasyon sa Pagpapakatao (GMRC), at Pang-araw-araw na Karanasan.
            </td>
          </tr>

          <!-- III. ASSESSMENT -->
          <tr>
            <td class="border border-black bg-gray-200 font-bold p-1.5 text-xs uppercase">ASSESSMENT</td>
            <td :colspan="parsedDays.length || 1" class="border border-black bg-gray-200 p-1.5 text-[10px] text-gray-700 italic">
              Ipinapakita ng mga pagtataya kung ano ang natutunan ng mga mag-aaral.
            </td>
          </tr>

          <!-- Pormatibong Pagtataya -->
          <tr v-if="parsedDays.length > 0">
            <td class="border border-black p-2 italic align-top font-semibold bg-gray-50">
              Pormatibong Pagtataya:
            </td>
            <td v-for="day in parsedDays" :key="'as_'+day" class="border border-black p-2 align-top text-[10px]">
              <div v-if="generationStep >= 4">
                <p class="font-bold text-gray-900">• Formative Evaluation</p>
                <p class="text-gray-700 mt-0.5">Maikling pagtataya upang masukat ang masteri sa {{ form.title || 'aralin' }}.</p>
              </div>
              <div v-else class="h-2 w-3/4 animate-pulse rounded bg-gray-200 my-1" />
            </td>
          </tr>

          <!-- IV. WAYS FORWARD -->
          <tr>
            <td class="border border-black bg-gray-200 font-bold p-1.5 text-xs uppercase">WAYS FORWARD</td>
            <td :colspan="parsedDays.length || 1" class="border border-black bg-gray-200 p-1.5 text-[10px] text-gray-700 italic">
              Ang makabuluhang pagkatuto ay maaari ring mangyari sa labas ng silid-aralan.
            </td>
          </tr>

          <!-- Mga Karagdagang Gawain -->
          <tr>
            <td class="border border-black p-2 italic align-top font-semibold bg-gray-50">
              Mga Karagdagang Gawain:
            </td>
            <td :colspan="parsedDays.length || 1" class="border border-black p-2 text-[10px] text-gray-700">
              Gawaing pampalalim sa tahanan kasama ang magulang o tagapangalaga.
            </td>
          </tr>

          <!-- Signatories Row -->
          <tr>
            <td :colspan="(parsedDays.length || 1) + 1" class="border border-black p-4 bg-gray-50">
              <div class="flex justify-around items-center text-[10px]">
                <div class="text-center">
                  <p class="font-bold text-left mb-6 text-gray-700">Inihanda ni (Prepared by):</p>
                  <p class="font-bold underline uppercase tracking-wide">{{ form.prepared_by_name || '_________________________' }}</p>
                  <p class="text-[9px] text-gray-600 mt-0.5">Teacher</p>
                </div>
                <div class="text-center">
                  <p class="font-bold text-left mb-6 text-gray-700">Sinuri ni (Checked by):</p>
                  <p class="font-bold underline uppercase tracking-wide">{{ form.checked_by_name || '_________________________' }}</p>
                  <p class="text-[9px] text-gray-600 mt-0.5">Master Teacher / Head Teacher</p>
                </div>
                <div v-if="form.checked_by_2_name" class="text-center">
                  <p class="font-bold text-left mb-6 text-gray-700">Sinuri ni (Checked by 2):</p>
                  <p class="font-bold underline uppercase tracking-wide">{{ form.checked_by_2_name }}</p>
                  <p class="text-[9px] text-gray-600 mt-0.5">School Head / Principal</p>
                </div>
              </div>
            </td>
          </tr>
        </table>
      </div>
    </div>

    <!-- RIGHT: Stepper & Progress Details -->
    <div class="flex flex-col justify-center space-y-6">
      <div class="space-y-3">
      
        <h3 class="text-2xl font-bold tracking-tight text-foreground">
          Building your Daily Lesson Log
        </h3>
        <p class="text-sm leading-relaxed text-muted-foreground">
          AI is authoring structured ILAW sections, session plans, formative assessments, and reflections in
          <strong class="text-foreground">{{ form.medium_of_instruction }}</strong>.
        </p>
      </div>

      <!-- Progress Bar -->
      <div class="space-y-2 rounded-xl border bg-muted/30 p-4">
        <div class="flex justify-between text-xs font-semibold">
          <span class="text-primary flex items-center gap-1.5">
            <Sparkles class="size-3.5" /> Generation Progress
          </span>
          <span>{{ generationProgress }}%</span>
        </div>
        <div class="w-full bg-muted rounded-full h-2 overflow-hidden">
          <div
            class="bg-primary rounded-full h-2 transition-all duration-500 ease-out"
            :style="{ width: `${generationProgress}%` }"
          />
        </div>
      </div>

      <!-- Step-by-Step Status List -->
      <div class="space-y-3 text-sm">
        <!-- Step 1 -->
        <div class="flex items-center gap-3">
          <CheckCircle2 v-if="generationStep > 1" class="size-4 text-green-600 shrink-0" />
          <Loader2 v-else-if="generationStep === 1" class="size-4 animate-spin text-primary shrink-0" />
          <span v-else class="size-4 rounded-full border shrink-0" />
          <span :class="generationStep === 1 ? 'font-semibold text-foreground' : generationStep > 1 ? 'text-muted-foreground' : 'text-muted-foreground/70'">
            Aligning to {{ form.matatag_competency_code || 'curriculum standards' }}
          </span>
        </div>

        <!-- Step 2 -->
        <div class="flex items-center gap-3">
          <CheckCircle2 v-if="generationStep > 2" class="size-4 text-green-600 shrink-0" />
          <Loader2 v-else-if="generationStep === 2" class="size-4 animate-spin text-primary shrink-0" />
          <span v-else class="size-4 rounded-full border shrink-0" />
          <span :class="generationStep === 2 ? 'font-semibold text-foreground' : generationStep > 2 ? 'text-muted-foreground' : 'text-muted-foreground/70'">
            Formulating Cognitive, Psychomotor & Affective objectives
          </span>
        </div>

        <!-- Step 3 -->
        <div class="flex items-center gap-3">
          <CheckCircle2 v-if="generationStep > 3" class="size-4 text-green-600 shrink-0" />
          <Loader2 v-else-if="generationStep === 3" class="size-4 animate-spin text-primary shrink-0" />
          <span v-else class="size-4 rounded-full border shrink-0" />
          <span :class="generationStep === 3 ? 'font-semibold text-foreground' : generationStep > 3 ? 'text-muted-foreground' : 'text-muted-foreground/70'">
            Generating {{ resolvedSessionDuration }} learning activities & teacher-learner flow
          </span>
        </div>

        <!-- Step 4 -->
        <div class="flex items-center gap-3">
          <CheckCircle2 v-if="generationStep > 4" class="size-4 text-green-600 shrink-0" />
          <Loader2 v-else-if="generationStep === 4" class="size-4 animate-spin text-primary shrink-0" />
          <span v-else class="size-4 rounded-full border shrink-0" />
          <span :class="generationStep === 4 ? 'font-semibold text-foreground' : generationStep > 4 ? 'text-muted-foreground' : 'text-muted-foreground/70'">
            Drafting formative assessment items & reflection questions
          </span>
        </div>

        <!-- Step 5 -->
        <div class="flex items-center gap-3">
          <CheckCircle2 v-if="generationStep === 5 && generationProgress === 100" class="size-4 text-green-600 shrink-0" />
          <Loader2 v-else-if="generationStep >= 5" class="size-4 animate-spin text-primary shrink-0" />
          <span v-else class="size-4 rounded-full border shrink-0" />
          <span :class="generationStep >= 5 ? 'font-semibold text-foreground' : 'text-muted-foreground/70'">
            Preparing ready-to-edit DLL and redirecting
          </span>
        </div>
      </div>
    </div>
  </div>
</template>
