// lesson-plan-response-schema.ts
// JSON Schema for structured OpenAI output — passed as response_format json_schema.
// Field "description" values act as inline instructions guiding the model towards
// DepED-compliant, specific content written from the TEACHER'S FIRST-PERSON POV,
// anchored on the DepEd Banghay-Aralin 4Es/ILAW pedagogical flow.

export function buildResponseSchema(sessionDays: string[]) {
  return {
    type: 'object' as const,
    required: ['intentions', 'learning_experience', 'assessing_learning', 'ways_forward'],
    description:
      'Generate a complete, teachable DepEd Banghay-Aralin lesson plan following the 4Es/ILAW framework. Every session must contain actual subject-matter content, step-by-step teacher facilitation, guided practice, creative group application with rubrics, generalization synthesis, multiple-choice evaluation with answer key, and home extension tasks.',
    properties: {
      // ─── I. INTENTIONS ───────────────────────────────────────────────
      intentions: {
        type: 'object' as const,
        required: [
          'learning_competency',
          'content_standards',
          'performance_standards',
          'learning_objectives',
          'learning_objectives_per_session',
          'learner_context',
        ],
        properties: {
          learning_competency: {
            type: 'string' as const,
            description:
              'The full DepEd MATATAG competency code AND description from the Curriculum Guide. Must include subject code, grade indicator, quarter, and competency number (e.g. "AP3KLR-IIa-1: Natutukoy ang payak na kahulugan ng kasaysayan at ang mga elemento nito").',
          },
          content_standards: {
            type: 'string' as const,
            description:
              'The content standard from the MATATAG Curriculum Guide that this lesson addresses. Write the full standard statement.',
          },
          performance_standards: {
            type: 'string' as const,
            description:
              'The performance standard from the MATATAG Curriculum Guide. Describe the observable output or demonstration the learner must produce.',
          },
          learning_objectives: {
            type: 'object' as const,
            required: ['cognitive', 'psychomotor', 'affective'],
            description:
              'Overall lesson objectives covering the full span of sessions. Each must start with a measurable action verb (Bloom, Simpson, Krathwohl).',
            properties: {
              cognitive: {
                type: 'string' as const,
                description:
                  "Measurable cognitive objective using Bloom's Revised Taxonomy verbs (e.g., Natutukoy, Naipaliliwanag, Nailalarawan). Must name specific topic content.",
              },
              psychomotor: {
                type: 'string' as const,
                description:
                  "Observable hands-on performance objective using Simpson's Taxonomy verbs (e.g., Nakagagawa ng malikhaing paglalahad tulad ng poster, timeline, o dula-dulaan).",
              },
              affective: {
                type: 'string' as const,
                description:
                  "Values and attitude objective using Krathwohl's Taxonomy verbs (e.g., Napahahalagahan, Naipagmamalaki ang sariling pamayanan).",
              },
            },
          },
          learning_objectives_per_session: {
            type: 'array' as const,
            description: `Must contain exactly ${sessionDays.length} items, one for each session: ${sessionDays.join(', ')}. Objectives must PROGRESS across sessions: recall → explain → apply → analyze → create → evaluate → transfer.`,
            items: {
              type: 'object' as const,
              required: ['day', 'cognitive', 'psychomotor', 'affective'],
              properties: {
                day: { type: 'string' as const },
                cognitive: {
                  type: 'string' as const,
                  description:
                    'A distinct, measurable cognitive objective for this specific day.',
                },
                psychomotor: {
                  type: 'string' as const,
                  description:
                    'A distinct hands-on performance objective for this specific day.',
                },
                affective: {
                  type: 'string' as const,
                  description:
                    'A distinct values / collaboration / responsibility objective for this specific day.',
                },
              },
            },
          },
          learner_context: {
            type: 'string' as const,
            description:
              '2-4 sentences about learner age range, developmental level, interests, prior knowledge, potential difficulties, and classroom observations. Must be specific to grade level and subject.',
          },
        },
      },

      // ─── II. LEARNING EXPERIENCE ─────────────────────────────────────
      learning_experience: {
        type: 'object' as const,
        required: ['instructional_materials', 'sessions'],
        properties: {
          instructional_materials: {
            type: 'array' as const,
            description:
              '5-8 specific, named materials with quantities where applicable (e.g. "Mga larawan ng Noon at Ngayon", "Manila paper o cartolina (5 pcs)", "Mga krayola at pentel pen", "Activity Sheets", "Larawan ng timeline").',
            items: { type: 'string' as const },
          },
          sessions: {
            type: 'array' as const,
            description: `Must contain exactly ${sessionDays.length} session objects, one for each: ${sessionDays.join(', ')}.
            
            DALOY NG ARALIN (INSTRUCTIONAL FLOW & FLOW DISCUSSION ARCHITECTURE):
            - PHASE 1 : Review of the previous lesson, Motivation, and Presentation of the lesson objective.
            - PHASE 2 : Presentation of the topic, Teacher discussion with in-depth substantive teaching script (minimum 50-70 words), Examples and explanation, and Guided questions (4-5 tiered probing questions with expected pupil answers). Include Pagsusuri ng Kamalian (error analysis).
            - PHASE 3 : Individual/pair/group activity with scoring rubrics, Practice exercises, and Real-life application.
            `,
            
            items: {
              type: 'object' as const,
              required: [
                'day',
                'pre_lesson',
                'learning_resources',
                'integration',
                'phases',
              ],
              properties: {
                day: {
                  type: 'string' as const,
                },

                pre_lesson: {
                  type: 'string' as const,
                  description:
                    'FIRST-PERSON TEACHER VOICE. Note: You may keep this brief or use it for additional preliminary routines, as the main Introduction should now be in Phase 1.',
                },

                learning_resources: {
                  type: 'string' as const,
                  description:
                    'Concrete materials, visual charts, picture cards, worksheets, manipulatives, or flashcards used in this specific session.',
                },

                integration: {
                  type: 'string' as const,
                  description:
                    'Name the specific subject AND values integration (e.g., "GMRC/Values: Pagpapahalaga at pananagutan; Reading & Literacy / Math / Science: Pagbasa, pag-unawa, o paglutas ng suliranin").',
                },

                phases: {
                  type: 'array' as const,
                  description:
                    'Exactly 3 phases in order: "Phase 1", "Phase 2", "Phase 3".',
                  items: {
                    type: 'object' as const,
                    required: [
                      'phase',
                      'teacher_activity',
                      'learner_activity',
                    ],
                    properties: {
                      phase: {
                        type: 'string' as const,
                        description:
                          'One of: "Phase 1", "Phase 2", "Phase 3".',
                      },

                      teacher_activity: {
                        type: 'string' as const,
                        description:
                          'FIRST-PERSON TEACHER VOICE REQUIRED ("Ipinakita ko...", "Itinanong ko...", "Ipinaliwanag ko...", "Iminodelo ko...", "Inilahad ko..."). MUST CONTAIN COMPLETE SUBJECT-MATTER TEACHING SCRIPT, WORKED EXAMPLES, AND THOROUGH INSTRUCTIONAL DIALOGUE (aim for at least 150-250 words per phase, especially in Phase 2): \n' +
                          '- Phase 1: Review of the previous lesson, Motivation hook, and Presentation of the lesson objective.\n' +
                          '- Phase 2: Presentation of the topic, Teacher discussion with in-depth substantive teaching script (minimum 50-80 words), Examples and explanation, and Guided questions (4-5 tiered probing questions with expected pupil answers). Include Pagsusuri ng Kamalian (error analysis).\n' +
                          '- Phase 3: Individual/pair/group activity with scoring rubrics, Practice exercises, and Real-life application.',
                      },

                      learner_activity: {
                        type: 'string' as const,
                        description:
                          'THIRD-PERSON LEARNER VOICE ("Ang mga mag-aaral ay..."). Must describe active, concrete learner participation for EACH phase: \n' +
                          '- Phase 1: Participating in review, sharing initial guesses/reactions to the hook, and understanding the objective.\n' +
                          '- Phase 2: Actively following the teacher\'s demonstration, answering probing questions, justifying their answers ("Dahil po sa..."), and correcting misconceptions.\n' +
                          '- Phase 3: Collaborating on the application output, solving practice exercises, or applying to real-life situations.',
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },

      // ─── III. ASSESSING LEARNING ─────────────────────────────────────
      assessing_learning: {
        type: 'object' as const,
        required: ['formative_assessment_per_session', 'summative_assessment'],
        properties: {
          formative_assessment_per_session: {
            type: 'array' as const,
            description: `Must contain exactly ${sessionDays.length} items, one for each: ${sessionDays.join(', ')}.`,
            items: {
              type: 'object' as const,
              required: ['day', 'description', 'sample_questions'],
              properties: {
                day: { type: 'string' as const },
                description: {
                  type: 'string' as const,
                  description:
                    'Formative assessment description and technique used (e.g., "Pagtataya: 5-item Multiple-Choice Test tungkol sa Kahulugan at Mga Elemento ng Kasaysayan").',
                },
                sample_questions: {
                  type: 'array' as const,
                  description:
                    'Must contain 5 multiple-choice questions (with choices A, B, C, D) followed by an explicit Answer Key / Susi sa Pagwawasto. E.g.: ["1. Ano ang kasaysayan? A. Kuwento tungkol sa hinaharap B. Kuwento tungkol sa nakaraan C. Kuwento tungkol sa laro D. Kuwento tungkol sa hayop", "2. Alin ang tumutukoy sa \'Sino ang sangkot?\' A. Tao B. Lugar C. Panahon D. Pangyayari", "3. ...", "4. ...", "5. ...", "Susi sa Pagwawasto: 1. B, 2. A, 3. B, 4. D, 5. B"].',
                  items: { type: 'string' as const },
                },
              },
            },
          },
          summative_assessment: {
            type: 'object' as const,
            required: ['description'],
            properties: {
              description: {
                type: 'string' as const,
                description:
                  'Performance Task description accompanied by a complete Rubric / Pamantayan sa Malikhaing Gawain table (e.g. Criteria: Kumpleto ang mga elemento ng kasaysayan = 5 puntos, Wasto at malinaw ang impormasyon = 5 puntos, Malikhaing presentasyon = 5 puntos, Pakikilahok ng bawat miyembro = 5 puntos; Kabuuang Puntos = 20).',
              },
            },
          },
        },
      },

      // ─── IV. WAYS FORWARD ────────────────────────────────────────────
      ways_forward: {
        type: 'object' as const,
        required: [
          'extended_learning',
          'reflection',
          'reflection_per_session',
          'remediation',
          'enrichment',
        ],
        properties: {
          extended_learning: {
            type: 'string' as const,
            description:
              'Takdang-Aralin / Home extension inquiry task with explicit questions (e.g. "Magtanong sa isang magulang, lolo, lola, o nakatatandang miyembro ng pamilya tungkol sa isang mahalagang kuwento sa inyong barangay. Isulat ang: Ano ang nangyari? Sino ang sangkot? Saan ito nangyari? Kailan ito nangyari? Ano ang naging pagbabago? Ibahagi sa susunod na klase.").',
          },
          reflection: {
            type: 'object' as const,
            required: [
              'learners_at_mastery',
              'learners_requiring_remediation',
              'effective_strategies',
              'challenges_encountered',
            ],
            properties: {
              learners_at_mastery: {
                type: 'string' as const,
                description:
                  'Anticipated percentage of learners achieving mastery and enrichment steps.',
              },
              learners_requiring_remediation: {
                type: 'string' as const,
                description:
                  'Targeted support plan for struggling learners.',
              },
              effective_strategies: {
                type: 'string' as const,
                description:
                  'Name effective teaching strategies (e.g., "Noon at Ngayon" visual comparison, Pinatnubayang Gawain story analysis, group poster making with rubric).',
              },
              challenges_encountered: {
                type: 'string' as const,
                description:
                  'Potential learning/pacing difficulties and mitigation steps.',
              },
            },
          },
          reflection_per_session: {
            type: 'array' as const,
            description: `Must contain exactly ${sessionDays.length} items. Blank templates for teacher post-teaching records.`,
            items: {
              type: 'object' as const,
              required: ['day'],
              properties: {
                day: { type: 'string' as const },
                objectives_achieved: {
                  type: 'string' as const,
                  description: 'Leave empty string ("") — teacher fills in after lesson.',
                },
                objectives_not_achieved_reason: {
                  type: 'string' as const,
                  description: 'Leave empty string ("") — teacher fills in after lesson.',
                },
                mastery_count: {
                  type: 'string' as const,
                  description: 'Leave empty string ("") — teacher fills in after lesson.',
                },
                total_count: {
                  type: 'string' as const,
                  description: 'Leave empty string ("") — teacher fills in after lesson.',
                },
                teacher_notes: {
                  type: 'string' as const,
                  description: 'Leave empty string ("") — teacher fills in after lesson.',
                },
              },
            },
          },
          remediation: {
            type: 'string' as const,
            description:
              'Structured re-teaching activity with simplified graphic organizers (e.g., matching cards for elements) for struggling learners.',
          },
          enrichment: {
            type: 'string' as const,
            description:
              'Higher-order thinking challenge (e.g. creating a multi-event community timeline) for advanced learners.',
          },
        },
      },
    },
  }
}
