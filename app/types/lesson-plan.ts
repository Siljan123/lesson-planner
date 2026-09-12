import type { Database } from '../../shared/types/database.types'

export type LessonPlanStatus = Database['public']['Enums']['lesson_plan_status']
export type SchoolTerm = Database['public']['Enums']['school_term']
export type AppRole = Database['public']['Enums']['app_role']

export interface ActivityPhase {
  phase: string;
  title?: string;
  duration_minutes?: number;
  teacher_activity?: string;
  learner_activity?: string;
  materials?: string;
}

export interface IlawContent {
  medium_of_instruction?: string;
  intentions: {
    learning_competency: string;
    content_standards?: string;
    performance_standards?: string;
    learning_objectives: {
      cognitive?: string;
      psychomotor?: string;
      affective?: string;
    };
    learning_objectives_per_session?: {
      day: string;
      cognitive?: string;
      psychomotor?: string;
      affective?: string;
    }[];
    learner_context?: string;
  };
  learning_experience: {
    instructional_materials: string[];
    phases?: ActivityPhase[]; // legacy support
    sessions?: {
      day: string;
      pre_lesson?: string;
      learning_resources?: string;
      integration?: string;
      phases: ActivityPhase[];
    }[];
  };
  assessing_learning: {
    formative_assessment?: { // legacy
      type?: string;
      description?: string;
      sample_questions: string[];
    };
    formative_assessment_per_session?: {
      day: string;
      description?: string;
      sample_questions: string[];
    }[];
    summative_assessment?: {
      description?: string;
    };
  };
  ways_forward: {
    reflection: {
      learners_at_mastery?: string;
      learners_requiring_remediation?: string;
      effective_strategies?: string;
      challenges_encountered?: string;
    };
    remediation?: string;
    enrichment?: string;
    extended_learning?: string;
  };
}

export type LessonPlanRow = Database['public']['Tables']['lesson_plans']['Row']

export interface LessonPlan extends Omit<LessonPlanRow, 'content' | 'ai_use_declaration' | 'matatag_competency_code'> {
  matatag_competency_code: string | null;
  medium_of_instruction?: string;
  content: IlawContent;
  ai_use_declaration: {
    tool?: string;
    medium_of_instruction?: string;
    sections_ai_assisted?: string[];
    teacher_verified?: boolean;
    human_modifications_summary?: string;
    compliance_confirmed_at?: string;
    token_usage?: any;
  } | null;
  // Enriched relations
  subject?: any;
  grade_level?: string;
  grade?: any;
  topic?: string;
  duration?: string;
  source_url?: string;
  version_number?: number;
  signatory?: {
    school_name?: string;
    prepared_by_name?: string;
    prepared_by_position?: { name: string };
    prepared_by_position_id?: string;
    checked_by_name?: string;
    checked_by_position?: { name: string };
    checked_by_position_id?: string;
    checked_by_2_name?: string;
    checked_by_2_position?: { name: string };
    checked_by_2_position_id?: string;
  };
}
