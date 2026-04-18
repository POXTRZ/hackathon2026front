import { useState, useEffect, useCallback, useReducer } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAI } from "../../../ai/hooks/useAI";
import { reportsService } from "../../services/reports.service";
import { RecordingScreen } from "../screens/RecordingScreen";
import { ReportScreen } from "../screens/ReportScreen";
import type { FeedbackResponse } from "../../../../types";

type FlowState =
  | "recording"
  | "processing"
  | "results_view"
  | "feedback_view"
  | "feedback_summary"
  | "finalize_modal"
  | "completed";

interface FeedbackQuestion {
  id: string;
  question: string;
  audioBase64?: string;
}

interface ReportFlowState {
  flowState: FlowState;
  transcription: string;
  reportId: string | null;
  feedbackWithAudio: FeedbackQuestion[];
  feedbackAnswers: FeedbackResponse[];
  validityScore: number | null;
  recommendations: string[];
  reportStatus: string | null;
}

type ReportFlowAction =
  | { type: "SET_FLOW_STATE"; payload: FlowState }
  | { type: "SET_TRANSCRIPTION"; payload: string }
  | { type: "SET_REPORT_ID"; payload: string | null }
  | { type: "SET_FEEDBACK_WITH_AUDIO"; payload: FeedbackQuestion[] }
  | { type: "SET_FEEDBACK_ANSWERS"; payload: FeedbackResponse[] }
  | { type: "SET_VALIDITY_SCORE"; payload: number | null }
  | { type: "SET_RECOMMENDATIONS"; payload: string[] }
  | { type: "SET_REPORT_STATUS"; payload: string | null }
  | {
      type: "BATCH_UPDATE";
      payload: Partial<ReportFlowState>;
    }
  | { type: "RESET" };

const initialState: ReportFlowState = {
  flowState: "recording",
  transcription: "",
  reportId: null,
  feedbackWithAudio: [],
  feedbackAnswers: [],
  validityScore: null,
  recommendations: [],
  reportStatus: null,
};

function reportFlowReducer(
  state: ReportFlowState,
  action: ReportFlowAction,
): ReportFlowState {
  switch (action.type) {
    case "SET_FLOW_STATE":
      return { ...state, flowState: action.payload };
    case "SET_TRANSCRIPTION":
      return { ...state, transcription: action.payload };
    case "SET_REPORT_ID":
      return { ...state, reportId: action.payload };
    case "SET_FEEDBACK_WITH_AUDIO":
      return { ...state, feedbackWithAudio: action.payload };
    case "SET_FEEDBACK_ANSWERS":
      return { ...state, feedbackAnswers: action.payload };
    case "SET_VALIDITY_SCORE":
      return { ...state, validityScore: action.payload };
    case "SET_RECOMMENDATIONS":
      return { ...state, recommendations: action.payload };
    case "SET_REPORT_STATUS":
      return { ...state, reportStatus: action.payload };
    case "BATCH_UPDATE":
      return { ...state, ...action.payload };
    case "RESET":
      return initialState;
    default:
      return state;
  }
}

interface ReportFlowProps {
  patientId?: string;
  doctorId?: string;
}

