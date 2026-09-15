<script setup lang="ts">
import { ref } from 'vue'
import type { Worksheet } from '~/types/worksheet'
import { Badge } from '@/components/ui/badge'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { CheckCircle2, Eye, EyeOff, FileText, HelpCircle, BookOpen } from '@lucide/vue'
import { Button } from '@/components/ui/button'

const props = defineProps<{
  worksheet: Worksheet
  showAnswerKeyInitial?: boolean
}>()

const showAnswerKey = ref(props.showAnswerKeyInitial ?? false)
const content = computed(() => props.worksheet?.content || ({} as any))
const sections = computed(() => content.value?.sections || [])
const answerKey = computed(() => content.value?.answer_key || [])
const rubric = computed(() => content.value?.rubric || [])
</script>

<template>
  <div class="worksheet-paper bg-background text-foreground space-y-6">
    <!-- Student Header Box (Classroom Style) -->
    <div class="border rounded-lg p-5 bg-card/60 shadow-xs print:border-black print:p-3">
      <div class="text-center pb-4 mb-4 border-b border-dashed print:border-black">
        <h2 class="text-xl font-bold tracking-tight text-primary uppercase print:text-black">
          {{ content.title || worksheet.title }}
        </h2>
        <p class="text-xs text-muted-foreground mt-1 print:text-black">
          {{ worksheet.subject?.name }} • {{ worksheet.grade?.label }} • Term {{ worksheet.term }}
        </p>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm print:grid-cols-2">
        <div class="space-y-3">
          <div class="flex items-center gap-2">
            <span class="font-semibold whitespace-nowrap text-muted-foreground print:text-black">Learner Name:</span>
            <div class="border-b border-muted-foreground/50 grow h-5 print:border-black"></div>
          </div>
          <div class="flex items-center gap-2">
            <span class="font-semibold whitespace-nowrap text-muted-foreground print:text-black">Grade & Section:</span>
            <div class="border-b border-muted-foreground/50 grow h-5 print:border-black">
              <span class="text-xs text-foreground/80 pl-1">{{ worksheet.grade?.label }}</span>
            </div>
          </div>
        </div>

        <div class="space-y-3">
          <div class="flex items-center gap-2">
            <span class="font-semibold whitespace-nowrap text-muted-foreground print:text-black">Date:</span>
            <div class="border-b border-muted-foreground/50 grow h-5 print:border-black"></div>
          </div>
          <div class="flex items-center gap-2">
            <span class="font-semibold whitespace-nowrap text-muted-foreground print:text-black">Score:</span>
            <div class="border-b border-muted-foreground/50 grow h-5 print:border-black flex justify-end pr-2 text-xs font-mono text-muted-foreground">
              / _____
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- General Instructions -->
    <div v-if="content.instructions" class="p-4 rounded-lg bg-muted/40 border text-sm print:border-black">
      <span class="font-semibold text-primary uppercase tracking-wide text-xs block mb-1 print:text-black">
        General Instructions:
      </span>
      <p class="text-muted-foreground leading-relaxed print:text-black">
        {{ content.instructions }}
      </p>
    </div>

    <!-- Worksheet Sections -->
    <div class="space-y-6">
      <div
        v-for="(section, sIdx) in sections"
        :key="section.id || sIdx"
        class="border rounded-lg overflow-hidden bg-card shadow-xs print:border-black print:break-inside-avoid"
      >
        <div class="bg-muted/60 px-5 py-3 border-b flex items-center justify-between print:bg-transparent print:border-black">
          <div>
            <h3 class="font-semibold text-base text-foreground tracking-tight print:text-black">
              {{ section.title }}
            </h3>
            <p v-if="section.instructions" class="text-xs text-muted-foreground italic mt-0.5 print:text-black">
              {{ section.instructions }}
            </p>
          </div>
          <Badge variant="outline" class="text-xs print:hidden">
            {{ section.items?.length || 0 }} Items
          </Badge>
        </div>

        <div class="p-5 divide-y divide-border/60">
          <div
            v-for="(item, iIdx) in section.items"
            :key="item.id || iIdx"
            class="py-4 first:pt-0 last:pb-0 space-y-2.5 print:break-inside-avoid"
          >
            <!-- Question prompt -->
            <div class="flex items-start gap-2.5">
              <span class="font-bold text-sm text-primary min-w-[24px] print:text-black">
                {{ item.item_number || iIdx + 1 }}.
              </span>
              <div class="grow">
                <span class="text-sm font-medium text-foreground leading-relaxed print:text-black">
                  {{ item.question }}
                </span>
                <span v-if="item.points" class="ml-1.5 text-xs text-muted-foreground print:text-black">
                  ({{ item.points }} {{ item.points === 1 ? 'pt' : 'pts' }})
                </span>
              </div>
            </div>

            <!-- Multiple Choice Options -->
            <div
              v-if="item.type === 'multiple_choice' && item.options?.length"
              class="grid grid-cols-1 sm:grid-cols-2 gap-2 pl-7 pt-1 print:grid-cols-2"
            >
              <div
                v-for="(opt, oIdx) in item.options"
                :key="oIdx"
                class="flex items-center gap-2 p-2 rounded-md border border-muted bg-background/50 text-sm hover:bg-muted/30 print:border-none print:p-0.5"
              >
                <div class="w-4 h-4 rounded-full border border-muted-foreground/40 flex items-center justify-center shrink-0 print:border-black"></div>
                <span class="text-xs sm:text-sm text-foreground/90 print:text-black">{{ opt }}</span>
              </div>
            </div>

            <!-- Fill in the blank / Identification line -->
            <div
              v-else-if="item.type === 'fill_in_blank' || item.type === 'identification'"
              class="pl-7 pt-1 flex items-center gap-2"
            >
              <span class="text-xs font-semibold text-muted-foreground uppercase print:text-black">Answer:</span>
              <div class="border-b border-muted-foreground/60 w-64 h-5 print:border-black"></div>
            </div>

            <!-- Short answer writing lines -->
            <div
              v-else-if="item.type === 'short_answer' || item.type === 'essay'"
              class="pl-7 pt-2 space-y-3"
            >
              <div class="border-b border-muted-foreground/40 h-4 print:border-black"></div>
              <div class="border-b border-muted-foreground/40 h-4 print:border-black"></div>
              <div class="border-b border-muted-foreground/40 h-4 print:border-black"></div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Teacher Guide & Answer Key Toggle -->
    <div class="pt-4 print:break-before-page">
      <div class="flex items-center justify-between mb-4 print:hidden">
        <div class="flex items-center gap-2">
          <BookOpen class="h-4 w-4 text-primary" />
          <h3 class="text-sm font-semibold">Teacher Reference & Answer Key</h3>
        </div>
        <Button
          variant="outline"
          size="sm"
          class="h-8 gap-1.5 text-xs"
          @click="showAnswerKey = !showAnswerKey"
        >
          <component :is="showAnswerKey ? EyeOff : Eye" class="h-3.5 w-3.5" />
          {{ showAnswerKey ? 'Hide Answer Key' : 'Reveal Answer Key' }}
        </Button>
      </div>

      <!-- Table of Specification (Always shown when printing or toggled) -->
      <div
        v-if="content.table_of_specification && (showAnswerKey || true)"
        class="border rounded-lg p-5 bg-card print:border-black print:block mb-6"
        :class="{ 'hidden print:block': !showAnswerKey }"
      >
        <div class="flex items-center justify-between border-b pb-3 mb-4 print:border-black">
          <div class="flex items-center gap-2">
            <h4 class="font-bold text-base tracking-tight text-foreground print:text-black">
              Table of Specification (TOS)
            </h4>
          </div>
        </div>

        <div class="overflow-x-auto">
          <table class="w-full text-xs border-collapse">
            <thead>
              <tr class="border-b print:border-black bg-muted/30">
                <th class="py-2 px-2 text-left font-semibold">Competencies</th>
                <th class="py-2 px-2 text-center font-semibold border-l print:border-black">No. of Items</th>
                <th class="py-2 px-2 text-center font-semibold border-l print:border-black">Remembering</th>
                <th class="py-2 px-2 text-center font-semibold border-l print:border-black">Understanding</th>
                <th class="py-2 px-2 text-center font-semibold border-l print:border-black">Applying</th>
                <th class="py-2 px-2 text-center font-semibold border-l print:border-black">Analyzing</th>
                <th class="py-2 px-2 text-center font-semibold border-l print:border-black">Evaluating</th>
                <th class="py-2 px-2 text-center font-semibold border-l print:border-black">Creating</th>
                <th class="py-2 px-2 text-center font-semibold border-l print:border-black">Test Placement</th>
                <th class="py-2 px-2 text-center font-semibold border-l print:border-black">Percentage</th>
              </tr>
            </thead>
            <tbody class="divide-y print:divide-black">
              <tr v-for="(row, idx) in content.table_of_specification.competencies" :key="idx" class="hover:bg-muted/10 print:hover:bg-transparent">
                <td class="py-2 px-2 font-medium">{{ row.competency }}</td>
                <td class="py-2 px-2 text-center border-l print:border-black">{{ row.no_of_items }}</td>
                <td class="py-2 px-2 text-center border-l print:border-black">{{ row.remembering }}</td>
                <td class="py-2 px-2 text-center border-l print:border-black">{{ row.understanding }}</td>
                <td class="py-2 px-2 text-center border-l print:border-black">{{ row.applying }}</td>
                <td class="py-2 px-2 text-center border-l print:border-black">{{ row.analyzing }}</td>
                <td class="py-2 px-2 text-center border-l print:border-black">{{ row.evaluating }}</td>
                <td class="py-2 px-2 text-center border-l print:border-black">{{ row.creating }}</td>
                <td class="py-2 px-2 text-center border-l print:border-black">{{ row.test_placement }}</td>
                <td class="py-2 px-2 text-center border-l print:border-black">{{ row.percentage }}</td>
              </tr>
              <tr class="font-bold border-t-2 print:border-black">
                <td class="py-2 px-2">{{ worksheet.medium_of_instruction === 'English' ? 'TOTAL' : 'KABUUAN' }}</td>
                <td class="py-2 px-2 text-center border-l print:border-black">{{ content.table_of_specification.total_items }}</td>
                <td class="py-2 px-2 text-center border-l print:border-black">{{ content.table_of_specification.total_remembering }}</td>
                <td class="py-2 px-2 text-center border-l print:border-black">{{ content.table_of_specification.total_understanding }}</td>
                <td class="py-2 px-2 text-center border-l print:border-black">{{ content.table_of_specification.total_applying }}</td>
                <td class="py-2 px-2 text-center border-l print:border-black">{{ content.table_of_specification.total_analyzing }}</td>
                <td class="py-2 px-2 text-center border-l print:border-black">{{ content.table_of_specification.total_evaluating }}</td>
                <td class="py-2 px-2 text-center border-l print:border-black">{{ content.table_of_specification.total_creating }}</td>
                <td class="py-2 px-2 text-center border-l print:border-black"></td>
                <td class="py-2 px-2 text-center border-l print:border-black">100%</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Answer Key Box (Always shown when printing or when toggled) -->
      <div
        v-if="showAnswerKey || true"
        class="border rounded-lg p-5 bg-card print:border-black print:block"
        :class="{ 'hidden print:block': !showAnswerKey }"
      >
        <div class="flex items-center justify-between border-b pb-3 mb-4 print:border-black">
          <div class="flex items-center gap-2">
            <CheckCircle2 class="h-5 w-5 text-emerald-600 print:text-black" />
            <h4 class="font-bold text-base tracking-tight text-foreground print:text-black">
              Answer Key & Grading Reference
            </h4>
          </div>
          <Badge variant="secondary" class="text-xs text-emerald-700 bg-emerald-50 dark:bg-emerald-950/30 print:hidden">
            Teacher Only
          </Badge>
        </div>

        <div v-if="answerKey.length" class="space-y-4">
          <div v-for="(akSection, akIdx) in answerKey" :key="akIdx" class="space-y-2">
            <h5 class="text-xs font-semibold uppercase tracking-wider text-muted-foreground print:text-black">
              {{ akSection.section_title }}
            </h5>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
              <div
                v-for="ans in akSection.items"
                :key="ans.item_number"
                class="p-2.5 rounded bg-muted/40 border border-muted text-xs flex items-start gap-2 print:border-black print:bg-transparent"
              >
                <span class="font-bold text-primary min-w-[20px] print:text-black">
                  #{{ ans.item_number }}:
                </span>
                <div>
                  <span class="font-semibold text-emerald-700 dark:text-emerald-400 print:text-black">
                    {{ ans.answer }}
                  </span>
                  <p v-if="ans.explanation" class="text-[11px] text-muted-foreground mt-0.5 italic print:text-black">
                    {{ ans.explanation }}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Rubrics -->
        <div v-if="rubric.length" class="mt-5 pt-4 border-t print:border-black space-y-2">
          <h5 class="text-xs font-semibold uppercase tracking-wider text-muted-foreground print:text-black">
            Scoring Rubric for Open Tasks:
          </h5>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            <div
              v-for="(r, rIdx) in rubric"
              :key="rIdx"
              class="p-2.5 rounded bg-muted/30 border border-muted print:border-black print:bg-transparent"
            >
              <div class="flex items-center justify-between font-semibold text-foreground print:text-black">
                <span>{{ r.criteria }}</span>
                <span class="text-primary font-mono text-[11px] print:text-black">Max {{ r.max_points }} pts</span>
              </div>
              <p class="text-muted-foreground text-[11px] mt-1 leading-snug print:text-black">
                {{ r.description }}
              </p>
            </div>
          </div>
        </div>

        <!-- Teacher Notes -->
        <div v-if="content.teacher_notes" class="mt-4 pt-3 border-t text-xs text-muted-foreground italic print:border-black print:text-black">
          <strong>Teacher Notes:</strong> {{ content.teacher_notes }}
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
@media print {
  .worksheet-paper {
    background: transparent !important;
    color: black !important;
  }
}
</style>
