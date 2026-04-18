import { axiosInstance } from "../../../api/axios.instance";
import { API_ENDPOINTS } from "../../../api/api.constants";
import type {
  Report,
  FeedbackResponse,
  ReportsListResponse,
  CriticalReportsResponse,
  StatsResponse,
} from "../../../types";

export const reportsService = {
  /**
   * 🎙️ POST /reports/upload-audio-with-feedback - Pipeline Completo ⭐
   * Sube audio, transcribe, analiza y retorna feedback questions
   */
  uploadAudioWithFeedback: async (
    payload: FormData,
  ): Promise<{
    success: boolean;
    reportId: string;
    transcription: string;
    analysis: any;
    feedbackQuestions: any[];
    feedbackQuestionsWithAudio: any[];
    message: string;
  }> => {
    try {
      const response = await axiosInstance.post(
        `${API_ENDPOINTS.REPORTS}/upload-audio-with-feedback`,
        payload,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        },
      );
      return response.data;
    } catch (error) {
      console.error("Error uploading audio with feedback:", error);
      throw error;
    }
  },

  /**
   * ⚡ POST /reports/transcribe-audio - Solo Transcripción
   * Transcribe audio sin análisis ni feedback
   */
  transcribeAudio: async (
    payload: FormData,
  ): Promise<{
    success: boolean;
    transcription: string;
    audioSizeBytes: number;
    processingTimeMs: number;
    message: string;
  }> => {
    try {
      const response = await axiosInstance.post(
        `${API_ENDPOINTS.REPORTS}/transcribe-audio`,
        payload,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        },
      );
      return response.data;
    } catch (error) {
      console.error("Error transcribing audio:", error);
      throw error;
    }
  },

  /**
   * 📝 POST /reports/process-dictation-with-feedback - Procesar Texto Directo
   * Procesa dictación de texto directamente con análisis y feedback
   */
  processDictationWithFeedback: async (payload: {
    patientId: string;
    doctorId: string;
    transcription: string;
    specialty: string;
    generateFeedback?: boolean;
    context?: string;
  }): Promise<{
    success: boolean;
    reportId: string;
    transcription: string;
    analysis: any;
    feedbackQuestions: any[];
    feedbackQuestionsWithAudio: any[];
    message: string;
  }> => {
    try {
      const response = await axiosInstance.post(
        `${API_ENDPOINTS.REPORTS}/process-dictation-with-feedback`,
        payload,
      );
      return response.data;
    } catch (error) {
      console.error("Error processing dictation with feedback:", error);
      throw error;
    }
  },

  /**
   * 💬 POST /reports/:reportId/submit-feedback - Enviar Retroalimentación
   * Envía respuestas a las preguntas de feedback
   */
  submitFeedback: async (
    reportId: string,
    payload: {
      responses: FeedbackResponse[];
    },
  ): Promise<{
    success: boolean;
    validityScore: number;
    criticalIssues: string[];
    recommendations: string[];
    summaryText: string;
    message: string;
  }> => {
    try {
      const response = await axiosInstance.post(
        `${API_ENDPOINTS.REPORTS}/${reportId}/submit-feedback`,
        payload,
      );
      return response.data;
    } catch (error) {
      console.error(`Error submitting feedback for report ${reportId}:`, error);
      throw error;
    }
  },

  /**
   * 📋 GET /reports - Listar Todos los Reportes
   * Retorna lista paginada de todos los reportes
   */
  getAllReports: async (payload?: {
    page?: number;
    limit?: number;
    sort?: string;
  }): Promise<ReportsListResponse> => {
    try {
      const response = await axiosInstance.get<ReportsListResponse>(
        `${API_ENDPOINTS.REPORTS}`,
        { params: payload },
      );
      return response.data;
    } catch (error) {
      console.error("Error fetching all reports:", error);
      throw error;
    }
  },

  /**
   * 🚨 GET /reports/critical - Reportes Críticos
   * Retorna solo los reportes con triage crítico
   */
  getCriticalReports: async (): Promise<CriticalReportsResponse> => {
    try {
      const response = await axiosInstance.get<CriticalReportsResponse>(
        `${API_ENDPOINTS.REPORTS}/critical`,
      );
      return response.data;
    } catch (error) {
      console.error("Error fetching critical reports:", error);
      throw error;
    }
  },

  /**
   * 📊 GET /reports/stats - Estadísticas
   * Retorna estadísticas agregadas de reportes
   */
  getReportsStatistics: async (): Promise<StatsResponse> => {
    try {
      const response = await axiosInstance.get<StatsResponse>(
        `${API_ENDPOINTS.REPORTS}/stats`,
      );
      return response.data;
    } catch (error) {
      console.error("Error fetching reports statistics:", error);
      throw error;
    }
  },

  /**
   * 👤 GET /reports/patient/:patientId - Reportes por Paciente
   * Retorna todos los reportes de un paciente específico
   */
  getReportsByPatient: async (
    patientId: string,
  ): Promise<{
    success: boolean;
    count: number;
    reports: Report[];
  }> => {
    try {
      const response = await axiosInstance.get<{
        success: boolean;
        count: number;
        reports: Report[];
      }>(`${API_ENDPOINTS.REPORTS}/patient/${patientId}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching reports for patient ${patientId}:`, error);
      throw error;
    }
  },

  /**
   * 👨‍⚕️ GET /reports/doctor/:doctorId - Reportes por Doctor
   * Retorna todos los reportes creados por un doctor
   */
  getReportsByDoctor: async (
    doctorId: string,
  ): Promise<{
    success: boolean;
    count: number;
    reports: Report[];
  }> => {
    try {
      const response = await axiosInstance.get<{
        success: boolean;
        count: number;
        reports: Report[];
      }>(`${API_ENDPOINTS.REPORTS}/doctor/${doctorId}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching reports for doctor ${doctorId}:`, error);
      throw error;
    }
  },

  /**
   * 📄 GET /reports/:id - Obtener Reporte Individual
   * Retorna los detalles completos de un reporte específico
   */
  getReportById: async (
    reportId: string,
  ): Promise<{
    success: boolean;
    report: Report;
  }> => {
    try {
      const response = await axiosInstance.get<{
        success: boolean;
        report: Report;
      }>(`${API_ENDPOINTS.REPORTS}/${reportId}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching report ${reportId}:`, error);
      throw error;
    }
  },

  /**
   * ✅ PATCH /reports/:id/mark-reviewed - Marcar como Revisado
   * Marca un reporte como revisado por un médico
   */
  markReportAsReviewed: async (
    reportId: string,
    payload: {
      medicoRevisorId: string;
      notes?: string;
    },
  ): Promise<{
    success: boolean;
    report: Report;
    message: string;
  }> => {
    try {
      const response = await axiosInstance.patch<{
        success: boolean;
        report: Report;
        message: string;
      }>(`${API_ENDPOINTS.REPORTS}/${reportId}/mark-reviewed`, payload);
      return response.data;
    } catch (error) {
      console.error(`Error marking report ${reportId} as reviewed:`, error);
      throw error;
    }
  },

  /**
   * 📝 PATCH /reports/:id - Actualizar Reporte
   * Actualiza campos específicos de un reporte
   */
  updateReport: async (
    reportId: string,
    payload: Partial<Report>,
  ): Promise<{
    success: boolean;
    report: Report;
    message: string;
  }> => {
    try {
      const response = await axiosInstance.patch<{
        success: boolean;
        report: Report;
        message: string;
      }>(`${API_ENDPOINTS.REPORTS}/${reportId}`, payload);
      return response.data;
    } catch (error) {
      console.error(`Error updating report ${reportId}:`, error);
      throw error;
    }
  },

  /**
   * 🗑️ DELETE /reports/:id - Eliminar Reporte
   * Elimina un reporte de forma permanente
   */
  deleteReport: async (
    reportId: string,
  ): Promise<{
    success: boolean;
    message: string;
  }> => {
    try {
      const response = await axiosInstance.delete<{
        success: boolean;
        message: string;
      }>(`${API_ENDPOINTS.REPORTS}/${reportId}`);
      return response.data;
    } catch (error) {
      console.error(`Error deleting report ${reportId}:`, error);
      throw error;
    }
  },

  /**
   * Helper: Crea FormData para upload de audio
   */
  createAudioFormData: (
    audioBlob: Blob,
    patientId: string,
    doctorId: string,
    specialty: string,
  ): FormData => {
    const formData = new FormData();
    formData.append("audio", audioBlob, "recording.wav");
    formData.append("patientId", patientId);
    formData.append("doctorId", doctorId);
    formData.append("specialty", specialty);
    return formData;
  },

  /**
   * 🏁 POST /reports/:id/finalize - Finalizar Reporte
   * Marca el reporte como procesado y finaliza el flujo
   */
  finalizeReport: async (
    reportId: string,
    payload?: {
      finalNotes?: string;
    },
  ): Promise<{
    success: boolean;
    report: Report;
    message: string;
  }> => {
    try {
      const response = await axiosInstance.post<{
        success: boolean;
        report: Report;
        message: string;
      }>(`${API_ENDPOINTS.REPORTS}/${reportId}/finalize`, payload || {});
      return response.data;
    } catch (error) {
      console.error(`Error finalizing report ${reportId}:`, error);
      throw error;
    }
  },

  /**
   * Helper: Convierte base64 audio a URL reproducible
   */
  createAudioUrl: (
    base64Data: string,
    mimeType: string = "audio/mp3",
  ): string => {
    try {
      const binary = atob(base64Data);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
      }
      const blob = new Blob([bytes], { type: mimeType });
      return URL.createObjectURL(blob);
    } catch (error) {
      console.error("Error creating audio URL:", error);
      throw error;
    }
  },
};
