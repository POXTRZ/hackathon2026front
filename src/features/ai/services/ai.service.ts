import { axiosInstance } from "../../../api/axios.instance";
import { API_ENDPOINTS } from "../../../api/api.constants";
import type {
  AIProcessResponse,
  AIAnalyzeResponse,
  AISynthesizeResponse,
  Voice,
  QuotaInfo,
  HealthCheckResponse,
} from "../../../types";

export const aiService = {
  /**
   * 🔥 POST /ai/process - Procesar Dictado Completo
   * Genera análisis + audio sintetizado
   */
  processAudioWithAnalysis: async (payload: {
    dictation: string;
    patientId: string;
    doctorId: string;
    specialty: string;
    context?: string;
  }): Promise<AIProcessResponse> => {
    try {
      const response = await axiosInstance.post<AIProcessResponse>(
        `${API_ENDPOINTS.AI}/process`,
        payload,
      );
      return response.data;
    } catch (error) {
      console.error("Error processing audio with analysis:", error);
      throw error;
    }
  },

  /**
   * ⚡ POST /ai/analyze - Solo Análisis (Sin Audio)
   * Más rápido, no consume cuota de ElevenLabs
   */
  analyzeOnly: async (payload: {
    dictation: string;
    specialty?: string;
    context?: string;
  }): Promise<AIAnalyzeResponse> => {
    try {
      const response = await axiosInstance.post<AIAnalyzeResponse>(
        `${API_ENDPOINTS.AI}/analyze`,
        payload,
      );
      return response.data;
    } catch (error) {
      console.error("Error analyzing dictation:", error);
      throw error;
    }
  },

  /**
   * 🧾 POST /ai/complete-report - Completar Reporte con IA
   * Genera resumen, hallazgos, recomendaciones y nivel de riesgo
   */
  completeReport: async (payload: {
    transcript: string;
    reportId?: string;
    patientId?: string;
    doctorId?: string;
    specialty?: string;
  }): Promise<{
    success: boolean;
    report?: {
      summary: string;
      findings: string[];
      recommendations: string[];
      riskLevel: "low" | "medium" | "high";
    };
    raw?: string;
    error?: string;
  }> => {
    try {
      const response = await axiosInstance.post<{
        success: boolean;
        report?: {
          summary: string;
          findings: string[];
          recommendations: string[];
          riskLevel: "low" | "medium" | "high";
        };
        raw?: string;
        error?: string;
      }>(`${API_ENDPOINTS.AI}/complete-report`, payload);
      return response.data;
    } catch (error) {
      console.error("Error completing report:", error);
      throw error;
    }
  },

  /**
   * 🔊 POST /ai/elevenlabs/speech - Sintetizar Audio (ElevenLabs)
   * Retorna audioBase64 o audioUrl para reproducción
   */
  elevenlabsSpeech: async (payload: {
    text: string;
    voiceId?: string;
    modelId?: string;
  }): Promise<{
    success: boolean;
    audioBase64?: string;
    audioUrl?: string;
    mimeType?: string;
    error?: string;
  }> => {
    try {
      const response = await axiosInstance.post<{
        success: boolean;
        audioBase64?: string;
        audioUrl?: string;
        mimeType?: string;
        error?: string;
      }>(`${API_ENDPOINTS.AI}/elevenlabs/speech`, payload);
      return response.data;
    } catch (error) {
      console.error("Error synthesizing speech (ElevenLabs):", error);
      throw error;
    }
  },

  /**
   * 🎙️ POST /ai/synthesize - Generar Audio desde Texto
   * Sintetiza texto a voz usando ElevenLabs
   */
  synthesizeAudio: async (payload: {
    text: string;
    voiceId?: string;
  }): Promise<AISynthesizeResponse> => {
    try {
      const response = await axiosInstance.post<AISynthesizeResponse>(
        `${API_ENDPOINTS.AI}/synthesize`,
        payload,
      );
      return response.data;
    } catch (error) {
      console.error("Error synthesizing audio:", error);
      throw error;
    }
  },

  /**
   * 📋 GET /ai/voices - Obtener Voces Disponibles
   * Retorna lista de voces para síntesis
   */
  getAvailableVoices: async (): Promise<{
    success: boolean;
    voices: Voice[];
  }> => {
    try {
      const response = await axiosInstance.get<{
        success: boolean;
        voices: Voice[];
      }>(`${API_ENDPOINTS.AI}/voices`);
      return response.data;
    } catch (error) {
      console.error("Error fetching voices:", error);
      throw error;
    }
  },

  /**
   * 📊 GET /ai/quota - Información de Cuota
   * Retorna información de uso de caracteres
   */
  getQuotaInfo: async (): Promise<{ success: boolean; quota: QuotaInfo }> => {
    try {
      const response = await axiosInstance.get<{
        success: boolean;
        quota: QuotaInfo;
      }>(`${API_ENDPOINTS.AI}/quota`);
      return response.data;
    } catch (error) {
      console.error("Error fetching quota info:", error);
      throw error;
    }
  },

  /**
   * 🏥 GET /ai/health - Health Check
   * Verifica estado de servicios (Gemini, ElevenLabs)
   */
  healthCheck: async (): Promise<HealthCheckResponse> => {
    try {
      const response = await axiosInstance.get<HealthCheckResponse>(
        `${API_ENDPOINTS.AI}/health`,
      );
      return response.data;
    } catch (error) {
      console.error("Error in health check:", error);
      throw error;
    }
  },

  /**
   * 🔍 GET /ai/test - Test de Conectividad
   * Verifica que todos los endpoints estén disponibles
   */
  testConnectivity: async (): Promise<{
    status: string;
    message: string;
    timestamp: string;
    endpoints: string[];
  }> => {
    try {
      const response = await axiosInstance.get<{
        status: string;
        message: string;
        timestamp: string;
        endpoints: string[];
      }>(`${API_ENDPOINTS.AI}/test`);
      return response.data;
    } catch (error) {
      console.error("Error testing connectivity:", error);
      throw error;
    }
  },

  /**
   * Helper: Convierte base64 audio a Blob y URL reproducible
   */
  createAudioBlob: (
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
      console.error("Error creating audio blob:", error);
      throw error;
    }
  },
};
