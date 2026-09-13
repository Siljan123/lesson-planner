//docsExport.ts

import { BorderStyle, Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, PageOrientation, AlignmentType } from 'docx'
import pptxgen from 'pptxgenjs'
import type { LessonPlan } from '../../app/types/lesson-plan'

export function detectLanguage(plan: LessonPlan, explicitLang?: string): 'English' | 'Filipino' {
  if (explicitLang) {
    return explicitLang.toLowerCase().includes('eng') ? 'English' : 'Filipino'
  }
  const declared = (plan as any).medium_of_instruction ||
    (plan.content as any)?.medium_of_instruction ||
    (plan.ai_use_declaration as any)?.medium_of_instruction
  if (declared) {
    return String(declared).toLowerCase().includes('eng') ? 'English' : 'Filipino'
  }

  // Heuristic check from text sample
  const sampleText = [
    plan.content?.intentions?.learning_competency,
    plan.content?.intentions?.learner_context,
    plan.content?.learning_experience?.sessions?.[0]?.pre_lesson,
    plan.content?.learning_experience?.sessions?.[0]?.phases?.[0]?.teacher_activity,
  ].filter(Boolean).join(' ')

  if (!sampleText) return 'English'

  const filipinoMatches = (sampleText.match(/\b(ang|ng|mga|sa|para|ay|at|mula|ito|kanilang|upang|bawat|aralin|pagkatuto|mag-aaral|gawain)\b/gi) || []).length
  const englishMatches = (sampleText.match(/\b(the|and|to|of|in|for|with|learning|students|learners|lesson|activity|will|their|each|skills)\b/gi) || []).length

  return englishMatches >= filipinoMatches ? 'English' : 'Filipino'
}

