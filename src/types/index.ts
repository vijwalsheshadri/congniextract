export type SourceType = 'text' | 'txt' | 'pdf' | 'docx';

export interface PosTag {
  text: string;
  tag: string;
  start: number;
  end: number;
}

export interface Entity {
  text: string;
  type: string;
  start: number;
  end: number;
}

export interface Relation {
  subject: string;
  predicate: string;
  object: string;
  subjectType: string;
  objectType: string;
}

export interface ExtractedEvent {
  trigger: string;
  type: string;
  participants: string[];
  location?: string;
  time?: string;
  description: string;
}

export interface TimelineEvent {
  event: string;
  rawTime: string;
  order: number;
  date?: string;
  description: string;
}

export interface AnalysisSummary {
  wordCount: number;
  sentenceCount: number;
  posTagCounts: Record<string, number>;
  entityCounts: Record<string, number>;
  relationCount: number;
  eventCount: number;
}

export interface AnalysisResult {
  id: string;
  document_id: string;
  user_id: string;
  pos_tags: PosTag[];
  entities: Entity[];
  relations: Relation[];
  events: ExtractedEvent[];
  timeline: TimelineEvent[];
  summary: AnalysisSummary;
  created_at: string;
}

export interface DocumentRecord {
  id: string;
  user_id: string;
  filename: string;
  extracted_text: string;
  source_type: SourceType;
  created_at: string;
}

export interface DocumentWithAnalysis extends DocumentRecord {
  analysis?: AnalysisResult[];
}
