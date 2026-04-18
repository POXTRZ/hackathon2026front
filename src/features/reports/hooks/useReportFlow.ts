import type { FeedbackResponse } from "../../../types";
import { useState, useCallback, useEffect } from "react";
import { useAI } from "../../ai/hooks/useAI";
import { reportsService } from "../services/reports.service";

type FlowState =
  | "idle"
  | "recording"
  | "processing"
  | "results_view"
  | "feedback_view"
  | "feedback_summary"
  | "finalize_modal"
  | "completed";

interface UseReportFlowState {
  flowState: FlowState;
  transcription: string;
  reportId: string | null;
  feedbackQuestions: any[];
  feedbackWithAudio: any[];
  feedbackAnswers: FeedbackResponse[];
  validityScore: number | null;
  recommendations: string[];
  reportStatus: string | null;
  isSubmittingFeedback: boolean;
  isFinalizingReport: boolean;
}

interface UseReportFlowActions {
  startRecording: () => Promise<void>;
  stopRecording: () => Promise<void>;
  submitFeedback: (answers: FeedbackResponse[]) => Promise<void>;
  finalizeReport: (notes?: string) => Promise<void>;
  startNewRecording: () => void;
  skipFeedback: () => void;
  goToResultsView: () => void;
}

/**
 * Hook for managing the complete report flow
 * Handles state transitions between recording, processing, and report display
 */
export const useReportFlow = (
  // eslint-disable-next-line @typescript-eslint/no-unused-vars

  // patientId?: string, // unused for now
  // doctorId?: string, // unused for now
): UseReportFlowState & UseReportFlowActions => {
  // AI Hook
  const {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    // isRecording,
    isProcessing,
    analysis,
    startRecording: aiStartRecording,
    stopRecording: aiStopRecording,
  } = useAI();

  // Flow State
  const [flowState, setFlowState] = useState<FlowState>("idle");
  const [transcription, setTranscription] = useState<string>("");
  const [reportId, setReportId] = useState<string | null>(null);

  // Feedback State
  const [feedbackQuestions, setFeedbackQuestions] = useState<any[]>([]);
  const [feedbackWithAudio, setFeedbackWithAudio] = useState<any[]>([]);
  const [feedbackAnswers, setFeedbackAnswers] = useState<FeedbackResponse[]>([]);
  const [validityScore, setValidityScore] = useState<number | null>(null);
  const [recommendations, setRecommendations] = useState<string[]>([]);

  // UI State
  const [reportStatus, setReportStatus] = useState<string | null>(null);
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);
  const [isFinalizingReport, setIsFinalizingReport] = useState(false);

  // Effect: Handle analysis completion
  useEffect(() => {
    if (analysis && !isProcessing) {
      // Update transcription
      if (analysis.transcription || analysis.resumen) {
        setTranscription(
          (analysis as any).transcription || analysis.resumen || "",
        );
      }

      // Extract or create report ID
      if ((analysis as any).report_id) {
        setReportId((analysis as any).report_id);
      }

      // Extract feedback questions
      if (
        (analysis as any).feedback_questions &&
        (analysis as any).feedback_questions.length > 0
      ) {
        setFeedbackQuestions((analysis as any).feedback_questions);
        setFeedbackWithAudio(
          (analysis as any).feedback_questions.map((q: any) => ({
            id: q.id,
            question: q.question,
            audioBase64: q.audio_base64,
          })),
        );
        setFlowState("feedback_view");
      } else {
        // No feedback questions, go directly to results view
        setFlowState("results_view");
      }
    }
  }, [analysis, isProcessing]);

  // Effect: Handle recording state changes
  useEffect(() => {
    if (isProcessing) {
      setFlowState("processing");
    }
  }, [isProcessing]);

  /**
   * Start recording
   */
  const startRecording = useCallback(async () => {
    try {
      setFlowState("recording");
      await aiStartRecording();
    } catch (error) {
      console.error("Error starting recording:", error);
      setFlowState("idle");
    }
  }, [aiStartRecording]);

  /**
   * Stop recording
   */
  const stopRecording = useCallback(async () => {
    try {
      const audioBlob = await aiStopRecording();
      if (audioBlob) {
        // Audio is being processed, state will update via useAI
        setFlowState("processing");
      }
    } catch (error) {
      console.error("Error stopping recording:", error);
      setFlowState("recording");
    }
  }, [aiStopRecording]);

  /**
   * Submit feedback answers
   */
  const submitFeedback = useCallback(
    async (answers: FeedbackResponse[]) => {
      if (!reportId) {
        console.error("No report ID available");
        return;
      }

      setIsSubmittingFeedback(true);
      try {
        setFeedbackAnswers(answers);

        // Submit feedback to backend
        const result = await reportsService.submitFeedback(reportId, {
          responses: answers,
        });

        // Update state with result
        if (result.validityScore !== undefined) {
          setValidityScore(result.validityScore);
        }
        if (result.recommendations) {
          setRecommendations(result.recommendations);
        }

        // Move to feedback summary
        setFlowState("feedback_summary");
      } catch (error) {
        console.error("Error submitting feedback:", error);
        setFlowState("feedback_view");
      } finally {
        setIsSubmittingFeedback(false);
      }
    },
    [reportId],
  );

  /**
   * Finalize report
   */
  const finalizeReport = useCallback(
    async (notes?: string) => {
      if (!reportId) {
        console.error("No report ID available");
        return;
      }

      setIsFinalizingReport(true);
      try {
        setFlowState("finalize_modal");

        // Finalize report in backend
        await reportsService.finalizeReport(reportId, notes ? { finalNotes: notes } : undefined);

        // Update status and move to completed state
        setReportStatus("PROCESADO");
        setFlowState("completed");
      } catch (error) {
        console.error("Error finalizing report:", error);
        setFlowState("feedback_summary");
      } finally {
        setIsFinalizingReport(false);
      }
    },
    [reportId],
  );

  /**
   * Start new recording - reset all state
   */
  const startNewRecording = useCallback(() => {
    setFlowState("idle");
    setTranscription("");
    setReportId(null);
    setFeedbackQuestions([]);
    setFeedbackWithAudio([]);
    setFeedbackAnswers([]);
    setValidityScore(null);
    setRecommendations([]);
    setReportStatus(null);
  }, []);

  /**
   * Skip feedback and go to results view
   */
  const skipFeedback = useCallback(() => {
    setFlowState("results_view");
  }, []);

  /**
   * Go to results view
   */
  const goToResultsView = useCallback(() => {
    setFlowState("results_view");
  }, []);

  return {
    // State
    flowState,
    transcription,
    reportId,
    feedbackQuestions,
    feedbackWithAudio,
    feedbackAnswers,
    validityScore,
    recommendations,
    reportStatus,
    isSubmittingFeedback,
    isFinalizingReport,
    // Actions
    startRecording,
    stopRecording,
    submitFeedback,
    finalizeReport,
    startNewRecording,
    skipFeedback,
    goToResultsView,
  };
};
