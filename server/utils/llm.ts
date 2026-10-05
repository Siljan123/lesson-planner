
import { buildResponseSchema } from './lesson-plan-response-schema'

export function parseSessionDays(duration?: string | null): string[] {
  if (!duration) return ['Day 1'];
  const trimmed = duration.trim();

  // If numeric e.g. "2" or "2 days" or "3 sessions"
  const numMatch = trimmed.match(/^(\d+)\s*(?:days?|sessions?)?$/i);
  if (numMatch) {
    const count = Math.min(Math.max(parseInt(numMatch[1]!, 10), 1), 7);
    return Array.from({ length: count }, (_, i) => `Day ${i + 1}`);
  }

  // If range e.g. "Day 1 - Day 4" or "Day 1 to Day 3"
  const rangeMatch = trimmed.match(/day\s*(\d+)\s*(?:-|to)\s*day\s*(\d+)/i);
  if (rangeMatch) {
    const start = parseInt(rangeMatch[1]!, 10);
    const end = parseInt(rangeMatch[2]!, 10);
    if (start <= end && end - start < 7) {
      const days: string[] = [];
      for (let i = start; i <= end; i++) days.push(`Day ${i}`);
      return days;
    }
  }

  // If "Day 2", "Day 3", etc. (teacher input "Day 2" meaning 2 days)
  const singleDayMatch = trimmed.match(/^day\s*(\d+)$/i);
  if (singleDayMatch) {
    const count = parseInt(singleDayMatch[1]!, 10);
    if (count > 1) {
      return Array.from({ length: count }, (_, i) => `Day ${i + 1}`);
    }
    return ['Day 1'];
  }

  // If comma or slash separated e.g. "Day 1, Day 2, Day 3"
  const parts = trimmed.split(/[,;/+]+/).map(s => s.trim()).filter(Boolean);
  if (parts.length > 1) {
    return parts.map((p, idx) => {
      const m = p.match(/(?:day|session)?\s*(\d+)/i);
      return m ? `Day ${m[1]}` : `Day ${idx + 1}`;
    });
  }

  return ['Day 1'];
}

// ─── Objective helpers ────────────────────────────────────────────────────────

type ObjectiveDomain = 'cognitive' | 'psychomotor' | 'affective'

function normalizeDay(day?: string) {
  const match = String(day || '').match(/\d+/)
  return match ? `day-${match[0]}` : String(day || '').trim().toLowerCase()
}

