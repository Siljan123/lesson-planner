// llm.ts
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

  // If "Day 2", "Day 3", etc. (teacher input "Day 2" meaning 2 days or Day 1 and Day 2)
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
}) {
  const apiKey = process.env.GEMINI_API_KEY
  const targetDays = parseSessionDays(params.session_duration)
  const isEnglish = params.medium_of_instruction === 'English'

  const prompt = `You are an expert Department of Education (DepEd) Philippines Master Teacher and Curriculum Specialist.
Create a comprehensive, highly generative, and classroom-ready Daily Lesson Log (DLL) under the DepEd MATATAG Curriculum and ILAW framework (DepEd Order No. 16, s. 2026).

Subject: ${params.subject}
Grade Level: ${params.grade}
Topic: ${params.topic}
Competency: ${params.competency || params.topic}
Term: ${params.term}
Required Sessions: ${targetDays.join(', ')}
Medium of Instruction: ${params.medium_of_instruction || 'Filipino'}
${params.content_standard ? `Content Standard: ${params.content_standard}` : ''}
${params.performance_standard ? `Performance Standard: ${params.performance_standard}` : ''}
${params.section_to_regenerate ? `Focus especially on regenerating this section with high creativity, pedagogical rigor, and fresh activities: ${params.section_to_regenerate}` : ''}
${params.custom_instructions ? `Teacher Custom Instructions: ${params.custom_instructions}` : ''}
${params.existing_plan ? `Existing Plan Context for continuity and alignment:\n${typeof params.existing_plan === 'string' ? params.existing_plan.slice(0, 2000) : JSON.stringify(params.existing_plan).slice(0, 2000)}` : ''}

CRITICAL PEDAGOGICAL INSTRUCTIONS:
0. Write every generated lesson-content value in ${params.medium_of_instruction === 'English' ? 'English' : 'Filipino / Tagalog'}. This includes objectives, activity instructions, questions, assessments, resources, and reflection. Do not mix languages except for official proper names or a necessary curriculum code.
1. NEVER output generic or empty placeholders like "Identify key elements of..." or "Discuss the topic" or "Show a short video".
2. Provide rich, highly specific teacher instructions (e.g. specific game names, songs, step-by-step manipulative instructions, concrete realia, inquiry questions with sample student responses).
3. You MUST generate a distinct entry in 'learning_experience.sessions' and 'assessing_learning.formative_assessment_per_session' for EACH of the following sessions: ${targetDays.join(', ')}.
   - You MUST also generate a different cognitive, psychomotor, and affective objective for every session in 'learning_objectives_per_session'. No objective sentence may be copied or repeated across days.
   - Make the objectives progress by day: foundation/recall, explanation, guided application, analysis, creation, evaluation, then independent transfer as applicable.
   - Each session should have its own specific pre-lesson readiness activity ('pre_lesson' / Bago ang Aralin).
   - Each session must have 4 detailed phases (Engage / Motivation, Explore / Presentation, Experience / Discussion, Empathize / Application) with distinct 'teacher_activity' and 'learner_activity'.
   - Progressively scaffold the lesson from ${targetDays[0]} to ${targetDays[targetDays.length - 1]} so learners build mastery over the sessions.
   - For each session, specify concrete learning resources ('learning_resources') and genuine cross-curricular integration ('integration').
   - For each session, provide 3 to 5 realistic, concrete formative assessment questions with expected answers in 'formative_assessment_per_session'.

Return ONLY valid JSON matching this exact structure:
{
  "intentions": {
    "learning_competency": "Full targeted DepEd MATATAG competency description",
    "content_standards": "Content standard from curriculum guide",
    "performance_standards": "Performance standard from curriculum guide",
    "learning_objectives": {
      "cognitive": "Measurable cognitive objective (Bloom's Revised / Anderson-Krathwohl)",
      "psychomotor": "Hands-on, active psychomotor objective",
      "affective": "Values and attitude affective objective"
    },
    "learning_objectives_per_session": [
      ${targetDays.map((d, index) => `{
        "day": "${d}",
        "cognitive": "A distinct, measurable cognitive objective for ${d}, progressively building from the prior session${index ? ' and not repeating earlier objectives' : ''}",
        "psychomotor": "A distinct hands-on performance objective for ${d}",
        "affective": "A distinct values, collaboration, or responsibility objective for ${d}"
      }`).join(',\n      ')}
    ],
    "learner_context": "Realistic observations of learner developmental level, interests, and readiness"
  },
  "learning_experience": {
    "instructional_materials": ["Specific material 1", "Specific material 2", "Specific material 3"],
    "sessions": [
      ${targetDays.map((d, i) => `{
        "day": "${d}",
        "pre_lesson": "Engaging readiness check, warm-up song, or review for ${d}",
        "learning_resources": "Specific concrete materials, charts, flashcards, or manipulatives for ${d}",
        "integration": "Specific cross-curricular link (e.g., Art, Language, Science, GMRC) for ${d}",
        "phases": [
          {
            "phase": "Engage / Motivation",
            "teacher_activity": "Vivid teacher dialogue and hook activity for ${d}",
            "learner_activity": "Active learner response and participation for ${d}"
          },
          {
            "phase": "Explore / Presentation",
            "teacher_activity": "Teacher modeling, guided exploration, hands-on task introduction for ${d}",
            "learner_activity": "Learners handling materials, discovering patterns, small group task for ${d}"
          },
          {
            "phase": "Experience / Discussion",
            "teacher_activity": "Guided processing questions, deepening concepts, highlighting rules for ${d}",
            "learner_activity": "Learners explaining their work, sharing insights, answering teacher questions for ${d}"
          },
          {
            "phase": "Empathize / Application",
            "teacher_activity": "Real-world contextualized exercise, values integration, partner practice for ${d}",
            "learner_activity": "Learners completing authentic task, applying knowledge, showing teamwork for ${d}"
          }
        ]
      }`).join(',\n      ')}
    ]
  },
  "assessing_learning": {
    "formative_assessment_per_session": [
      ${targetDays.map(d => `{
        "day": "${d}",
        "description": "Formative evaluation task description for ${d}",
        "sample_questions": [
          "Specific question 1 with sample answer for ${d}",
          "Specific question 2 with sample answer for ${d}",
          "Specific question 3 with sample answer for ${d}"
        ]
      }`).join(',\n      ')}
    ],
    "summative_assessment": {
      "description": "End-of-week summative assessment / performance task description"
    }
  },
  "ways_forward": {
    "extended_learning": "Creative home-based reinforcement or community extension activity",
    "reflection": {
      "learners_at_mastery": "Anticipated learner percentage achieving mastery and next steps",
      "learners_requiring_remediation": "Targeted support plan for struggling learners",
      "effective_strategies": "Most effective collaborative and inquiry strategies",
      "challenges_encountered": "Potential difficulties and mitigation strategies"
    },
    "reflection_per_session": [
      ${targetDays.map(d => `{
        "day": "${d}",
        "objectives_achieved": null,
        "objectives_not_achieved_reason": "",
        "mastery_count": "",
        "total_count": "",
        "teacher_notes": ""
      }`).join(',\n      ')}
    ],
    "remediation": "Structured re-teaching activity with simplified manipulatives",
    "enrichment": "Higher-order thinking challenge or peer coaching activity"
  }
}`

  if (apiKey) {
    try {
      console.log(`[llm] Requesting Gemini 3.6 Flash for ${targetDays.length} sessions (${targetDays.join(', ')})...`)
      const response: any = await $fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: {
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            responseMimeType: "application/json",
          }
        }
      })

      const text = response?.candidates?.[0]?.content?.parts?.[0]?.text
      if (text) {
        const cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim()
        const parsed = JSON.parse(cleanText)
        console.log(`[llm] Gemini successfully generated ${parsed?.learning_experience?.sessions?.length || 0} sessions!`)
        return {
          content: ensureLearningObjectives(parsed, params.topic, targetDays, isEnglish),
          usage: response.usageMetadata || null
        }
      }
    } catch (error: any) {
      console.error('[llm] Gemini API Error:', error?.message || error)
      throw createError({
        statusCode: 502,
        message: 'AI Service is currently busy or not responding. Please try again later.'
      })
    }
  } else {
    throw createError({
      statusCode: 500,
      message: 'Gemini API Key is not configured.'
    })
  }

  throw createError({
    statusCode: 500,
    message: 'Failed to generate lesson plan. Please try again.'
  })
}
