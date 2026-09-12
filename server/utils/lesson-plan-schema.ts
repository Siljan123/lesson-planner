
// lesson-plan-schema.ts
import { z } from 'zod'

export const generateLessonPlanSchema = z.object({
  title: z.string().min(1),
  subject_id: z.string().uuid(),
  grade_level_id: z.string().uuid(),
  term: z.enum(['term_1', 'term_2', 'term_3']),
  matatag_competency_code: z.string().optional(),
  topic: z.string().min(1)
})

export const ilawContentSchema = z.object({
  intentions: z.object({
    learning_competency: z.string(),
    content_standards: z.string().optional(),
    performance_standards: z.string().optional(),
    learning_objectives: z.object({
      cognitive: z.string().optional(),
      psychomotor: z.string().optional(),
      affective: z.string().optional(),
    }),
    learning_objectives_per_session: z.array(z.object({
      day: z.string(),
      cognitive: z.string().optional(),
      psychomotor: z.string().optional(),
      affective: z.string().optional(),
    })).optional()
  }),
  learning_experience: z.object({
    instructional_materials: z.array(z.string()).default([]),
    phases: z.array(z.object({
      phase: z.string(),
      title: z.string().optional(),
      duration_minutes: z.number().optional(),
      teacher_activity: z.string().optional(),
      learner_activity: z.string().optional(),
      materials: z.string().optional()
    })).optional(),
    sessions: z.array(z.object({
      day: z.string(),
      pre_lesson: z.string().optional(),
      learning_resources: z.string().optional(),
      integration: z.string().optional(),
      phases: z.array(z.object({
        phase: z.string(),
        title: z.string().optional(),
        teacher_activity: z.string().optional(),
        learner_activity: z.string().optional(),
      })).default([])
    })).optional()
  }),
  assessing_learning: z.object({
    formative_assessment: z.object({
      type: z.string().optional(),
      description: z.string().optional(),
      sample_questions: z.array(z.string())
    }).optional(),
    formative_assessment_per_session: z.array(z.object({
      day: z.string(),
      description: z.string().optional(),
      sample_questions: z.array(z.string())
    })).optional(),
    summative_assessment: z.object({
      description: z.string().optional()
    }).optional()
  }),
  ways_forward: z.object({
    reflection: z.object({
      learners_at_mastery: z.string().optional(),
      learners_requiring_remediation: z.string().optional(),
      effective_strategies: z.string().optional(),
      challenges_encountered: z.string().optional()
    }),
    remediation: z.string().optional(),
    enrichment: z.string().optional()
  })
})
