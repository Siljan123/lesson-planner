import type { Database } from '../../shared/types/database.types'

export type WorksheetStatus = Database['public']['Enums']['lesson_plan_status']
export type SchoolTerm = Database['public']['Enums']['school_term']

export type QuestionType =
  | 'multiple_choice'
  | 'identification'
  | 'fill_in_blank'
  | 'matching'
  | 'short_answer'
  | 'essay'

export interface WorksheetItem {
  id?: string | number
  item_number?: number | string
  question: string
  type: QuestionType
  options?: string[]
  matching_pair?: { prompt: string; match: string }
  correct_answer?: string
  points?: number
  explanation?: string
}

export interface WorksheetSection {
  id: string
  title: string
  instructions: string
  items: WorksheetItem[]
}

export interface AnswerKeySection {
  section_title: string
  items: {
    item_number: number | string
    answer: string
    explanation?: string
  }[]
}

export interface RubricCriterion {
  criteria: string
  max_points: number
  description: string
}

export interface WorksheetContent {
  title: string
  topic?: string
  instructions: string
  school_header?: {
    school_name?: string
    grade_section?: string
    teacher_name?: string
  }
  sections: WorksheetSection[]
  answer_key?: AnswerKeySection[]
  rubric?: RubricCriterion[]
  teacher_notes?: string
}

export type WorksheetRow = Database['public']['Tables']['worksheets']['Row']

export interface Worksheet extends Omit<WorksheetRow, 'content' | 'ai_use_declaration'> {
  content: WorksheetContent
  ai_use_declaration: {
    tool?: string
    medium_of_instruction?: string
    model?: string
    teacher_verified?: boolean
    token_usage?: any
  } | null
  // Enriched relations
  subject?: {
    id?: string
    name: string
    code?: string
  } | null
  grade?: {
    id?: string
    label: string
  } | null
  lesson_plan?: {
    id: string
    title: string
  } | null
}
