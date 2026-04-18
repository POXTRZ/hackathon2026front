import { useState, useCallback, useRef } from "react";
import { aiService } from "../services/ai.service";
import type {
  Analysis,
  AudioData,
  AIProcessResponse,
  AIAnalyzeResponse,
  Voice,
  QuotaInfo,
  HealthCheckResponse,
} from "../../../types";

interface UseAIState {
  isRecording: boolean;
  isProcessing: boolean;
  isLoading: boolean;
  error: string | null;
  analysis: Analysis | null;
  audio: AudioData | null;
  audioUrl: string | null;
  processingTime: number | null;
}

interface UseAIActions {
  startRecording: () => void;
  stopRecording: () => Promise<Blob | null>;
  processAudio: (payload: {
    dictation: string;
    patientId: string;
    doctorId: string;
    specialty: string;
    context?: string;
  }) => Promise<AIProcessResponse | null>;
  analyzeOnly: (payload: {
    dictation: string;
    specialty?: string;
    context?: string;
  }) => Promise<AIAnalyzeResponse | null>;
  synthesizeAudio: (payload: {
    text: string;
    voiceId?: string;
  }) => Promise<void>;
  getAvailableVoices: () => Promise<Voice[] | null>;
  getQuotaInfo: () => Promise<QuotaInfo | null>;
  healthCheck: () => Promise<HealthCheckResponse | null>;
  testConnectivity: () => Promise<boolean>;
  clearAnalysis: () => void;
  clearError: () => void;
  playAudio: (audioUrl: string) => void;
}