export const DOC_I18N = {
  English: {
    planHeaderTitle: 'DAILY LESSON PLAN',
    planHeaderSub: '(anchored on the GUIDELINES ON LESSON PLANNING AND LEARNING DESIGN – Policy Briefer)',
    lessonTitle: 'Lesson Title',
    learningArea: 'Learning Area/s',
    teacher: 'Designed by Teacher/s',
    gradeLevel: 'Designed for which Grade Level and Section',
    noOfSessions: 'No. of Sessions',
    sessionUnit: (count: number) => `${count} ${count === 1 ? 'session' : 'sessions'}`,
    references: 'Learning Resources / References',
    referencesSub: '(books, websites, toolkits, etc.)',
    aiDeclaration: 'AI Use Declaration',
    aiDeclarationSub: 'Indicate how AI was used in developing the lesson plan.',
    aiDeclarationValue: (tool: string) => `This lesson plan was prepared with the assistance of ${tool} as an instructional drafting guide (DO 3, s. 2026).`,

    // I. INTENTIONS
    intentionsTitle: 'INTENTIONS',
    intentionsSubtitle: 'Meaningful learning experiences are grounded on how we intentionally design them.',
    learningCompetency: 'Learning Competency:',
    learningCompetencySub: 'Specify the curriculum competencies targeted for this lesson.',
    learningObjectives: 'Learning Objectives:',
    learningObjectivesSub: 'Specify the discrete knowledge, skills, or attitudes learners will develop.',
    learnerContext: 'Learner Context:',
    learnerContextSub: "Record observations about your learners' readiness, interests, and background.",
    learnerContextFallback: 'Learners actively participate in collaborative and hands-on activities with appropriate learning resources.',

    // II. LEARNING EXPERIENCE
    learningExperienceTitle: 'LEARNING EXPERIENCE',
    learningExperienceSubtitle: 'A learning experience is like a thoughtfully planned journey.',
    preLesson: 'Before the Lesson:',
    preLessonSub: 'Describe how you will prepare learners and activate prior knowledge.',
    preLessonFallback: 'Preparation, readiness check, and brief review of prior concepts.',
    lessonFlow: 'Lesson Flow:',
    lessonFlowSub: 'Describe the instructional activities to be implemented across sessions.',
    defaultPhase: 'Activity',
    instructionalMaterials: 'Learning Resources:',
    instructionalMaterialsSub: 'List instructional materials and resources that will help achieve lesson goals.',
    integration: 'Opportunities for Integration:',
    integrationSub: 'Note any meaningful cross-curricular links with other subject areas.',
    integrationFallback: 'Language, Arts, and Values Education (GMRC)',

    // III. ASSESSMENT
    assessmentTitle: 'ASSESSMENT',
    assessmentSubtitle: 'Assessments demonstrate what learners have understood and achieved.',
    formativeAssessment: 'Formative Assessment:',
    formativeAssessmentSub: 'Create tasks or checks to evaluate ongoing learning and provide timely feedback.',

    // IV. WAYS FORWARD
    waysForwardTitle: 'WAYS FORWARD',
    waysForwardSubtitle: 'Meaningful learning can also happen outside the classroom.',
    extendedLearning: 'Additional Activities / Extension:\n',
    extendedLearningSub: 'Suggest enrichment, remediation, or extended home/community learning tasks.',
    extendedLearningFallback: 'Enrichment and deepening activity at home with family.',
    reflection: "Teacher's Reflection:\n",
    reflectionSub: 'Reflect on what needs to be adapted or improved for subsequent sessions.',
    reflectionMastery: 'Learners at Mastery: ',
    reflectionRemediation: 'Requiring Remediation: ',
    reflectionStrategies: 'Effective Strategies: ',
    reflectionChallenges: 'Challenges: ',

    // Per-session reflection (DepEd DLL template)
    reflectionLabel: 'Reflections:',
    reflectionPrompt1: 'Think about what you need to change for the next session based on what happened today. Is there something the learners are interested in exploring?',
    reflectionPrompt2: 'Are some things you would like to share with your co-teachers, parents, or school leaders about your classroom experience? What would you like your instructional coach to help you with?',
    reflectionObjAchieved: '☐ The lesson objectives were achieved within the allotted time.',
    reflectionObjNotAchieved: '☐ The lesson objectives were not achieved due to:',
    reflectionReasonTime: '     ☐ lack of time',
    reflectionReasonDifficulty: '     ☐ pupils\' difficulty in understanding the lesson',
    reflectionReasonParticipation: '     ☐ limited participation and cooperation of some pupils',
    reflectionMasteryCount: '___ out of ___ pupils got 80% in the assessment.',
    reflectionTeacherNotes: 'Teacher notes / next steps: ___________________________________',

    // V. SIGNATORIES
    preparedBy: 'Prepared by:',
    checkedBy: 'Checked & reviewed by:',
    checkedBy2: 'Checked & reviewed by (2):',
    teacherDefault: 'Teacher',
    masterTeacherDefault: 'Master Teacher / Head Teacher',
    principalDefault: 'School Head / Principal',
    datePlaceholder: 'Date: __________________',
  },
  Filipino: {
    planHeaderTitle: 'DAILY LESSON PLAN',
    planHeaderSub: '(anchored on the GUIDELINES ON LESSON PLANNING AND LEARNING DESIGN – Policy Briefer)',
    lessonTitle: 'Pangalan ng Aralin',
    learningArea: 'Asignatura',
    teacher: 'Inihanda ni Guro',
    gradeLevel: 'Baitang at Seksyon',
    noOfSessions: 'Bilang ng Sesyon',
    sessionUnit: (count: number) => `${count} ${count === 1 ? 'sesyon' : 'mga sesyon'}`,
    references: 'Mga Sanggunian',
    referencesSub: '(mga aklat, website, toolkit, atbp.)',
    aiDeclaration: 'Deklarasyon ng Paggamit ng AI',
    aiDeclarationSub: 'Ibigay kung paano ginamit ang AI sa pagbuo ng banghay-aralin.',
    aiDeclarationValue: (tool: string) => `Ang lesson plan na ito ay binuo sa tulong ng ${tool} bilang gabay sa pagbabalangkas (DO 3, s. 2026).`,

    // I. INTENTIONS
    intentionsTitle: 'INTENTIONS',
    intentionsSubtitle: 'Ang mga makabuluhang karanasan sa pagkatuto ay nakabatay sa kung paano natin ito binabalangkas.',
    learningCompetency: 'Kasanayang Pampagkatuto:',
    learningCompetencySub: 'Isulat ang mga kasanayan mula sa kurikulum na ating pinupuntirya.',
    learningObjectives: 'Mga Layunin sa Pagkatuto:',
    learningObjectivesSub: 'Isulat ang mas maliliit na kaalaman, kasanayan, o gawain.',
    learnerContext: 'Konteksto ng Mag-aaral:',
    learnerContextSub: 'Isulat ang iyong mga obserbasyon sa iyong mga mag-aaral.',
    learnerContextFallback: 'Ang mga mag-aaral ay aktibong nakikilahok sa mga gawain gamit ang mga angkop na kagamitang pampagkatuto.',

    // II. LEARNING EXPERIENCE
    learningExperienceTitle: 'LEARNING EXPERIENCE',
    learningExperienceSubtitle: 'Ang isang karanasan sa pagkatuto ay parang isang pinag-isipang paglalakbay.',
    preLesson: 'Bago ang Aralin:',
    preLessonSub: 'Ilarawan kung paano mo tutulungan ang mga mag-aaral na maging handa.',
    preLessonFallback: 'Paghahanda at maikling balik-aral para sa sesyon.',
    lessonFlow: 'Daloy ng Aralin:',
    lessonFlowSub: 'Ilarawan ang mga gawain na maaari mong ipatupad sa mga sesyon.',
    defaultPhase: 'Gawain',
    instructionalMaterials: 'Mga Kagamitang Panturo:',
    instructionalMaterialsSub: 'Ilista ang mga kagamitang panturo na tutulong sa iyo na maabot ang iyong mga layunin.',
    integration: 'Mga Pagkakataon para sa Integrasyon:',
    integrationSub: 'Isulat ang anumang posibilidad na makabuluhang maiugnay ang iba pang asignatura.',
    integrationFallback: 'Wika, Sining, at Edukasyon sa Pagpapakatao (GMRC)',

    // III. ASSESSMENT
    assessmentTitle: 'ASSESSMENT',
    assessmentSubtitle: 'Ipinapakita ng mga pagtataya kung ano ang natutunan ng mga mag-aaral.',
    formativeAssessment: 'Pormatibong Pagtataya:',
    formativeAssessmentSub: 'Lumikha ng gawain o aktibidad upang suriin ang pagkatuto at magbigay ng feedback.',

    // IV. WAYS FORWARD
    waysForwardTitle: 'WAYS FORWARD',
    waysForwardSubtitle: 'Ang makabuluhang pagkatuto ay maaari ring mangyari sa labas ng silid-aralan.',
    extendedLearning: 'Mga Karagdagang Gawain:\n',
    extendedLearningSub: 'Magmungkahi ng iba pang karanasan sa pagkatuto sa labas ng silid-aralan.',
    extendedLearningFallback: 'Gawaing pampalalim sa tahanan kasama ang pamilya.',
    reflection: 'Mga Pagninilay:\n',
    reflectionSub: 'Isipin kung ano ang kailangan mong baguhin para sa susunod na sesyon.',
    reflectionMastery: 'Learners at Mastery: ',
    reflectionRemediation: 'Requiring Remediation: ',
    reflectionStrategies: 'Effective Strategies: ',
    reflectionChallenges: 'Challenges: ',

    // Per-session reflection (DepEd DLL template)
    reflectionLabel: 'Mga Pagninilay:',
    reflectionPrompt1: 'Isipin kung ano ang kailangan mong baguhin para sa susunod na sesyon batay sa nangyari ngayon. May gustong galugarin pa ba ang mga mag-aaral?',
    reflectionPrompt2: 'May nais ka bang ibahagi sa iyong mga katuwang na guro, magulang, o mga pinuno ng paaralan tungkol sa iyong karanasan sa silid-aralan? Ano ang gusto mong matulungan ka ng iyong instructional coach?',
    reflectionObjAchieved: '☐ Naabot ang mga layunin ng aralin sa loob ng itinakdang oras.',
    reflectionObjNotAchieved: '☐ Hindi naabot ang mga layunin ng aralin dahil sa:',
    reflectionReasonTime: '     ☐ kakulangan ng oras',
    reflectionReasonDifficulty: '     ☐ kahirapan ng mga mag-aaral na maunawaan ang aralin',
    reflectionReasonParticipation: '     ☐ limitadong partisipasyon at kooperasyon ng ilang mag-aaral',
    reflectionMasteryCount: '___ sa ___ na mag-aaral ang nakakuha ng 80% sa pagtataya.',
    reflectionTeacherNotes: 'Mga tala ng guro / susunod na hakbang: ___________________________________',

    // V. SIGNATORIES
    preparedBy: 'Prepared by:',
    checkedBy: 'Checked & reviewed by:',
    checkedBy2: 'Checked & reviewed by (2):',
    teacherDefault: 'Teacher',
    masterTeacherDefault: 'Master Teacher / Head Teacher',
    principalDefault: 'School Head / Principal',
    datePlaceholder: 'Date: __________________',
  }
}