function progressiveObjective(domain: ObjectiveDomain, day: string, index: number, topic: string, isEnglish: boolean) {
  const stage = Math.min(index, 6)
  const objectives = isEnglish ? {
    cognitive: [`identify and describe the foundational concepts of ${topic}`, `explain relationships and give accurate examples of ${topic}`, `apply the key concepts of ${topic} in a guided situation`, `analyze examples of ${topic} and distinguish correct from incorrect applications`, `create a solution or output that demonstrates understanding of ${topic}`, `evaluate a solution involving ${topic} and justify suggested improvements`, `synthesize and transfer learning about ${topic} to a new real-life context`],
    psychomotor: [`complete a guided hands-on task that represents the basic ideas of ${topic}`, `organize and demonstrate examples of ${topic} using the provided materials`, `perform the target skill related to ${topic} with increasing accuracy`, `classify, compare, or manipulate materials to show deeper understanding of ${topic}`, `construct and present an original product or model about ${topic}`, `revise a performance or product about ${topic} using feedback and agreed criteria`, `independently demonstrate mastery of ${topic} through an authentic performance task`],
    affective: [`show curiosity and willingness to participate while learning about ${topic}`, `practice attentive listening and respectful sharing during activities about ${topic}`, `demonstrate cooperation and responsibility while applying learning about ${topic}`, `value accuracy, fairness, and persistence when examining examples of ${topic}`, `show confidence and creativity while presenting an output about ${topic}`, `accept feedback constructively and help improve group work about ${topic}`, `appreciate the value of ${topic} and commit to using the learning responsibly`],
  } : {
    cognitive: [`matukoy at mailarawan ang mga batayang konsepto ng ${topic}`, `maipaliwanag ang mga ugnayan at makapagbigay ng wastong halimbawa ng ${topic}`, `mailapat ang mahahalagang konsepto ng ${topic} sa isang gawaing may gabay`, `masuri ang mga halimbawa ng ${topic} at matukoy ang wasto at di-wastong paglalapat`, `makabuo ng solusyon o output na nagpapakita ng pag-unawa sa ${topic}`, `mataya ang isang solusyong may kaugnayan sa ${topic} at maipaliwanag ang mga mungkahing pagpapabuti`, `mapagsama-sama at mailipat ang pagkatuto tungkol sa ${topic} sa bagong sitwasyon sa tunay na buhay`],
    psychomotor: [`maisagawa ang gawaing may gabay na nagpapakita ng batayang ideya ng ${topic}`, `maihanay at maipakita ang mga halimbawa ng ${topic} gamit ang ibinigay na kagamitan`, `maisagawa ang target na kasanayan tungkol sa ${topic} nang may higit na kawastuhan`, `mapangkat, maihambing, o mamanipula ang mga kagamitan upang maipakita ang mas malalim na pag-unawa sa ${topic}`, `makagawa at makapaglahad ng orihinal na produkto o modelo tungkol sa ${topic}`, `marebisa ang pagganap o produkto tungkol sa ${topic} batay sa puna at napagkasunduang pamantayan`, `malayang maipakita ang kahusayan sa ${topic} sa pamamagitan ng makatotohanang gawaing pagganap`],
    affective: [`magpakita ng pag-uusisa at kahandaang makilahok habang pinag-aaralan ang ${topic}`, `maisabuhay ang maingat na pakikinig at magalang na pagbabahagi sa mga gawain tungkol sa ${topic}`, `magpakita ng pakikipagtulungan at pananagutan habang inilalapat ang pagkatuto sa ${topic}`, `pahalagahan ang kawastuhan, pagiging patas, at pagtitiyaga sa pagsusuri ng mga halimbawa ng ${topic}`, `magpakita ng tiwala sa sarili at pagkamalikhain sa paglalahad ng output tungkol sa ${topic}`, `malugod na tanggapin ang puna at makatulong sa pagpapabuti ng pangkatang gawain tungkol sa ${topic}`, `mapahalagahan ang kabuluhan ng ${topic} at mangakong gagamitin ang pagkatuto nang responsable`],
  }
  const statement = objectives[domain][stage]
  return isEnglish ? `By the end of ${day}, learners will be able to ${statement}.` : `Sa pagtatapos ng ${day}, ang mga mag-aaral ay inaasahang ${statement}.`
}

/** Keep every DLL session usable and prevent repeated day objectives. */
function ensureLearningObjectives(content: any, topic: string, sessionDays: string[] = ['Day 1'], isEnglish = false) {
  const intentions = content.intentions ||= {}
  const objectives = intentions.learning_objectives ||= {}
  objectives.cognitive ||= isEnglish ? `Identify and explain the key ideas in ${topic}.` : `Matukoy at maipaliwanag ang mahahalagang ideya tungkol sa ${topic}.`
  objectives.psychomotor ||= isEnglish ? `Demonstrate the skill or learning task related to ${topic}.` : `Maipakita ang kasanayan o gawaing may kaugnayan sa ${topic}.`
  objectives.affective ||= isEnglish ? `Show active participation and appreciation while learning ${topic}.` : `Magpakita ng aktibong pakikilahok at pagpapahalaga habang pinag-aaralan ang ${topic}.`
  const generatedObjectives = Array.isArray(intentions.learning_objectives_per_session) ? intentions.learning_objectives_per_session : []
  const used = new Set<string>()
  intentions.learning_objectives_per_session = sessionDays.map((day, index) => {
    const existing = generatedObjectives.find((item: any) => normalizeDay(item?.day) === normalizeDay(day)) || {}
    const item: any = { day }
    ;(['cognitive', 'psychomotor', 'affective'] as ObjectiveDomain[]).forEach((domain) => {
      const candidate = String(existing[domain] || '').trim()
      const key = `${domain}:${candidate.toLowerCase()}`
      item[domain] = candidate && !used.has(key) ? candidate : progressiveObjective(domain, day, index, topic, isEnglish)
      used.add(`${domain}:${String(item[domain]).trim().toLowerCase()}`)
    })
    return item
  })
  return content
}