export const useAI = (): UseAIState & UseAIActions => {
  // State
  const [state, setState] = useState<UseAIState>({
    isRecording: false,
    isProcessing: false,
    isLoading: false,
    error: null,
    analysis: null,
    audio: null,
    audioUrl: null,
    processingTime: null,
  });

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // Clear error
  const clearError = useCallback(() => {
    setState((prev) => ({ ...prev, error: null }));
  }, []);

  // Clear analysis
  const clearAnalysis = useCallback(() => {
    setState((prev) => ({
      ...prev,
      analysis: null,
      audio: null,
      audioUrl: null,
      processingTime: null,
    }));
  }, []);

  // Start recording
  const startRecording = useCallback(async () => {
    try {
      clearError();
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: "audio/webm",
      });
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorder.start();
      setState((prev) => ({ ...prev, isRecording: true }));
    } catch (err) {
      const errorMsg =
        err instanceof Error ? err.message : "Error al acceder al micrófono";
      setState((prev) => ({
        ...prev,
        error: errorMsg,
        isRecording: false,
      }));
    }
  }, [clearError]);

  // Stop recording and return blob
  const stopRecording = useCallback((): Promise<Blob | null> => {
    return new Promise((resolve) => {
      if (!mediaRecorderRef.current) {
        resolve(null);
        return;
      }

      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, {
          type: "audio/webm",
        });
        audioChunksRef.current = [];

        // Stop all tracks
        mediaRecorderRef.current?.stream
          .getTracks()
          .forEach((track) => track.stop());

        setState((prev) => ({ ...prev, isRecording: false }));
        resolve(audioBlob);
      };

      mediaRecorderRef.current.stop();
    });
  }, []);

  // Process audio with analysis
  const processAudio = useCallback(
    async (payload: {
      dictation: string;
      patientId: string;
      doctorId: string;
      specialty: string;
      context?: string;
    }): Promise<AIProcessResponse | null> => {
      try {
        clearError();
        setState((prev) => ({ ...prev, isProcessing: true }));

        const startTime = Date.now();
        const result = await aiService.processAudioWithAnalysis(payload);
        const processingTime = Date.now() - startTime;

        // Crear URL de audio si está disponible
        let audioUrl: string | null = null;
        if (result.audio?.data) {
          try {
            audioUrl = aiService.createAudioBlob(result.audio.data);
          } catch (err) {
            console.error("Error creating audio blob:", err);
          }
        }

        setState((prev) => ({
          ...prev,
          analysis: result.analysis,
          audio: result.audio || null,
          audioUrl,
          processingTime,
          isProcessing: false,
        }));

        return result;
      } catch (err) {
        const errorMsg =
          err instanceof Error ? err.message : "Error procesando audio";
        setState((prev) => ({
          ...prev,
          error: errorMsg,
          isProcessing: false,
        }));
        return null;
      }
    },
    [clearError],
  );

  // Analyze only (without audio)
  const analyzeOnly = useCallback(
    async (payload: {
      dictation: string;
      specialty?: string;
      context?: string;
    }): Promise<AIAnalyzeResponse | null> => {
      try {
        clearError();
        setState((prev) => ({ ...prev, isProcessing: true }));

        const startTime = Date.now();
        const result = await aiService.analyzeOnly(payload);
        const processingTime = Date.now() - startTime;

        setState((prev) => ({
          ...prev,
          analysis: result.analysis,
          processingTime,
          isProcessing: false,
        }));

        return result;
      } catch (err) {
        const errorMsg =
          err instanceof Error ? err.message : "Error analizando dictación";
        setState((prev) => ({
          ...prev,
          error: errorMsg,
          isProcessing: false,
        }));
        return null;
      }
    },
    [clearError],
  );

  // Synthesize audio
  const synthesizeAudio = useCallback(
    async (payload: { text: string; voiceId?: string }) => {
      try {
        clearError();
        setState((prev) => ({ ...prev, isProcessing: true }));

        const result = await aiService.synthesizeAudio(payload);

        let audioUrl: string | null = null;
        if (result.audio?.data) {
          try {
            audioUrl = aiService.createAudioBlob(result.audio.data);
          } catch (err) {
            console.error("Error creating audio blob:", err);
          }
        }

        setState((prev) => ({
          ...prev,
          audio: result.audio,
          audioUrl,
          isProcessing: false,
        }));
      } catch (err) {
        const errorMsg =
          err instanceof Error ? err.message : "Error sintetizando audio";
        setState((prev) => ({
          ...prev,
          error: errorMsg,
          isProcessing: false,
        }));
      }
    },
    [clearError],
  );

  // Get available voices
  const getAvailableVoices = useCallback(async (): Promise<Voice[] | null> => {
    try {
      clearError();
      setState((prev) => ({ ...prev, isLoading: true }));

      const result = await aiService.getAvailableVoices();
      setState((prev) => ({ ...prev, isLoading: false }));

      return result.voices || null;
    } catch (err) {
      const errorMsg =
        err instanceof Error ? err.message : "Error obteniendo voces";
      setState((prev) => ({
        ...prev,
        error: errorMsg,
        isLoading: false,
      }));
      return null;
    }
  }, [clearError]);

  // Get quota info
  const getQuotaInfo = useCallback(async (): Promise<QuotaInfo | null> => {
    try {
      clearError();
      setState((prev) => ({ ...prev, isLoading: true }));

      const result = await aiService.getQuotaInfo();
      setState((prev) => ({ ...prev, isLoading: false }));

      return result.quota || null;
    } catch (err) {
      const errorMsg =
        err instanceof Error ? err.message : "Error obteniendo cuota";
      setState((prev) => ({
        ...prev,
        error: errorMsg,
        isLoading: false,
      }));
      return null;
    }
  }, [clearError]);

  // Health check
  const healthCheck =
    useCallback(async (): Promise<HealthCheckResponse | null> => {
      try {
        setState((prev) => ({ ...prev, isLoading: true }));

        const result = await aiService.healthCheck();
        setState((prev) => ({ ...prev, isLoading: false }));

        return result;
      } catch (err) {
        const errorMsg =
          err instanceof Error ? err.message : "Error en health check";
        setState((prev) => ({
          ...prev,
          error: errorMsg,
          isLoading: false,
        }));
        return null;
      }
    }, []);

  // Test connectivity
  const testConnectivity = useCallback(async (): Promise<boolean> => {
    try {
      clearError();
      setState((prev) => ({ ...prev, isLoading: true }));

      await aiService.testConnectivity();
      setState((prev) => ({ ...prev, isLoading: false }));

      return true;
    } catch (err) {
      const errorMsg =
        err instanceof Error ? err.message : "Error de conectividad";
      setState((prev) => ({
        ...prev,
        error: errorMsg,
        isLoading: false,
      }));
      return false;
    }
  }, [clearError]);

  // Play audio
  const playAudio = useCallback((audioUrl: string) => {
    try {
      const audio = new Audio(audioUrl);
      audio.play();
    } catch (err) {
      console.error("Error playing audio:", err);
    }
  }, []);

  return {
    // State
    ...state,
    // Actions
    startRecording,
    stopRecording,
    processAudio,
    analyzeOnly,
    synthesizeAudio,
    getAvailableVoices,
    getQuotaInfo,
    healthCheck,
    testConnectivity,
    clearAnalysis,
    clearError,
    playAudio,
  };
};
