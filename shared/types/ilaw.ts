export interface ILAWContent {
  intentions: {
    learning_competency: string;
    objectives: string;
  };
  learning_experience: {
    activities: {
      phase: string;
      description: string;
    }[];
  };
  assessing_learning: {
    formative: string;
    summative: string;
  };
  ways_forward: {
    reflection: string;
    remediation: string;
    enrichment: string;
  };
}

export interface LessonPlan {
  id: string;
  owner_id: string;
  subject_id: string;
  grade_level_id: string;
  template_id: string;
  title: string;
  term: 'term_1' | 'term_2' | 'term_3';
  matatag_competency_code: string;
  status: 'draft' | 'needs_review' | 'ready' | 'exported';
  content: ILAWContent;
  ai_use_declaration?: {
    tool: string;
    sections_ai_assisted: string[];
    teacher_edited: boolean;
  };
  created_at: string;
  updated_at: string;
}

export interface Subject {
  id: string;
  name: string;
  code: string;
}

export interface GradeLevel {
  id: string;
  label: string;
  sort_order: number;
}
