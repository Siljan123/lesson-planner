import type { WorksheetContent } from '~~/app/types/worksheet'
import { PDFParse as pdfParse } from 'pdf-parse'
import mammoth from 'mammoth'

export async function generateWorksheetContent(params: {
  subject: string
  grade: string
  topic: string
  competency?: string
  term?: string
  medium_of_instruction?: string
  custom_instructions?: string
  lesson_plan_context?: any
  include_tos?: boolean
  reference_file?: { name: string; type: string; base64: string }
}): Promise<{ content: WorksheetContent; usage?: any }> {
  const apiKey = process.env.GEMINI_API_KEY
  const isEnglish = params.medium_of_instruction === 'English'
  const lang = isEnglish ? 'English' : 'Filipino'

  let referenceText = ''
  if (params.reference_file && params.reference_file.base64) {
    try {
      const buffer = Buffer.from(params.reference_file.base64, 'base64')
      if (params.reference_file.type === 'application/pdf') {
        const pdfData = await pdfParse(buffer)
        referenceText = pdfData.text
      } else if (params.reference_file.type.includes('wordprocessingml.document')) {
        const result = await mammoth.extractRawText({ buffer })
        referenceText = result.value
      } else {
        referenceText = buffer.toString('utf-8')
      }
      referenceText = `\n\n=== REFERENCE MATERIAL: ${params.reference_file.name} ===\n${referenceText.slice(0, 15000)}\n=== END REFERENCE ===\n`
    } catch (err) {
      console.error('[worksheet-llm] Failed to parse reference file:', err)
    }
  }

  const prompt = `You are an expert Department of Education (DepEd) Philippines Master Teacher and Learning Materials Specialist.
Create a comprehensive, student-ready, pedagogically rigorous Learning Activity Sheet (Worksheet / Gawaing Papel) under the DepEd MATATAG Curriculum.

Subject: ${params.subject}
Grade Level: ${params.grade}
Topic: ${params.topic}
Target Competency: ${params.competency || params.topic}
Term: ${params.term || 'term_1'}
Medium of Instruction: ${lang}
${params.custom_instructions ? `Teacher Instructions / Focus Areas: ${params.custom_instructions}` : ''}
${params.lesson_plan_context ? `Aligned Lesson Plan Context:\n${typeof params.lesson_plan_context === 'string' ? params.lesson_plan_context.slice(0, 1500) : JSON.stringify(params.lesson_plan_context).slice(0, 1500)}` : ''}${referenceText}

CRITICAL RULES:
1. Language: Write ALL student directions, questions, and content in ${lang}. Only use official English terms if required by the curriculum (e.g. Mathematics or Science terminology).
2. Structure: Scaffold from basic recall to guided application, and finally higher-order authentic transfer.
3. Realistic & Engaging: Use age-appropriate situations, localized Filipino context, and concrete examples suitable for ${params.grade}.
4. Custom Instructions: You MUST STRICTLY FOLLOW any specific item counts or item types requested in the Teacher Instructions (e.g., if asked for 20 multiple choice items and 10 fill in the blanks, you MUST generate exactly that many items and structure the sections accordingly).
5. Provide a complete, unambiguous Answer Key and Rubric for the teacher.
${params.include_tos ? '6. CRITICAL: You MUST include the "table_of_specification" JSON object at the root level of your response. Map the generated items to cognitive levels (Remembering, Understanding, Applying, Analyzing, Evaluating, Creating). DO NOT OMIT THIS OBJECT.' : ''}
7. IMPORTANT REFERENCE OVERRIDE: If the uploaded REFERENCE MATERIAL contains a Table of Specification (TOS), a syllabus, or a test blueprint, you MUST use its competencies, cognitive level breakdowns, and item counts to generate the worksheet. The reference material's structure takes precedence over any generic item counts.

Return ONLY a valid JSON object matching this EXACT STRUCTURE. (ADJUST the number of sections and item counts strictly based on the custom instructions OR the uploaded reference! If a specific item type is 0, DO NOT include that question section. HOWEVER, you MUST ALWAYS include the "table_of_specification" object if it is requested below!):
{
  "title": "${isEnglish ? `Learning Activity Sheet in ${params.subject} (${params.grade}): ${params.topic}` : `Gawaing Pagkatuto sa ${params.subject} (${params.grade}): ${params.topic}`}",
  "topic": "${params.topic}",
  "instructions": "${isEnglish ? 'Read each part carefully and complete all tasks. Write your answers neatly on the sheet or your answer sheet.' : 'Basahin at unawaing mabuti ang bawat bahagi. Isulat ang iyong mga sagot nang maayos sa nakalaang espasyo o sa iyong sagutang papel.'}",
  "school_header": {
    "school_name": "",
    "grade_section": "${params.grade}",
    "teacher_name": ""
  },
  "sections": [
    {
      "id": "part-1",
      "title": "${isEnglish ? 'Part I: Concept Recall & Identification' : 'Bahagi I: Pagkilala at Pag-unawa sa Konsepto'}",
      "instructions": "${isEnglish ? 'Choose the letter of the correct answer from the given choices.' : 'Piliin ang titik ng tamang sagot mula sa mga sumusunod na pagpipilian.'}",
      "items": [
        {
          "item_number": 1,
          "question": "Specific question text for item 1",
          "type": "multiple_choice",
          "options": ["A. Choice 1", "B. Choice 2", "C. Choice 3", "D. Choice 4"],
          "correct_answer": "A. Choice 1",
          "points": 1,
          "explanation": "Brief reason why A is correct"
        }
        // ... GENERATE ALL REQUESTED MULTIPLE CHOICE ITEMS HERE (e.g. up to 20 if requested) ...
      ]
    },
    {
      "id": "part-2",
      "title": "${isEnglish ? 'Part II: Guided Practice & Analysis' : 'Bahagi II: Ginabayang Pagsasanay at Pagsusuri'}",
      "instructions": "${isEnglish ? 'Fill in each blank or identify the correct term that best completes each statement.' : 'Punan ang patlang o tukuyin ang wastong salita upang mabuo ang diwa ng bawat pangungusap.'}",
      "items": [
        {
          "item_number": 6, // Continue numbering
          "question": "Sentence with blank to complete",
          "type": "fill_in_blank",
          "correct_answer": "Expected answer",
          "points": 1,
          "explanation": "Why this answer fits"
        }
        // ... GENERATE ALL REQUESTED FILL IN THE BLANK ITEMS HERE ...
      ]
    },
    {
      "id": "part-3",
      "title": "${isEnglish ? 'Part III: Real-World Application & Reflection' : 'Bahagi III: Paglalapat sa Tunay na Buhay at Repleksiyon'}",
      "instructions": "${isEnglish ? 'Answer the following questions in 2-3 sentences based on what you have learned and your personal experience.' : 'Sagutin ang mga sumusunod na tanong sa 2 hanggang 3 pangungusap batay sa iyong natutuhan at personal na karanasan.'}",
      "items": [
        {
          "item_number": 11,
          "question": "Contextualized scenario-based question requiring practical application",
          "type": "short_answer",
          "correct_answer": "Exemplar response showing mastery",
          "points": 3,
          "explanation": "Criteria for scoring"
        },
        {
          "item_number": 12,
          "question": "Personal reflection or values integration question",
          "type": "short_answer",
          "correct_answer": "Exemplar response showing positive values and reflection",
          "points": 3,
          "explanation": "Criteria for scoring"
        }
      ]
    }
  ],
  "answer_key": [
    {
      "section_title": "${isEnglish ? 'Part I: Concept Recall & Identification' : 'Bahagi I: Pagkilala at Pag-unawa sa Konsepto'}",
      "items": [
        { "item_number": 1, "answer": "A. Choice 1", "explanation": "Key principle" }
        // ... ALL ANSWER KEY ITEMS FOR PART 1 ...
      ]
    },
    {
      "section_title": "${isEnglish ? 'Part II: Guided Practice & Analysis' : 'Bahagi II: Ginabayang Pagsasanay at Pagsusuri'}",
      "items": [
        { "item_number": 6, "answer": "Answer 6" }
        // ... ALL ANSWER KEY ITEMS FOR PART 2 ...
      ]
    },
    {
      "section_title": "${isEnglish ? 'Part III: Real-World Application & Reflection' : 'Bahagi III: Paglalapat sa Tunay na Buhay at Repleksiyon'}",
      "items": [
        { "item_number": 11, "answer": "Exemplar answer" }
        // ... ALL ANSWER KEY ITEMS FOR PART 3 ...
      ]
    }
  ],
  "rubric": [
    {
      "criteria": "${isEnglish ? 'Concept Accuracy & Relevance' : 'Kawastuhan ng Konsepto at Kaugnayan'}",
      "max_points": 5,
      "description": "${isEnglish ? 'Answers clearly reflect correct understanding of the topic with accurate explanations.' : 'Wasto at malinaw na nailapat ang mga konsepto ng aralin nang may angkop na paliwanag.'}"
    }
  ],
  "teacher_notes": "${isEnglish ? 'Recommended time: 30-40 minutes.' : 'Inirerekomendang oras: 30-40 minuto.'}"${params.include_tos ? `,
  "table_of_specification": {
    "competencies": [
      {
        "competency": "Identifies the basic concepts of the topic",
        "no_of_items": 5,
        "remembering": 3,
        "understanding": 2,
        "applying": 0,
        "analyzing": 0,
        "evaluating": 0,
        "creating": 0,
        "test_placement": "1-5",
        "percentage": "41.67%"
      },
      {
        "competency": "Applies concepts in real-world scenarios",
        "no_of_items": 7,
        "remembering": 0,
        "understanding": 0,
        "applying": 5,
        "analyzing": 2,
        "evaluating": 0,
        "creating": 0,
        "test_placement": "6-12",
        "percentage": "58.33%"
      }
    ],
    "total_items": 12,
    "total_remembering": 3,
    "total_understanding": 2,
    "total_applying": 5,
    "total_analyzing": 2,
    "total_evaluating": 0,
    "total_creating": 0
  }` : ''}
}`

  if (apiKey) {
    try {
      console.log(`[worksheet-llm] Requesting Gemini 3.6 Flash for topic: ${params.topic}...`)
      const response: any = await $fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: {
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            responseMimeType: 'application/json',
          }
        }
      })

      const text = response?.candidates?.[0]?.content?.parts?.[0]?.text
      if (text) {
        try {
          const cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim()
          const parsed: WorksheetContent = JSON.parse(cleanText)
          console.log(`[worksheet-llm] Gemini successfully generated worksheet with ${parsed?.sections?.length || 0} sections!`)
          return {
            content: parsed,
            usage: response?.usageMetadata || null
          }
        } catch (parseErr) {
          console.error('[worksheet-llm] JSON parse failed, dumping text to console:', text)
          throw createError({
            statusCode: 500,
            message: 'AI returned an invalid format. Please try again.'
          })
        }
      }
    } catch (err: any) {
      console.error('[worksheet-llm] Error calling Gemini API:', err)
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
    message: 'Failed to generate worksheet. Please try again.'
  })
}
