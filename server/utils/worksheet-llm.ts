import type { WorksheetContent } from '~~/app/types/worksheet'

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
}): Promise<{ content: WorksheetContent; usage?: any }> {
  const apiKey = process.env.GEMINI_API_KEY
  const isEnglish = params.medium_of_instruction === 'English'
  const lang = isEnglish ? 'English' : 'Filipino'

  const prompt = `You are an expert Department of Education (DepEd) Philippines Master Teacher and Learning Materials Specialist.
Create a comprehensive, student-ready, pedagogically rigorous Learning Activity Sheet (Worksheet / Gawaing Papel) under the DepEd MATATAG Curriculum.

Subject: ${params.subject}
Grade Level: ${params.grade}
Topic: ${params.topic}
Target Competency: ${params.competency || params.topic}
Term: ${params.term || 'term_1'}
Medium of Instruction: ${lang}
${params.custom_instructions ? `Teacher Instructions / Focus Areas: ${params.custom_instructions}` : ''}
${params.lesson_plan_context ? `Aligned Lesson Plan Context:\n${typeof params.lesson_plan_context === 'string' ? params.lesson_plan_context.slice(0, 1500) : JSON.stringify(params.lesson_plan_context).slice(0, 1500)}` : ''}

CRITICAL RULES:
1. Language: Write ALL student directions, questions, and content in ${lang}. Only use official English terms if required by the curriculum (e.g. Mathematics or Science terminology).
2. Structure: Scaffold from basic recall to guided application, and finally higher-order authentic transfer.
3. Realistic & Engaging: Use age-appropriate situations, localized Filipino context, and concrete examples suitable for ${params.grade}.
4. Custom Instructions: You MUST STRICTLY FOLLOW any specific item counts or item types requested in the Teacher Instructions (e.g., if asked for 20 multiple choice items and 10 fill in the blanks, you MUST generate exactly that many items and structure the sections accordingly).
5. Provide a complete, unambiguous Answer Key and Rubric for the teacher.
${params.include_tos ? '6. Create a Table of Specification (TOS) aligning with the generated items, mapping them to cognitive levels (Remembering, Understanding, Applying, Analyzing, Evaluating, Creating).' : ''}

Return ONLY a valid JSON object matching this STRUCTURE (ADJUST the number of sections, number of items, and item types strictly based on the teacher's custom instructions! If a specific item type is not requested or requested as 0, DO NOT INCLUDE THAT SECTION at all. The item count and sections below are just examples):
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
          throw parseErr
        }
      }
    } catch (err) {
      console.error('[worksheet-llm] Error calling Gemini API:', err)
    }
  }

  console.log('[worksheet-llm] Using robust pedagogical fallback for worksheet...')
  const fallbackContent: WorksheetContent = {
    title: isEnglish
      ? `Learning Activity Sheet in ${params.subject} (${params.grade}): ${params.topic}`
      : `Gawaing Pagkatuto sa ${params.subject} (${params.grade}): ${params.topic}`,
    topic: params.topic,
    instructions: isEnglish
      ? 'Read each section carefully. Complete the exercises on the sheet and write your answers legibly.'
      : 'Basahing mabuti ang bawat bahagi. Sagutin ang mga pagsasanay at isulat ang iyong sagot nang malinaw.',
    school_header: {
      school_name: '',
      grade_section: params.grade,
      teacher_name: ''
    },
    sections: [
      {
        id: 'part-1',
        title: isEnglish ? 'Part I: Concept Recall & Multiple Choice' : 'Bahagi I: Pagkilala at Piliin ang Tamang Sagot',
        instructions: isEnglish ? 'Read each question and choose the best answer from the given choices.' : 'Basahin ang bawat tanong at piliin ang titik ng tamang sagot.',
        items: [
          {
            item_number: 1,
            question: isEnglish ? `What is the primary concept or definition of ${params.topic}?` : `Ano ang pangunahing kahulugan o batayang konsepto ng ${params.topic}?`,
            type: 'multiple_choice',
            options: [
              isEnglish ? `A. Foundational principle of ${params.topic}` : `A. Pangunahing prinsipyo ng ${params.topic}`,
              isEnglish ? 'B. Unrelated secondary concept' : 'B. Di-kaugnay na konsepto',
              isEnglish ? 'C. Opposite meaning or misconception' : 'C. Maling paniniwala',
              isEnglish ? 'D. None of the above' : 'D. Wala sa mga nabanggit'
            ],
            correct_answer: isEnglish ? `A. Foundational principle of ${params.topic}` : `A. Pangunahing prinsipyo ng ${params.topic}`,
            points: 1,
            explanation: isEnglish ? `Directly defines ${params.topic}.` : `Direktang tumutukoy sa ${params.topic}.`
          },
          {
            item_number: 2,
            question: isEnglish ? `Which of the following is an accurate example of ${params.topic}?` : `Alin sa mga sumusunod ang tamang halimbawa ng ${params.topic}?`,
            type: 'multiple_choice',
            options: [
              isEnglish ? `A. Practical daily application of ${params.topic}` : `A. Praktikal na sitwasyon ng ${params.topic}`,
              isEnglish ? 'B. Incorrect application' : 'B. Maling paglalapat',
              isEnglish ? 'C. Random unrelated process' : 'C. Di-kaugnay na gawain',
              isEnglish ? 'D. Irrelevant option' : 'D. Walang kaugnayan'
            ],
            correct_answer: isEnglish ? `A. Practical daily application of ${params.topic}` : `A. Praktikal na sitwasyon ng ${params.topic}`,
            points: 1,
            explanation: isEnglish ? 'Exemplifies the target concept.' : 'Nagpapakita ng tamang aralin.'
          },
          {
            item_number: 3,
            question: isEnglish ? `Why is it important to understand ${params.topic}?` : `Bakit mahalagang matutuhan at maunawaan ang ${params.topic}?`,
            type: 'multiple_choice',
            options: [
              isEnglish ? 'A. It guides our everyday decisions and skills' : 'A. Gabay ito sa wastong pagpapasiya at kasanayan araw-araw',
              isEnglish ? 'B. It has no practical use' : 'B. Wala itong silbi',
              isEnglish ? 'C. It causes confusion' : 'C. Nagdudulot ito ng kalituhan',
              isEnglish ? 'D. Only for examinations' : 'D. Para lamang sa pagsusulit'
            ],
            correct_answer: isEnglish ? 'A. It guides our everyday decisions and skills' : 'A. Gabay ito sa wastong pagpapasiya at kasanayan araw-araw',
            points: 1,
            explanation: isEnglish ? 'Highlights real-world value.' : 'Nagpapakita ng kahalagahan sa buhay.'
          },
          {
            item_number: 4,
            question: isEnglish ? `What should one observe when practicing skills related to ${params.topic}?` : `Ano ang dapat isaalang-alang sa pagsasagawa ng mga gawain tungkol sa ${params.topic}?`,
            type: 'multiple_choice',
            options: [
              isEnglish ? 'A. Carefulness, accuracy, and cooperation' : 'A. Pag-iingat, kawastuhan, at pagtutulungan',
              isEnglish ? 'B. Hastiness without verifying' : 'B. Pagmamadali nang walang pagsusuri',
              isEnglish ? 'C. Ignoring guidelines' : 'C. Pagbalewala sa pamantayan',
              isEnglish ? 'D. None of the above' : 'D. Wala sa nabanggit'
            ],
            correct_answer: isEnglish ? 'A. Carefulness, accuracy, and cooperation' : 'A. Pag-iingat, kawastuhan, at pagtutulungan',
            points: 1,
            explanation: isEnglish ? 'Promotes core learning habits.' : 'Nagtataguyod ng mabubuting gawi sa pagkatuto.'
          },
          {
            item_number: 5,
            question: isEnglish ? `Which step comes first when exploring ${params.topic}?` : `Ano ang unang hakbang sa pagtuklas ng ${params.topic}?`,
            type: 'multiple_choice',
            options: [
              isEnglish ? 'A. Observing and identifying key elements' : 'A. Pagmamasid at pagkilala sa mahahalagang elemento',
              isEnglish ? 'B. Skipping to the final answer' : 'B. Pagtuloy agad sa huling sagot',
              isEnglish ? 'C. Giving up immediately' : 'C. Pagsuko kaagad',
              isEnglish ? 'D. Disregarding instructions' : 'D. Hindi pakikinig sa panuto'
            ],
            correct_answer: isEnglish ? 'A. Observing and identifying key elements' : 'A. Pagmamasid at pagkilala sa mahahalagang elemento',
            points: 1,
            explanation: isEnglish ? 'Follows procedural order.' : 'Tamang pagkakasunod-sunod ng hakbang.'
          }
        ]
      },
      {
        id: 'part-2',
        title: isEnglish ? 'Part II: Guided Practice & Fill-in-the-Blank' : 'Bahagi II: Ginabayang Pagsasanay at Punan ang Patlang',
        instructions: isEnglish ? 'Complete each statement by writing the appropriate word or phrase.' : 'Punan ang bawat patlang ng wastong salita o parirala upang maging buo ang pangungusap.',
        items: [
          {
            item_number: 6,
            question: isEnglish ? `The study of ${params.topic} enables us to understand ______ in our immediate environment.` : `Ang pag-aaral ng ${params.topic} ay nagbibigay-daan upang maunawaan ang ______ sa ating paligid.`,
            type: 'fill_in_blank',
            correct_answer: isEnglish ? 'key concepts / principles' : 'mahahalagang konsepto',
            points: 1,
            explanation: isEnglish ? 'Reflects lesson focus.' : 'Tumutukoy sa pangunahing aralin.'
          },
          {
            item_number: 7,
            question: isEnglish ? `When completing tasks on ${params.topic}, learners must show ______ and attention to detail.` : `Sa paggawa ng mga gawain sa ${params.topic}, dapat magpakita ang mag-aaral ng ______ at pag-iingat.`,
            type: 'fill_in_blank',
            correct_answer: isEnglish ? 'responsibility / diligence' : 'sipag at pananagutan',
            points: 1,
            explanation: isEnglish ? 'Affective domain integration.' : 'Pagpapahalagang moral at gawi.'
          },
          {
            item_number: 8,
            question: isEnglish ? `A key characteristic that distinguishes ${params.topic} is ______.` : `Ang isang katangiang nagpapakilala sa ${params.topic} ay ang ______.`,
            type: 'fill_in_blank',
            correct_answer: isEnglish ? 'essential property' : 'katangian nito',
            points: 1,
            explanation: isEnglish ? 'Structural trait.' : 'Mahalagang katangian.'
          },
          {
            item_number: 9,
            question: isEnglish ? `In solving problems involving ${params.topic}, the most important element to check is ______.` : `Sa paglutas ng suliraning may kinalaman sa ${params.topic}, mahalagang suriin ang ______.`,
            type: 'identification',
            correct_answer: isEnglish ? 'accuracy of data' : 'kawastuhan ng datos o hakbang',
            points: 2,
            explanation: isEnglish ? 'Problem solving rigor.' : 'Kasanayan sa pagsusuri.'
          },
          {
            item_number: 10,
            question: isEnglish ? `Give one concrete scenario where ${params.topic} is applied in the home or school.` : `Magbigay ng isang kongkretong sitwasyon kung saan nailalapat ang ${params.topic} sa tahanan o paaralan.`,
            type: 'identification',
            correct_answer: isEnglish ? 'Daily practical experience' : 'Pang-araw-araw na sitwasyon',
            points: 2,
            explanation: isEnglish ? 'Real-world connection.' : 'Ugnayan sa buhay.'
          }
        ]
      },
      {
        id: 'part-3',
        title: isEnglish ? 'Part III: Authentic Application & Reflection' : 'Bahagi III: Paglalapat sa Tunay na Buhay at Repleksiyon',
        instructions: isEnglish ? 'Answer the questions thoroughly in 2 to 3 sentences.' : 'Sagutin ang mga tanong sa 2 hanggang 3 buong pangungusap.',
        items: [
          {
            item_number: 11,
            question: isEnglish
              ? `If your classmate is struggling to understand ${params.topic}, how would you explain it to them in simple words?`
              : `Kung nahihirapan ang iyong kaklase na maunawaan ang ${params.topic}, paano mo ito ipaliliwanag sa kaniya sa simpleng paraan?`,
            type: 'short_answer',
            correct_answer: isEnglish
              ? `I would use real-life examples and explain step-by-step how ${params.topic} works.`
              : `Gagamit ako ng simpleng halimbawa mula sa pang-araw-araw na buhay at ipaliliwanag ito nang may tiyaga.`,
            points: 3,
            explanation: isEnglish ? 'Scores 3 points for clear empathy and correct concept.' : '3 puntos para sa malinaw at tamang paliwanag.'
          },
          {
            item_number: 12,
            question: isEnglish
              ? `What valuable lesson or value did you realize while working on ${params.topic}?`
              : `Anong mahalagang aral o pagpapahalaga ang iyong napagtanto habang pinag-aaralan ang ${params.topic}?`,
            type: 'short_answer',
            correct_answer: isEnglish
              ? 'I realized that diligence and curiosity help me discover and apply knowledge responsibly.'
              : 'Napagtanto ko na ang pagiging matiyaga at maingat sa pag-aaral ay nakatutulong upang maging responsableng mag-aaral.',
            points: 3,
            explanation: isEnglish ? 'Scores 3 points for genuine reflection.' : '3 puntos para sa makabuluhang repleksiyon.'
          }
        ]
      }
    ],
    answer_key: [
      {
        section_title: isEnglish ? 'Part I: Concept Recall' : 'Bahagi I: Pagkilala',
        items: [
          { item_number: 1, answer: isEnglish ? 'A' : 'A', explanation: 'Correct definition' },
          { item_number: 2, answer: isEnglish ? 'A' : 'A', explanation: 'Appropriate application' },
          { item_number: 3, answer: isEnglish ? 'A' : 'A', explanation: 'Reflects real importance' },
          { item_number: 4, answer: isEnglish ? 'A' : 'A', explanation: 'Core behavior' },
          { item_number: 5, answer: isEnglish ? 'A' : 'A', explanation: 'First observation step' }
        ]
      },
      {
        section_title: isEnglish ? 'Part II: Guided Practice' : 'Bahagi II: Ginabayang Pagsasanay',
        items: [
          { item_number: 6, answer: isEnglish ? 'key concepts' : 'mahahalagang konsepto' },
          { item_number: 7, answer: isEnglish ? 'responsibility' : 'pananagutan' },
          { item_number: 8, answer: isEnglish ? 'essential property' : 'katangian' },
          { item_number: 9, answer: isEnglish ? 'accuracy' : 'kawastuhan' },
          { item_number: 10, answer: isEnglish ? 'Daily practical experience' : 'Pang-araw-araw na sitwasyon' }
        ]
      },
      {
        section_title: isEnglish ? 'Part III: Authentic Application' : 'Bahagi III: Paglalapat',
        items: [
          { item_number: 11, answer: isEnglish ? 'Explain with concrete examples and patience' : 'Ipaliwanag gamit ang simpleng halimbawa' },
          { item_number: 12, answer: isEnglish ? 'Diligence, accuracy, and active curiosity' : 'Pagiging matiyaga at maingat sa pagsusuri' }
        ]
      }
    ],
    rubric: [
      {
        criteria: isEnglish ? 'Concept Accuracy' : 'Kawastuhan ng Konsepto',
        max_points: 5,
        description: isEnglish ? 'Ideas demonstrate clear and accurate understanding.' : 'Malinaw at wasto ang ipinahayag na konsepto.'
      },
      {
        criteria: isEnglish ? 'Clarity & Expression' : 'Kalinawan ng Pagpapahayag',
        max_points: 5,
        description: isEnglish ? 'Answers are written in complete, logical sentences.' : 'Buo at maayos ang pagkakasulat ng mga pangungusap.'
      }
    ],
    teacher_notes: isEnglish
      ? 'Duration: 30-45 minutes. Provide peer support for items 11 and 12 if needed.'
      : 'Inaasahang tagal: 30-45 minuto. Maaaring magbigay ng gabay sa talakayan bago ang Bahagi III.',
    ...(params.include_tos ? {
      table_of_specification: {
        competencies: [
          {
            competency: isEnglish ? `Understand basic concepts of ${params.topic}` : `Maunawaan ang batayang konsepto ng ${params.topic}`,
            no_of_items: 5,
            remembering: 3,
            understanding: 2,
            applying: 0,
            analyzing: 0,
            evaluating: 0,
            creating: 0,
            test_placement: '1-5',
            percentage: '41.67%'
          },
          {
            competency: isEnglish ? 'Apply concepts in practical situations' : 'Ilapat ang konsepto sa mga praktikal na sitwasyon',
            no_of_items: 7,
            remembering: 0,
            understanding: 0,
            applying: 4,
            analyzing: 3,
            evaluating: 0,
            creating: 0,
            test_placement: '6-12',
            percentage: '58.33%'
          }
        ],
        total_items: 12,
        total_remembering: 3,
        total_understanding: 2,
        total_applying: 4,
        total_analyzing: 3,
        total_evaluating: 0,
        total_creating: 0
      }
    } : {})
  }

  return {
    content: fallbackContent
  }
}
