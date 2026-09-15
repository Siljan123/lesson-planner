export interface LessonObjective {
  day: string
  cognitive: string
  psychomotor: string
  affective: string
}

export interface LessonActivity {
  day: string
  preLesson: string
  teacherAction: string
  learnerAction: string
  guidedTeacher: string
  guidedLearner: string
  materials: string
  integration: string
}

export interface LessonAssessment {
  day: string
  formative: string
}

export interface PresetLesson {
  id: string
  subjectName: string
  subjectCode: string
  gradeLabel: string
  title: string
  topic: string
  mediumOfInstruction: string
  competencyCode: string
  sessionDuration: string
  parsedDays: string[]
  teacherName: string
  checkerName: string
  principalName: string
  learnerContext: string
  waysForward: string
  objectives: LessonObjective[]
  activities: LessonActivity[]
  assessment: LessonAssessment[]
}

export interface GenerationStepMeta {
  step: number
  title: string
  desc: string
}

export const useStaticData = () => {
  const presets: PresetLesson[] = [
    {
      id: 'english-7',
      subjectName: 'English 7',
      subjectCode: 'ENG7',
      gradeLabel: 'Grade 7 - Diamond',
      title: 'Exploring Sensory Images and Figurative Language in Philippine Poetry',
      topic: 'Analyzing auditory, visual, and kinesthetic imagery in local narrative poems.',
      mediumOfInstruction: 'English',
      competencyCode: 'EN7LIT-I-1: Analyze literary texts to appreciate Philippine literature and culture; identify sensory imagery and figures of speech.',
      sessionDuration: 'Day 1, Day 2',
      parsedDays: ['Day 1', 'Day 2'],
      teacherName: 'Maria Elena Santos',
      checkerName: 'Jonathan Dela Rosa (MT I)',
      principalName: 'Dr. Corazon Bautista',
      learnerContext: 'Learners in Grade 7 - Diamond actively engage through visual, collaborative, and differentiated tasks tailored to their reading comprehension and vocabulary readiness.',
      waysForward: 'Home poetry appreciation journal: Write a 4-line reflection with sensory imagery describing an evening routine with family.',
      objectives: [
        {
          day: 'Day 1',
          cognitive: 'Identify sensory words (visual, auditory, kinesthetic) in selected stanzas of contemporary Filipino poems.',
          psychomotor: 'Categorize sensory details into graphic organizers and recite lines applying vocal emphasis.',
          affective: 'Express personal emotional connection to imagery reflecting community traditions.'
        },
        {
          day: 'Day 2',
          cognitive: 'Explain the function of simile and metaphor in highlighting cultural themes.',
          psychomotor: 'Compose a 4-line descriptive stanza illustrating a familiar local scene using sensory images.',
          affective: 'Demonstrate respect and appreciation during peer critique sessions.'
        }
      ],
      activities: [
        {
          day: 'Day 1',
          preLesson: 'Show 3 vivid photos of rural Philippine mornings. Prompt: "What do you see, hear, and feel?"',
          teacherAction: 'Recite excerpt from "The Rural Maid". Highlight descriptive sound and visual lines on the board.',
          learnerAction: 'Read aloud in chorus; underline sensory words that evoke sight and touch.',
          guidedTeacher: 'Facilitates 4-corners group categorization of sensory flashcards.',
          guidedLearner: 'Collaborate in small groups to map sensory words into sensory imagery tables.',
          materials: 'DepEd English 7 Exemplar, LAS 1.2, Audio clip, Manila paper, Sensory Chart',
          integration: 'Social Studies (Rural Heritage), Values Education (Appreciation of Community)'
        },
        {
          day: 'Day 2',
          preLesson: 'Quick-fire recap game: Match 5 phrases to their sensory domain (sight, sound, smell, taste, touch).',
          teacherAction: 'Model figurative language transformation: plain phrase vs. sensory metaphor.',
          learnerAction: 'Draft and revise descriptive sentences individually using the guided sentence starters.',
          guidedTeacher: 'Circulate and conduct formative writing mini-conferences at group tables.',
          guidedLearner: 'Exchange drafts with a peer partner and provide constructive feedback.',
          materials: 'Printed graphic organizer, poetry excerpts, marker pens, rubric handout',
          integration: 'Creative Writing (Literary Devices), Performing Arts (Choral Reading)'
        }
      ],
      assessment: [
        {
          day: 'Day 1',
          formative: 'Formative 5-item identification check on sensory categories in an unseen 6-line stanza.'
        },
        {
          day: 'Day 2',
          formative: 'Differentiated writing rubric score (Imagery clarity: 5 pts, Language precision: 5 pts).'
        }
      ]
    },
    {
      id: 'math-4',
      subjectName: 'Mathematics 4',
      subjectCode: 'MATH4',
      gradeLabel: 'Grade 4 - Mabini',
      title: 'Composing and Decomposing Numbers up to 100,000',
      topic: 'Understanding place value, expanded form, and number decomposition using base-10 representations.',
      mediumOfInstruction: 'English',
      competencyCode: 'M4NS-Ia-1.4: Read, write, compose, and decompose whole numbers up to 100 000 in symbols and in words.',
      sessionDuration: 'Day 1, Day 2',
      parsedDays: ['Day 1', 'Day 2'],
      teacherName: 'Roberto M. Cruz',
      checkerName: 'Lourdes Mendoza (MT II)',
      principalName: 'Engr. Manuel Garcia',
      learnerContext: 'Learners in Grade 4 - Mabini grasp abstract numerical values best when supported by physical manipulatives, place-value charts, and structured peer coaching.',
      waysForward: 'Take-home 3-item decomposition worksheet: Deconstruct household grocery budget numbers with parent or guardian acknowledgment.',
      objectives: [
        {
          day: 'Day 1',
          cognitive: 'Deconstruct 5-digit numbers into ten thousands, thousands, hundreds, tens, and ones.',
          psychomotor: 'Manipulate number discs and place value chips to construct assigned target values.',
          affective: 'Show perseverance and systematic habits when verifying multi-digit calculations.'
        },
        {
          day: 'Day 2',
          cognitive: 'Translate numbers between standard form, word form, and expanded notation.',
          psychomotor: 'Solve real-world shopping and budget scenarios by regrouping decomposed values.',
          affective: 'Value prudence and accuracy when dealing with money and quantity calculations.'
        }
      ],
      activities: [
        {
          day: 'Day 1',
          preLesson: 'Drill on reading 4-digit numbers using flash cards; connect to counting community population.',
          teacherAction: 'Demonstrate place-value chart decomposition using number discs: 45,230 = 40,000 + 5,000 + 200 + 30.',
          learnerAction: 'Observe, repeat place-value names in sequence, and write numbers in expanded form on whiteboards.',
          guidedTeacher: 'Provides guided practice scenarios with varying zero place holders (e.g., 60,405).',
          guidedLearner: 'Work in pairs to assemble decomposition puzzles using colored cards.',
          materials: 'DepEd Math 4 Module, Number Discs, Place Value Slider, Mini Whiteboards',
          integration: 'Financial Literacy, Social Studies (Demographics)'
        },
        {
          day: 'Day 2',
          preLesson: 'Review decomposition with "Pass the Mystery Number" hot-potato ball game.',
          teacherAction: 'Guide learners in word-to-standard notation transitions and common zero errors.',
          learnerAction: 'Solve practice problems in learner activity sheets with peer verification.',
          guidedTeacher: 'Scaffold struggling learners with physical place-value strips.',
          guidedLearner: 'Participate in the "Supermarket Inventory" calculation simulation.',
          materials: 'MATATAG Activity Sheets, Play money denominations, Chart paper',
          integration: 'Entrepreneurship, Character Education (Honesty in transactions)'
        }
      ],
      assessment: [
        {
          day: 'Day 1',
          formative: '3-item Boardwork exit ticket: Decompose 28,095, 74,310, and 90,402 into expanded form.'
        },
        {
          day: 'Day 2',
          formative: 'Short 5-item formative quiz on word-to-symbol number representations.'
        }
      ]
    },
    {
      id: 'ap-6',
      subjectName: 'Araling Panlipunan 6',
      subjectCode: 'AP6',
      gradeLabel: 'Grade 6 - Rizal',
      title: 'Ang Deklarasyon ng Kasarinlan at ang Pamahalaang Rebolusyonaryo',
      topic: 'Pagsusuri sa kahalagahan ng Deklarasyon ng Kasarinlan sa Kawit, Cavite noong Hunyo 12, 1898.',
      mediumOfInstruction: 'Filipino',
      competencyCode: 'AP6PMK-Ib-4: Nasusuri ang mga pangyayari sa himagsikan laban sa kolonyalismong Espanyol at ang deklarasyon ng kasarinlan.',
      sessionDuration: 'Day 1',
      parsedDays: ['Day 1'],
      teacherName: 'Katrina Joy Bautista',
      checkerName: 'Ferdinand Lim (HT III)',
      principalName: 'Dr. Corazon Bautista',
      learnerContext: 'Ang mga mag-aaral sa Grade 6 - Rizal ay aktibong nakikilahok sa pamamagitan ng visual, interactive, at timeline analysis batay sa kanilang antas ng pag-unawa.',
      waysForward: 'Pampalalim na panayam sa magulang o nakatatanda sa pamilya ukol sa kasaysayan ng pambansang bandila at paggunita sa Araw ng Kalayaan.',
      objectives: [
        {
          day: 'Day 1',
          cognitive: 'Naipaliliwanag ang mga mahahalagang pangyayari sa pagpapahayag ng kasarinlan sa Kawit, Cavite.',
          psychomotor: 'Nakasusulat ng maikling repleksiyon ukol sa kahalagahan ng pambansang bandila at watawat.',
          affective: 'Naipamamalas ang pagmamalaki at paggalang sa mga pambansang sagisag ng Pilipinas.'
        }
      ],
      activities: [
        {
          day: 'Day 1',
          preLesson: 'Pagpapatugtog ng Lupang Hinirang at pagpapakita ng orihinal na disenyo ng watawat ng Pilipinas.',
          teacherAction: 'Pagtatalakay sa makasaysayang tagpo noong Hunyo 12, 1898 at ang papel ni Hen. Emilio Aguinaldo.',
          learnerAction: 'Pakikinig nang masusi, pagtatala ng mahahalagang petsa at personalidad sa historical timeline.',
          guidedTeacher: 'Pagpapadaloy ng pagsusuri sa mga simbolismo ng watawat (sinag ng araw, tatlong bituin, kulay).',
          guidedLearner: 'Pangkatang pagguhit at pagpapaliwanag ng isang sagisag ng kasarinlan sa manila paper.',
          materials: 'MATATAG AP 6 Exemplar, sipi ng Acta de la Proclamación, larawan ng balkonahe sa Kawit',
          integration: 'GMRC / Edukasyon sa Pagpapakatao (Pagkamakabayan), Musika at Sining'
        }
      ],
      assessment: [
        {
          day: 'Day 1',
          formative: 'Pormatibong pagtataya: Pagsagot sa 3 gabay na tanong sa Learning Activity Sheet hinggil sa kahulugan ng kalayaan.'
        }
      ]
    }
  ]

  const stepLabels: GenerationStepMeta[] = [
    { step: 1, title: 'Aligning MATATAG Curriculum Standards', desc: 'Competency codes & standards' },
    { step: 2, title: 'Formulating 3-Domain Learning Objectives', desc: 'Cognitive, Psychomotor, Affective' },
    { step: 3, title: 'Generating Learning Flow & Teacher-Learner Activities', desc: 'Multi-day session pacing' },
    { step: 4, title: 'Drafting Formative Assessments & Integrations', desc: 'DepEd assessment rubrics' },
    { step: 5, title: 'Finalizing Ready-to-Export Daily Lesson Log', desc: 'Signatories & DO 3 declaration' }
  ]

  return {
    presets,
    stepLabels
  }
}