export async function exportDocx(plan: LessonPlan, langOverride?: string): Promise<Buffer> {
  const lang = detectLanguage(plan, langOverride)
  const t = DOC_I18N[lang]
  const sessions = (plan.content.learning_experience?.sessions && plan.content.learning_experience.sessions.length > 0)
    ? plan.content.learning_experience.sessions
    : (plan.content.learning_experience?.phases && plan.content.learning_experience.phases.length > 0)
      ? [{ day: "Day 1", phases: plan.content.learning_experience.phases }]
      : [{ day: "Day 1", phases: [] }]

  const totalCols = sessions.length + 1
  const labelColWidth = 24
  const sessionColWidth = Math.floor((100 - labelColWidth) / sessions.length)
  const getSessionObjectives = (day: string, sessionIndex: number) => {
    const perSession = plan.content.intentions?.learning_objectives_per_session || []
    const dayNumber = String(day || '').match(/\d+/)?.[0]
    return perSession.find((objective: any) => {
      const objectiveDayNumber = String(objective?.day || '').match(/\d+/)?.[0]
      return objective.day === day || (dayNumber && objectiveDayNumber === dayNumber)
    }) || perSession[sessionIndex] || plan.content.intentions?.learning_objectives || {}
  }

  const cellMargins = { top: 120, bottom: 120, left: 140, right: 140 }
  const tableBorders = {
    top: { style: BorderStyle.SINGLE, size: 4, color: '000000' },
    bottom: { style: BorderStyle.SINGLE, size: 4, color: '000000' },
    left: { style: BorderStyle.SINGLE, size: 4, color: '000000' },
    right: { style: BorderStyle.SINGLE, size: 4, color: '000000' },
    insideHorizontal: { style: BorderStyle.SINGLE, size: 4, color: '000000' },
    insideVertical: { style: BorderStyle.SINGLE, size: 4, color: '000000' },
  }

  const createTopRow = (label: string, value: string, subText = "") => {
    return new TableRow({
      children: [
        new TableCell({
          width: { size: labelColWidth, type: WidthType.PERCENTAGE },
          margins: cellMargins,
          children: [
            new Paragraph({
              children: [
                new TextRun({ text: label, bold: true, size: 18 }),
                ...(subText ? [new TextRun({ break: 1, text: subText, size: 15, color: "555555" })] : [])
              ]
            })
          ]
        }),
        new TableCell({
          columnSpan: totalCols - 1,
          margins: cellMargins,
          children: [new Paragraph({ children: [new TextRun({ text: value || "", size: 18 })] })]
        })
      ]
    })
  }

  const createSectionBanner = (title: string, subtitle: string) => {
    return new TableRow({
      children: [
        new TableCell({
          width: { size: labelColWidth, type: WidthType.PERCENTAGE },
          shading: { fill: "D9D9D9" },
          margins: cellMargins,
          children: [new Paragraph({ children: [new TextRun({ text: title, bold: true, size: 20 })] })]
        }),
        new TableCell({
          columnSpan: totalCols - 1,
          shading: { fill: "D9D9D9" },
          margins: cellMargins,
          children: [new Paragraph({ children: [new TextRun({ text: subtitle, italics: true, size: 16, color: "444444" })] })]
        })
      ]
    })
  }

  const createPlanHeader = () => new TableRow({
    children: [
      new TableCell({
        width: { size: labelColWidth, type: WidthType.PERCENTAGE },
        margins: { top: 80, bottom: 80, left: 140, right: 140 },
        children: [new Paragraph({ children: [new TextRun({ text: t.planHeaderTitle, bold: true, size: 20 })] })]
      }),
      new TableCell({
        columnSpan: totalCols - 1,
        margins: { top: 80, bottom: 80, left: 140, right: 140 },
        children: [new Paragraph({ children: [new TextRun({ text: t.planHeaderSub, italics: true, size: 18 })], alignment: AlignmentType.CENTER })]
      })
    ]
  })

  const createLessonTitleRow = () => new TableRow({
    children: [
      new TableCell({
        width: { size: labelColWidth, type: WidthType.PERCENTAGE },
        margins: cellMargins,
        children: [
          new Paragraph({
            children: [
              new TextRun({ text: t.lessonTitle, bold: true, italics: true, size: 18 })
            ]
          })
        ]
      }),
      new TableCell({
        columnSpan: totalCols - 1,
        margins: cellMargins,
        children: [
          new Paragraph({
            children: [
              new TextRun({ text: plan.title || '', bold: true, size: 18 })
            ]
          })
        ]
      })
    ]
  })

  const createSessionHeadersRow = () => {
    return new TableRow({
      children: [
        new TableCell({
          width: { size: labelColWidth, type: WidthType.PERCENTAGE },
          shading: { fill: "F2F2F2" },
          margins: cellMargins,
          children: [new Paragraph({ text: "" })]
        }),
        ...sessions.map(s => new TableCell({
          width: { size: sessionColWidth, type: WidthType.PERCENTAGE },
          shading: { fill: "F2F2F2" },
          margins: cellMargins,
          children: [new Paragraph({ children: [new TextRun({ text: (s.day || "DAY 1").toUpperCase(), bold: true, size: 18 })], alignment: AlignmentType.CENTER })]
        }))
      ]
    })
  }

  const createMultiColRow = (label: string, subText: string, getCellContent: (session: any) => Paragraph[]) => {
    return new TableRow({
      children: [
        new TableCell({
          width: { size: labelColWidth, type: WidthType.PERCENTAGE },
          margins: cellMargins,
          children: [
            new Paragraph({
              children: [
                new TextRun({ text: label, bold: true, size: 18 }),
                ...(subText ? [new TextRun({ break: 1, text: subText, italics: true, size: 15, color: "555555" })] : [])
              ]
            })
          ]
        }),
        ...sessions.map(s => new TableCell({
          width: { size: sessionColWidth, type: WidthType.PERCENTAGE },
          margins: cellMargins,
          children: getCellContent(s)
        }))
      ]
    })
  }

  const createSignatoryCell = (
    roleLabel: string,
    name: string | undefined | null,
    position: string | undefined | null,
    widthPercent: number
  ) => {
    return new TableCell({
      width: { size: widthPercent, type: WidthType.PERCENTAGE },
      margins: { top: 140, bottom: 140, left: 160, right: 160 },
      children: [
        new Paragraph({
          children: [
            new TextRun({ text: roleLabel, bold: true, size: 16, color: "333333" })
          ],
          spacing: { after: 320 }
        }),
        new Paragraph({
          children: [
            new TextRun({
              text: (name && name.trim() ? name.trim() : "________________________").toUpperCase(),
              bold: true,
              underline: {},
              size: 17
            })
          ],
          spacing: { after: 40 }
        }),
        new Paragraph({
          children: [
            new TextRun({
              text: position && position.trim() ? position.trim() : t.teacherDefault,
              size: 15,
              color: "555555"
            })
          ],
          spacing: { after: 120 }
        }),
        new Paragraph({
          children: [
            new TextRun({
              text: t.datePlaceholder,
              size: 15,
              color: "666666"
            })
          ],
          spacing: { after: 40 }
        })
      ]
    })
  }

  const hasChecker2 = Boolean(plan.signatory?.checked_by_2_name && String(plan.signatory.checked_by_2_name).trim())
  const sigColWidth = hasChecker2 ? 33 : 50

  const signatoryCells = [
    createSignatoryCell(
      t.preparedBy,
      plan.signatory?.prepared_by_name,
      plan.signatory?.prepared_by_position?.name || t.teacherDefault,
      sigColWidth
    ),
    createSignatoryCell(
      t.checkedBy,
      plan.signatory?.checked_by_name,
      plan.signatory?.checked_by_position?.name || t.masterTeacherDefault,
      sigColWidth
    ),
    ...(hasChecker2 ? [
      createSignatoryCell(
        t.checkedBy2,
        plan.signatory?.checked_by_2_name,
        plan.signatory?.checked_by_2_position?.name || t.principalDefault,
        100 - (sigColWidth * 2)
      )
    ] : [])
  ]

  const doc = new Document({
    styles: {
      default: { document: { run: { font: 'Arial', size: 18 } } }
    },
    sections: [{
      properties: {
        page: {
          size: { orientation: PageOrientation.LANDSCAPE },
          margin: { top: 540, right: 540, bottom: 540, left: 540 },
        }
      },
      children: [
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          borders: tableBorders,
          rows: [
            createPlanHeader(),
            createLessonTitleRow(),
            createTopRow(t.learningArea, plan.subject?.name || plan.subject || ""),
            createTopRow(t.teacher, plan.signatory?.prepared_by_name || t.teacherDefault),
            createTopRow(t.gradeLevel, plan.grade?.label || plan.grade_level || ""),
            createTopRow(t.noOfSessions, t.sessionUnit(sessions.length)),
            createTopRow(t.references, (plan.content.learning_experience?.instructional_materials || []).join(", "), t.referencesSub),
            createTopRow(t.aiDeclaration, t.aiDeclarationValue(plan.ai_use_declaration?.tool || 'AI'), t.aiDeclarationSub),

            // I. INTENTIONS
            createSectionBanner(t.intentionsTitle, t.intentionsSubtitle),
            createSessionHeadersRow(),
            new TableRow({
              children: [
                new TableCell({
                  width: { size: labelColWidth, type: WidthType.PERCENTAGE },
                  margins: cellMargins,
                  children: [
                    new Paragraph({
                      children: [
                        new TextRun({ text: `${t.learningCompetency}\n`, bold: true, size: 18 }),
                        new TextRun({ text: t.learningCompetencySub, italics: true, size: 15, color: "555555" })
                      ]
                    })
                  ]
                }),
                new TableCell({
                  columnSpan: totalCols - 1,
                  margins: cellMargins,
                  children: [new Paragraph({ children: [new TextRun({ text: plan.content.intentions?.learning_competency || "", size: 18 })] })]
                })
              ]
            }),
            new TableRow({
              children: [
                new TableCell({
                  width: { size: labelColWidth, type: WidthType.PERCENTAGE },
                  margins: cellMargins,
                  children: [
                    new Paragraph({
                      children: [
                        new TextRun({ text: `${t.learningObjectives}\n`, bold: true, size: 18 }),
                        new TextRun({ text: t.learningObjectivesSub, italics: true, size: 15, color: "555555" })
                      ]
                    })
                  ]
                }),
                ...sessions.map((session, sessionIndex) => {
                  const objectives = getSessionObjectives(session.day, sessionIndex)
                  return new TableCell({
                    width: { size: sessionColWidth, type: WidthType.PERCENTAGE },
                    margins: cellMargins,
                    children: [
                      new Paragraph({ children: [new TextRun({ text: "Cognitive: ", bold: true, size: 17 }), new TextRun({ text: objectives.cognitive || "", size: 17 })] }),
                      new Paragraph({ children: [new TextRun({ text: "Psychomotor: ", bold: true, size: 17 }), new TextRun({ text: objectives.psychomotor || "", size: 17 })] }),
                      new Paragraph({ children: [new TextRun({ text: "Affective: ", bold: true, size: 17 }), new TextRun({ text: objectives.affective || "", size: 17 })] })
                    ]
                  })
                })
              ]
            }),
            new TableRow({
              children: [
                new TableCell({
                  width: { size: labelColWidth, type: WidthType.PERCENTAGE },
                  margins: cellMargins,
                  children: [
                    new Paragraph({
                      children: [
                        new TextRun({ text: `${t.learnerContext}\n`, bold: true, size: 18 }),
                        new TextRun({ text: t.learnerContextSub, italics: true, size: 15, color: "555555" })
                      ]
                    })
                  ]
                }),
                new TableCell({
                  columnSpan: totalCols - 1,
                  margins: cellMargins,
                  children: [new Paragraph({ children: [new TextRun({ text: plan.content.intentions?.learner_context || t.learnerContextFallback, size: 18 })] })]
                })
              ]
            }),

            // II. LEARNING EXPERIENCE
            createSectionBanner(t.learningExperienceTitle, t.learningExperienceSubtitle),
            createSessionHeadersRow(),
            createMultiColRow(t.preLesson, t.preLessonSub, (session) => [
              new Paragraph({ children: [new TextRun({ text: session.pre_lesson || t.preLessonFallback, size: 18 })] })
            ]),
            createMultiColRow(t.lessonFlow, t.lessonFlowSub, (session) => {
              const paragraphs: Paragraph[] = []
              const phases = session.phases || []
              phases.forEach((p: any) => {
                paragraphs.push(new Paragraph({
                  children: [new TextRun({ text: p.phase || t.defaultPhase, bold: true, size: 18 })],
                  spacing: { before: 80, after: 40 }
                }))
                if (p.teacher_activity) {
                  paragraphs.push(new Paragraph({
                    children: [
                      new TextRun({ text: "Teacher: ", bold: true, size: 17 }),
                      new TextRun({ text: p.teacher_activity, size: 17 })
                    ],
                    spacing: { after: 40 }
                  }))
                }
                if (p.learner_activity) {
                  paragraphs.push(new Paragraph({
                    children: [
                      new TextRun({ text: "Learner: ", bold: true, size: 17 }),
                      new TextRun({ text: p.learner_activity, size: 17 })
                    ],
                    spacing: { after: 80 }
                  }))
                }
              })
              return paragraphs.length > 0 ? paragraphs : [new Paragraph({ text: "" })]
            }),
            createMultiColRow(t.instructionalMaterials, t.instructionalMaterialsSub, (session) => [
              new Paragraph({ children: [new TextRun({ text: session.learning_resources || (plan.content.learning_experience?.instructional_materials || []).join(", "), size: 18 })] })
            ]),
            createMultiColRow(t.integration, t.integrationSub, (session) => [
              new Paragraph({ children: [new TextRun({ text: session.integration || t.integrationFallback, size: 18 })] })
            ]),

            // III. ASSESSMENT
            createSectionBanner(t.assessmentTitle, t.assessmentSubtitle),
            createSessionHeadersRow(),
            createMultiColRow(t.formativeAssessment, t.formativeAssessmentSub, (session) => {
              const assessment = plan.content.assessing_learning?.formative_assessment_per_session?.find((a: any) => a.day === session.day)
              if (assessment) {
                return [
                  new Paragraph({ children: [new TextRun({ text: assessment.description || "", bold: true, size: 18 })], spacing: { after: 60 } }),
                  ...(assessment.sample_questions || []).map((q: string) => new Paragraph({
                    children: [new TextRun({ text: `• ${q}`, size: 17 })],
                    spacing: { after: 40 }
                  }))
                ]
              }
              const legacyFa = plan.content.assessing_learning?.formative_assessment
              if (legacyFa) {
                return [
                  new Paragraph({ children: [new TextRun({ text: legacyFa.description || "", bold: true, size: 18 })], spacing: { after: 60 } }),
                  ...(legacyFa.sample_questions || []).map((q: string) => new Paragraph({
                    children: [new TextRun({ text: `• ${q}`, size: 17 })],
                    spacing: { after: 40 }
                  }))
                ]
              }
              return [new Paragraph({ text: "" })]
            }),

            // IV. WAYS FORWARD
            createSectionBanner(t.waysForwardTitle, t.waysForwardSubtitle),
            new TableRow({
              children: [
                new TableCell({
                  width: { size: labelColWidth, type: WidthType.PERCENTAGE },
                  margins: cellMargins,
                  children: [
                    new Paragraph({
                      children: [
                        new TextRun({ text: t.extendedLearning, bold: true, size: 18 }),
                        new TextRun({ text: t.extendedLearningSub, italics: true, size: 15, color: "555555" })
                      ]
                    })
                  ]
                }),
                new TableCell({
                  columnSpan: totalCols - 1,
                  margins: cellMargins,
                  children: [new Paragraph({ children: [new TextRun({ text: plan.content.ways_forward?.extended_learning || plan.content.ways_forward?.enrichment || t.extendedLearningFallback, size: 18 })] })]
                })
              ]
            }),
            createSessionHeadersRow(),
            createMultiColRow(t.reflectionLabel, '', (session) => {
              const reflectionData = (plan.content.ways_forward?.reflection_per_session || []).find((r: any) => r.day === session.day)
              const masteryCount = reflectionData?.mastery_count || '___'
              const totalCount = reflectionData?.total_count || '___'
              const teacherNotes = reflectionData?.teacher_notes || ''
              const masteryLine = t.reflectionMasteryCount.replace('___', masteryCount).replace('___', totalCount)

              return [
                new Paragraph({ children: [new TextRun({ text: t.reflectionPrompt1, italics: true, size: 15, color: "555555" })], spacing: { after: 100 } }),
                new Paragraph({ children: [new TextRun({ text: t.reflectionPrompt2, italics: true, size: 15, color: "555555" })], spacing: { after: 160 } }),
                new Paragraph({ children: [new TextRun({ text: t.reflectionObjAchieved, size: 16 })], spacing: { after: 60 } }),
                new Paragraph({ children: [new TextRun({ text: t.reflectionObjNotAchieved, size: 16 })], spacing: { after: 40 } }),
                new Paragraph({ children: [new TextRun({ text: t.reflectionReasonTime, size: 15 })], spacing: { after: 40 } }),
                new Paragraph({ children: [new TextRun({ text: t.reflectionReasonDifficulty, size: 15 })], spacing: { after: 40 } }),
                new Paragraph({ children: [new TextRun({ text: t.reflectionReasonParticipation, size: 15 })], spacing: { after: 80 } }),
                new Paragraph({ children: [new TextRun({ text: masteryLine, size: 16 })], spacing: { after: 80 } }),
                new Paragraph({ children: [new TextRun({ text: teacherNotes ? `Teacher notes / next steps: ${teacherNotes}` : t.reflectionTeacherNotes, size: 16 })], spacing: { after: 40 } }),
              ]
            }),

            // V. SIGNATORIES
            new TableRow({
              children: [
                new TableCell({
                  columnSpan: totalCols,
                  margins: { top: 0, bottom: 0, left: 0, right: 0 },
                  borders: {
                    top: { style: BorderStyle.SINGLE, size: 4, color: '000000' },
                    bottom: { style: BorderStyle.SINGLE, size: 4, color: '000000' },
                    left: { style: BorderStyle.SINGLE, size: 4, color: '000000' },
                    right: { style: BorderStyle.SINGLE, size: 4, color: '000000' },
                  },
                  children: [
                    new Table({
                      width: { size: 100, type: WidthType.PERCENTAGE },
                      borders: {
                        top: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
                        bottom: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
                        left: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
                        right: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
                        insideHorizontal: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
                        insideVertical: { style: BorderStyle.SINGLE, size: 4, color: '000000' },
                      },
                      rows: [
                        new TableRow({
                          children: signatoryCells
                        })
                      ]
                    })
                  ]
                })
              ]
            })
          ]
        })
      ],
    }],
  })

  const buffer = await Packer.toBuffer(doc)
  return buffer
}