// ─── Post-generation quality validation ───────────────────────────────────────

/**
 * Checks the AI output for common quality issues: generic placeholders,
 * missing sessions, duplicate objectives, short activities, etc.
 * Returns an array of warning strings (empty = passes all checks).
 */
function validateLessonPlanQuality(content: any, sessionDays: string[]): string[] {
  const warnings: string[] = []

  // Check session count
  const sessions = content.learning_experience?.sessions || []
  if (sessions.length !== sessionDays.length) {
    warnings.push(`Expected ${sessionDays.length} sessions, got ${sessions.length}`)
  }

  // Check formative assessment count
  const assessments = content.assessing_learning?.formative_assessment_per_session || []
  if (assessments.length !== sessionDays.length) {
    warnings.push(`Expected ${sessionDays.length} formative assessments, got ${assessments.length}`)
  }

  // Check for generic / placeholder text the AI sometimes copies from prompts
  const genericPatterns = [
    /discuss the topic/i,
    /discuss the lesson/i,
    /i discuss the/i,
    /show a (short )?video/i,
    /identify key elements/i,
    /specific .* for day/i,
    /vivid teacher dialogue/i,
    /hook activity for day/i,
    /active learner response for day/i,
    /guided exploration.*for day/i,
    /placeholder/i,
    /\[insert/i,
    /\[specific/i,
    /makikinig ang mga mag-aaral/i,
    /ipapaliwanag ng guro ang aralin/i,
    /tatalakayin ng guro/i,
    /magtatanong ang guro/i,
  ]

  const allText = JSON.stringify(content)
  for (const pattern of genericPatterns) {
    if (pattern.test(allText)) {
      warnings.push(`Contains generic placeholder text matching: ${pattern.source}`)
    }
  }

  // Check phase count and depth per session
  for (const session of sessions) {
    if (!session.phases || session.phases.length !== 4) {
      warnings.push(`${session.day}: Expected 4 phases, got ${session.phases?.length || 0}`)
    }

    // Check that teacher_activity and learner_activity have substantive depth
    for (const phase of (session.phases || [])) {
      const isCorePhase = phase.phase?.includes('Lesson Proper')
      const minTeacherLen = isCorePhase ? 150 : 60
      if (phase.teacher_activity && phase.teacher_activity.length < minTeacherLen) {
        warnings.push(`${session.day} ${phase.phase}: teacher_activity is too short (${phase.teacher_activity.length} chars, min ${minTeacherLen}) — needs in-depth explanation and dialogue`)
      }
      if (phase.learner_activity && phase.learner_activity.length < 40) {
        warnings.push(`${session.day} ${phase.phase}: learner_activity is too short (${phase.learner_activity.length} chars)`)
      }
      if (phase.phase?.includes('Lesson Proper')) {
        const hasQuestions = /[?¿]|tanong|itanong|ask|question/i.test(phase.teacher_activity || '')
        if (!hasQuestions) {
          warnings.push(`${session.day} Flow Discussion: missing probing discussion questions in teacher_activity`)
        }
      }
    }
  }

  // Check for duplicate cognitive objectives across sessions
  const objPerSession = content.intentions?.learning_objectives_per_session || []
  const seenCog = new Set<string>()
  for (const obj of objPerSession) {
    const key = (obj.cognitive || '').toLowerCase().trim()
    if (key && seenCog.has(key)) {
      warnings.push(`Duplicate cognitive objective across sessions: "${obj.cognitive?.slice(0, 60)}..."`)
    }
    if (key) seenCog.add(key)
  }

  return warnings
}

// ─── System instruction (persona & rules) ─────────────────────────────────────

function buildSystemInstruction(medium: string): string {
  const isEnglish = medium === 'English'
  const lang = isEnglish ? 'English' : 'Filipino / Tagalog'

  return `You are an expert Department of Education (DepEd) Philippines Master Teacher and Curriculum Design Specialist with 15+ years of experience.

You create Daily Lesson Logs (DLLs) / Banghay-Aralin under the MATATAG Curriculum and ILAW framework (DepEd Order No. 16, s. 2026).

LANGUAGE RULE:
Write ALL generated lesson-content values in ${lang}. This includes objectives, activity instructions, questions, assessments, resources, and reflection. Do NOT mix languages except for official proper names, DepEd terms, or curriculum codes.

CRITICAL POINT-OF-VIEW RULE — MOST IMPORTANT:
All teacher_activity fields MUST be written in the FIRST PERSON, from the teacher's own perspective, narrating what they personally do and say.
- CORRECT: "I show the class the picture and ask: 'What do you notice?' I write their answers on the board." / "Ipinakita ko ang larawan at itinanong ko: 'Ano ang napansin ninyo?'"
- WRONG: "The teacher shows...", "Tell the teacher to distribute...", "Distribute the worksheets.", "Ask the learners..."
Every sentence in teacher_activity must start with "I" in English, or a Filipino first-person form ("Ipinakita ko...", "Itinanong ko...", "Ipinaliwanag ko...", "Ipinamahagi ko...").

PEDAGOGICAL FLOW & QUALITY RULES YOU MUST FOLLOW (DALOY NG ARALIN - ILAW STRUCTURE):
1. PHASE 1: I - INTRODUCTION (Panimula):
   - Include Balik-Aral (Review): 3-4 specific recall questions with teacher feedback dialogue.
   - Include Pagganyak (Motivation): real-world scenario, visual/problem hook, or mystery prompt bridging to the objective.
   - Present the lesson objective clearly.
2. PHASE 2: L - LESSON PROPER (Paglalahad at Pagtatalakay — THE CORE FLOW DISCUSSION):
   - Provide EXPLICIT, SUBSTANTIVE SUBJECT-MATTER TEACHING SCRIPT in teacher_activity (minimum 50-80 words for this phase). Never output empty summaries like "I discuss the topic." Include what the teacher actually says, explains, and models.
   - Present explicit core concepts, definitions, rules, or formulas. Include Guided Practice modeling.
   - Include Pagproseso ng Gawain: 4-5 tiered probing discussion questions (literal, inferential/analytical, evaluative, application) in teacher quotes WITH expected learner answers (e.g., Itinanong ko: "..." [Inaasahang sagot: "..."]).
   - Address common misconceptions / error analysis (Pagsusuri ng Kamalian).
3. PHASE 3: A - APPLICATION (Paglalapat):
   - Provide independent or collaborative/pair creative application tasks, practice exercises, or real-life application with clear rubrics and success criteria.
4. PHASE 4: W - WRAP-UP (Paglalahat at Pagtataya):
   - Include Paglalahat (Generalization synthesis questions where learners state the core takeaway or golden rule).
   - Short assessment and Assignment/enrichment activity instructions.
5. FORMATIVE ASSESSMENT & ANSWER KEY:
   - Generate 5 specific evaluation questions (Multiple Choice items A, B, C, D) AND include an explicit Susi sa Pagwawasto / Answer Key at the end of sample_questions.
6. SUMMATIVE ASSESSMENT & RUBRIC:
   - Provide a complete Performance Task description with an explicit 20-point Rubric table.
7. TAKDANG-ARALIN / EXTENDED LEARNING:
   - Provide a concrete home inquiry/application task with specific actionable questions.`
}

// ─── User prompt ──────────────────────────────────────────────────────────────

function buildUserPrompt(params: {
  subject: string
  grade: string
  topic: string
  competency: string
  term: string
  targetDays: string[]
  content_standard?: string
  performance_standard?: string
  medium_of_instruction: string
  section_to_regenerate?: string
  custom_instructions?: string
  existing_plan?: any
}): string {
  const isRegenFlow = params.section_to_regenerate === 'learning_experience' || params.section_to_regenerate === 'daloy_ng_aralin'

  return `Create a complete, classroom-ready DepEd Banghay-Aralin Daily Lesson Log (DLL) for:

Subject: ${params.subject}
Grade Level: ${params.grade}
Topic: ${params.topic}
Competency: ${params.competency || params.topic}
Term: ${params.term}
Required Sessions: ${params.targetDays.join(', ')}
${params.content_standard ? `Content Standard: ${params.content_standard}` : ''}
${params.performance_standard ? `Performance Standard: ${params.performance_standard}` : ''}
${params.section_to_regenerate ? `\nFocus especially on regenerating this section with high creativity, rigor, and fresh activities: ${params.section_to_regenerate}` : ''}
${isRegenFlow ? `\n⚠️ SPECIAL DIRECTIVE FOR DALOY NG ARALIN & FLOW DISCUSSION:
Provide extensive, in-depth instructional flow for all sessions. For Phase 2 (L - Lesson Proper):
- Write the FULL teaching script and detailed concept explanations (minimum 50-80 words in first-person voice).
- Include 4-5 explicit tiered probing discussion questions with expected learner answers: Itinanong ko: "..." [Inaasahang sagot: "..."]
- Include an explicit error analysis / common misconception check (Pagsusuri ng Kamalian).
- Ensure learner_activity details active, concrete learner participation and reasoning.` : ''}
${params.custom_instructions ? `\nTeacher Custom Instructions: ${params.custom_instructions}` : ''}
${params.existing_plan ? `\nExisting Plan Context for continuity:\n${typeof params.existing_plan === 'string' ? params.existing_plan.slice(0, 1500) : JSON.stringify(params.existing_plan).slice(0, 1500)}` : ''}

INSTRUCTIONAL FLOW REQUIREMENTS (DALOY NG ARALIN - ILAW FORMAT):
1. Phase 1 (I - Introduction): Include Balik-Aral (3-4 recall questions with feedback), Pagganyak (concrete real-world hook), and presenting the objective.
2. Phase 2 (L - Lesson Proper): Provide full, explicit teaching explanation script, concept teaching, 4-5 tiered probing discussion questions with expected learner answers, and error analysis / misconception handling.
3. Phase 3 (A - Application): Include Malikhaing Paglalapat (Group/pair creative task with rubric) or independent practice exercises.
4. Phase 4 (W - Wrap-up): Include Paglalahat (Generalization synthesis Q&As) and a short assessment.
5. Assessing Learning: Provide 5 Multiple-Choice items WITH an explicit Susi sa Pagwawasto (Answer Key) and a 20-point Rubric table.
6. Ways Forward: Include Takdang-Aralin (Home extension inquiry task).

VOICE RULE — teacher_activity MUST be written in FIRST PERSON ("Ipinakita ko...", "Itinanong ko...", "Ipinaliwanag ko..."). NEVER write "The teacher...", "The teacher will...", or imperative commands.`
}

import { callOpenAI, type OpenAIModel } from './openai-client'
import { callGemini, type GeminiModel } from './gemini-client'

function isGeminiModel(model: string): model is GeminiModel {
  return model.startsWith('gemini-')
}

// ─── Main generation function ─────────────────────────────────────────────────

export async function generateILAW(params: {
  subject: string;
  grade: string;
  topic: string;
  competency: string;
  term: string;
  session_duration: string;
  content_standard?: string;
  performance_standard?: string;
  medium_of_instruction?: 'English' | 'Filipino' | string;
  section_to_regenerate?: string;
  custom_instructions?: string;
  existing_plan?: any;
  /** 'gpt-6-luna' | 'gpt-5.6-luna' | 'gemini-3.7-flash' | 'gemini-3.6-flash' | 'gemini-3.5-flash-lite' | 'gemini-3.1-flash-lite' */
  ai_model?: string;
}) {
  const targetDays = parseSessionDays(params.session_duration)
  const isEnglish = params.medium_of_instruction === 'English'
  const medium = params.medium_of_instruction || 'Filipino'

  const systemInstruction = buildSystemInstruction(medium)
  const userPrompt = buildUserPrompt({
    subject: params.subject,
    grade: params.grade,
    topic: params.topic,
    competency: params.competency,
    term: params.term,
    targetDays,
    content_standard: params.content_standard,
    performance_standard: params.performance_standard,
    medium_of_instruction: medium,
    section_to_regenerate: params.section_to_regenerate,
    custom_instructions: params.custom_instructions,
    existing_plan: params.existing_plan,
  })

  const model = params.ai_model || 'gpt-6-luna'
  console.log(`[llm] Generating DLL for ${targetDays.length} sessions (${targetDays.join(', ')}) with model: ${model}...`)

  const responseSchema = buildResponseSchema(targetDays)

  // Scale output tokens and timeout based on session count — multi-day plans need more room
  const maxTokens = Math.min(8192 + (targetDays.length - 1) * 4096, 32768)
  const timeout = Math.min(90000 + (targetDays.length - 1) * 30000, 300000)
  console.log(`[llm] maxOutputTokens: ${maxTokens}, timeout: ${timeout}ms for ${targetDays.length} session(s)`)

  const fullPrompt = `${userPrompt}\n\nIMPORTANT: Return ONLY a valid JSON object — no markdown fences, no extra text. The JSON must strictly match the schema for a DepEd ILAW DLL with ${targetDays.length} sessions.`

  let response: { text: string; model: string; modelLabel: string; usage: any; raw: any }

  if (isGeminiModel(model)) {
    response = await callGemini({
      systemInstruction,
      userPrompt: fullPrompt,
      model,
      maxOutputTokens: maxTokens,
      timeoutMs: timeout,
      responseFormat: 'json',
      jsonSchema: {
        name: 'deped_ilaw_lesson_plan',
        schema: responseSchema,
      },
    })
  } else {
    response = await callOpenAI({
      systemInstruction,
      userPrompt: fullPrompt,
      model: model as OpenAIModel,
      maxOutputTokens: maxTokens,
      timeoutMs: timeout,
      responseFormat: 'json_schema',
      jsonSchema: {
        name: 'deped_ilaw_lesson_plan',
        schema: responseSchema,
        strict: false,
      },
    })
  }

  const text = response.text
  if (text) {
    try {
      const cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim()
      const parsed = JSON.parse(cleanText)

      const qualityWarnings = validateLessonPlanQuality(parsed, targetDays)
      if (qualityWarnings.length > 0) {
        console.warn(`[llm] Quality warnings (${qualityWarnings.length}):`, qualityWarnings)
      }

      console.log(`[llm] ${response.modelLabel} successfully generated ${parsed?.learning_experience?.sessions?.length || 0} sessions!`)
      return {
        content: ensureLearningObjectives(parsed, params.topic, targetDays, isEnglish),
        usage: response.usage,
        model: response.model,
        modelLabel: response.modelLabel,
        qualityWarnings,
      }
    } catch (parseErr: any) {
      console.error('[llm] JSON parse failed:', parseErr?.message || parseErr, text.slice(0, 300))
      throw createError({
        statusCode: 500,
        message: 'AI returned an invalid format. Please try again.'
      })
    }
  }

  throw createError({
    statusCode: 500,
    message: 'Failed to generate lesson plan. Please try again.'
  })
}