/**
 * Main component that orchestrates the complete report flow
 * Handles state transitions between recording, processing, and report display
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const ReportFlow = ({ /* patientId, doctorId */ }: ReportFlowProps) => {
  const { isProcessing, analysis, error } = useAI();
  const [state, dispatch] = useReducer(reportFlowReducer, initialState);
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);

  // Effect: Handle analysis completion with batch updates
  useEffect(() => {
    if (analysis && !isProcessing) {
      // Extract data from analysis
      const analysisAny = analysis as unknown as {
        transcription?: string;
        report_id?: string;
        feedback_questions?: Array<{
          id: string;
          question: string;
          audio_base64?: string;
        }>;
      };

      const newTranscription =
        analysisAny.transcription || analysis.resumen || "";
      const newReportId = analysisAny.report_id;
      const feedbackQuestions = analysisAny.feedback_questions;

      // Determine next state
      const hasFeedback = feedbackQuestions && feedbackQuestions.length > 0;
      const nextFlowState: FlowState = hasFeedback
        ? "feedback_view"
        : "results_view";

      // Batch all updates together
      const batchUpdate: Partial<ReportFlowState> = {
        transcription: newTranscription,
        flowState: nextFlowState,
      };

      if (newReportId) {
        batchUpdate.reportId = newReportId;
      }

      if (hasFeedback) {
        batchUpdate.feedbackWithAudio = feedbackQuestions.map((q) => ({
          id: q.id,
          question: q.question,
          audioBase64: q.audio_base64,
        }));
      }

      dispatch({
        type: "BATCH_UPDATE",
        payload: batchUpdate,
      });
    }
  }, [analysis, isProcessing]);

  const handleSubmitFeedback = useCallback(
    async (answers: FeedbackResponse[]) => {
      if (!state.reportId) return;
      setIsSubmittingFeedback(true);
      try {
        dispatch({ type: "SET_FEEDBACK_ANSWERS", payload: answers });
        const result = await reportsService.submitFeedback(state.reportId, {
          responses: answers,
        });

        const updates: Partial<ReportFlowState> = {
          flowState: "feedback_summary",
        };

        if (result.validityScore !== undefined) {
          updates.validityScore = result.validityScore;
        }
        if (result.recommendations) {
          updates.recommendations = result.recommendations;
        }

        dispatch({ type: "BATCH_UPDATE", payload: updates });
      } catch (err) {
        console.error("Error submitting feedback:", err);
      } finally {
        setIsSubmittingFeedback(false);
      }
    },
    [state.reportId],
  );

  const handleFinalizeReport = useCallback(async () => {
    if (!state.reportId) return;
    try {
      dispatch({ type: "SET_FLOW_STATE", payload: "finalize_modal" });
      await reportsService.finalizeReport(state.reportId);
      dispatch({
        type: "BATCH_UPDATE",
        payload: {
          reportStatus: "PROCESADO",
          flowState: "completed",
        },
      });
    } catch (err) {
      console.error("Error finalizing report:", err);
      dispatch({ type: "SET_FLOW_STATE", payload: "feedback_summary" });
    }
  }, [state.reportId]);

  const handleNewRecording = useCallback(() => {
    dispatch({ type: "RESET" });
  }, []);

  return (
    <div className="space-y-6">
      <AnimatePresence mode="wait">
        {/* Recording State */}
        {state.flowState === "recording" && (
          <motion.div
            key="recording"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.3 }}
          >
            <RecordingScreen
              reportId={state.reportId}
              onFinalize={handleFinalizeReport}
            />
          </motion.div>
        )}

        {/* Processing State */}
        {state.flowState === "processing" && (
          <motion.div
            key="processing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex items-center justify-center min-h-96"
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              className="w-16 h-16 rounded-full border-4 border-slate-700 border-t-blue-500"
            />
          </motion.div>
        )}

        {/* Report Display States */}
        {(state.flowState === "results_view" ||
          state.flowState === "feedback_view" ||
          state.flowState === "feedback_summary" ||
          state.flowState === "finalize_modal" ||
          state.flowState === "completed") && (
          <motion.div
            key="report"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            <ReportScreen
              analysis={analysis}
              transcription={state.transcription}
              feedbackWithAudio={state.feedbackWithAudio}
              feedbackAnswers={state.feedbackAnswers}
              validityScore={state.validityScore}
              recommendations={state.recommendations}
              isLoading={isProcessing}
            />

            {/* Feedback Section */}
            {state.feedbackWithAudio.length > 0 &&
              (state.flowState === "results_view" ||
                state.flowState === "feedback_view") && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="mt-8 bg-[#0f172a]/80 border border-slate-800/80 rounded-2xl p-8 space-y-6"
                >
                  <h3 className="text-xl font-bold text-white">
                    Por favor, responde las siguientes preguntas
                  </h3>
                  <div className="space-y-4">
                    {state.feedbackWithAudio.map((question, idx) => {
                      const existingAnswer = state.feedbackAnswers.find(
                        (a) => a.questionId === question.id,
                      );
                      return (
                        <motion.div
                          key={question.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: idx * 0.1 }}
                          className="space-y-3 p-4 bg-slate-900/30 rounded-lg border border-slate-700/50"
                        >
                          <div>
                            <p className="text-sm font-semibold text-slate-200 mb-2">
                              {idx + 1}. {question.question}
                            </p>
                            {question.audioBase64 && (
                              <audio
                                controls
                                className="w-full h-8 mb-3"
                                src={`data:audio/mp3;base64,${question.audioBase64}`}
                              />
                            )}
                          </div>
                          <input
                            type="text"
                            placeholder="Escribe tu respuesta aquí..."
                            value={
                              typeof existingAnswer?.response === "string"
                                ? existingAnswer.response
                                : ""
                            }
                            onChange={(e) => {
                              const newAnswer: FeedbackResponse = {
                                questionId: question.id,
                                response: e.target.value,
                              };
                              dispatch({
                                type: "SET_FEEDBACK_ANSWERS",
                                payload: [
                                  ...state.feedbackAnswers.filter(
                                    (a) => a.questionId !== question.id,
                                  ),
                                  newAnswer,
                                ],
                              });
                            }}
                            className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
                          />
                        </motion.div>
                      );
                    })}
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleSubmitFeedback(state.feedbackAnswers)}
                    disabled={
                      isSubmittingFeedback ||
                      state.feedbackAnswers.length !==
                        state.feedbackWithAudio.length
                    }
                    className="w-full px-4 py-3 bg-linear-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 disabled:from-slate-600 disabled:to-slate-600 text-white rounded-lg font-bold transition-all"
                  >
                    {isSubmittingFeedback
                      ? "Guardando respuestas..."
                      : "Guardar Respuestas"}
                  </motion.button>
                </motion.div>
              )}

            {/* Completed State */}
            {state.flowState === "completed" && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="mt-8 p-8 bg-linear-to-br from-emerald-900/30 to-teal-900/20 border-2 border-emerald-500/30 rounded-2xl text-center"
              >
                <motion.div
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 0.6, repeat: Infinity }}
                  className="text-6xl mb-4"
                >
                  🎉
                </motion.div>
                <h2 className="text-3xl font-bold text-emerald-400 mb-2">
                  ¡Reporte Completado!
                </h2>
                <p className="text-slate-300 mb-6">
                  El reporte ha sido procesado exitosamente.
                </p>
                <p className="text-sm text-slate-400 mb-6">
                  Estado:{" "}
                  <span className="text-emerald-400 font-bold">
                    {state.reportStatus}
                  </span>
                </p>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleNewRecording}
                  className="px-8 py-3 bg-linear-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white rounded-lg font-bold transition-all"
                >
                  Crear Nuevo Reporte
                </motion.button>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error Display */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 bg-red-900/20 border border-red-500/30 rounded-lg text-red-400"
        >
          {error}
        </motion.div>
      )}
    </div>
  );
};