export async function exportPptx(plan: LessonPlan, langOverride?: string): Promise<Buffer> {
  const lang = detectLanguage(plan, langOverride)
  const isEng = lang === 'English'
  const pres = new pptxgen()

  // Title Slide
  const slide1 = pres.addSlide()
  slide1.addText(plan.title, { x: 1, y: 1, w: 8, fontSize: 36, bold: true, align: 'center' })
  slide1.addText(`${isEng ? 'Term' : 'Kuwarter/Term'}: ${plan.term}`, { x: 1, y: 3, w: 8, fontSize: 24, align: 'center' })

  // Intentions
  const slide2 = pres.addSlide()
  slide2.addText(isEng ? 'I. Intentions' : 'I. Mga Layunin (Intentions)', { x: 0.5, y: 0.5, w: 9, fontSize: 28, bold: true })
  slide2.addText(`${isEng ? 'Competency' : 'Kasanayan'}:\n${plan.content.intentions.learning_competency}`, { x: 0.5, y: 1.5, w: 9, fontSize: 18 })
  slide2.addText(`Cognitive:\n${plan.content.intentions.learning_objectives?.cognitive || ""}`, { x: 0.5, y: 3.5, w: 9, fontSize: 18 })

  // Learning Experience
  const slide3 = pres.addSlide()
  slide3.addText(isEng ? 'II. Learning Experience' : 'II. Karanasan sa Pagkatuto (Learning Experience)', { x: 0.5, y: 0.5, w: 9, fontSize: 28, bold: true })
  let yOffset = 1.5
  const phases = plan.content.learning_experience?.phases || []
  phases.forEach(a => {
    slide3.addText(`${a.phase}: ${a.title || ''}`, { x: 0.5, y: yOffset, w: 9, fontSize: 18 })
    yOffset += 1.5
  })

  const buffer = await pres.write({ outputType: 'nodebuffer' })
  return buffer as Buffer
}
