export interface VitalSigns {
  heartRate: number;
  bloodPressure: string;
  temperature: number;
}

export interface Triage {
  level: "bajo" | "medio" | "alto";
  score: number;
}

export interface Patient {
  _id: string;
  name: string;
  age: number;
  gender: "M" | "F";
  diagnosis: string;
  hospitalId: string;
  vitalSigns: VitalSigns;
  triage: Triage;
  createdAt: string;
  updatedAt: string;
  __v?: number;
}

export interface ApiResponse<T> {
  data: T;
  status: number;
  message?: string;
}

// ============= AI & REPORTS TYPES =============

/** SOAP Analysis structure */
export interface SOAPAnalysis {
  subjetivo: string;
  objetivo: string;
  analisis: string;
  plan: string;
}

/** Analysis result from AI */
export interface Analysis {
  resumen: string;
  soap: SOAPAnalysis;
  diagnostico_presuntivo: string;
  nivel_triage: number;
  nivel_triage_justificacion: string;
  especialidad: string;
  version_paciente?: string;
  hallazgos_criticos: string[];
}

/** Audio data structure */
export interface AudioData {
  available: boolean;
  format: string;
  data: string;
  sizeBytes: number;
}

/** Feedback question */
export interface FeedbackQuestion {
  id: string;
  question: string;
  category: string;
  importance: "alta" | "media" | "baja";
  expectedAnswerType: "text" | "boolean" | "multiselect";
}

/** Feedback question with audio */
export interface FeedbackQuestionWithAudio extends FeedbackQuestion {
  audioBase64: string;
}

/** Feedback response */
export interface FeedbackResponse {
  questionId: string;
  answer: string | boolean | string[];
}

/** Feedback analysis */
export interface FeedbackAnalysis {
  validityScore: number;
  criticalIssues: string[];
  recommendations: string[];
  summaryText: string;
}

/** Report generated from AI analysis */
export interface Report {
  _id: string;
  patientId: string;
  doctorId: string;
  transcription: string;
  analysis: Analysis;
  feedbackQuestions?: FeedbackQuestion[];
  feedbackSubmitted?: boolean;
  validityScore?: number;
  feedbackAnalysis?: FeedbackAnalysis;
  revisadoPorMedico?: boolean;
  medicoRevisorId?: string;
  notasRevisor?: string;
  notasAdicionales?: string;
  createdAt: string;
  updatedAt: string;
}

/** Voice available for synthesis */
export interface Voice {
  id: string;
  name: string;
  category: string;
  description: string;
  preview_url: string;
}

/** AI Process Response */
export interface AIProcessResponse {
  success: boolean;
  processingTimeMs: number;
  analysis: Analysis;
  audio?: AudioData;
  message: string;
}

/** AI Analyze Response */
export interface AIAnalyzeResponse {
  success: boolean;
  processingTimeMs: number;
  analysis: Analysis;
  message: string;
}

/** AI Synthesize Response */
export interface AISynthesizeResponse {
  success: boolean;
  audio: AudioData;
  message: string;
}

/** Quota information */
export interface QuotaInfo {
  characterCount: number;
  characterLimit: number;
  remaining: number;
  percentageUsed: number;
  percentageRemaining: number;
}

/** Health check response */
export interface HealthCheckResponse {
  healthy: boolean;
  timestamp: string;
  services: {
    gemini: boolean;
    elevenlabs: boolean;
    remainingCharacters: number;
  };
  message: string;
}

/** Reports List Response */
export interface ReportsListResponse {
  success: boolean;
  total: number;
  count: number;
  reports: Report[];
}

/** Critical Reports Response */
export interface CriticalReportsResponse {
  success: boolean;
  count: number;
  reports: Report[];
}

/** Statistics Response */
export interface StatsResponse {
  success: boolean;
  statistics: {
    totalReports: number;
    avgTriageLevel: number;
    bySpecialty: Record<string, number>;
  };
}
