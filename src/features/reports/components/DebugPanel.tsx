import React, { useState } from "react";
import {
  ChevronDown,
  Copy,
  AlertCircle,
  CheckCircle,
  XCircle,
  Zap,
  Volume2,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface DebugPanelProps {
  apiResponse?: any;
  isVisible?: boolean;
  onToggle?: (visible: boolean) => void;
}

interface AudioTestResult {
  base64Length: number;
  isValidBase64: boolean;
  decodedSize: number;
  canCreateBlob: boolean;
  error?: string;
}

export const DebugPanel: React.FC<DebugPanelProps> = ({
  apiResponse,
  isVisible: initialVisible = false,
  onToggle,
}) => {
  const [isVisible, setIsVisible] = useState(initialVisible);
  const [expandedSections, setExpandedSections] = useState<
    Record<string, boolean>
  >({
    response: true,
    validation: true,
    audioTest: false,
  });
  const [audioTestResults, setAudioTestResults] = useState<
    Record<string, AudioTestResult>
  >({});

  const handleToggle = (visible: boolean) => {
    setIsVisible(visible);
    onToggle?.(visible);
  };

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert("Copiado al portapapeles");
  };

  const testAudioDecoding = (base64: string, questionId: string) => {
    try {
      const result: AudioTestResult = {
        base64Length: base64.length,
        isValidBase64: true,
        decodedSize: 0,
        canCreateBlob: false,
      };

      // Test base64 decoding
      const binaryString = atob(base64);
      result.decodedSize = binaryString.length;

      // Test Uint8Array conversion
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      // Test Blob creation
      const blob = new Blob([bytes], { type: "audio/mp3" });
      result.canCreateBlob = blob.size > 0;

      setAudioTestResults((prev) => ({
        ...prev,
        [questionId]: result,
      }));
    } catch (error) {
      setAudioTestResults((prev) => ({
        ...prev,
        [questionId]: {
          base64Length: base64.length,
          isValidBase64: false,
          decodedSize: 0,
          canCreateBlob: false,
          error: String(error),
        },
      }));
    }
  };

  if (!isVisible) {
    return (
      <button
        onClick={() => handleToggle(true)}
        className="fixed bottom-4 right-4 p-2 bg-red-600 hover:bg-red-700 text-white rounded-full shadow-lg z-50"
        title="Abrir panel de debug"
      >
        <AlertCircle size={20} />
      </button>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="fixed bottom-4 right-4 w-96 max-h-[80vh] bg-slate-950 border border-red-600/50 rounded-lg shadow-2xl overflow-hidden z-50 flex flex-col"
    >
      {/* Header */}
      <div className="bg-red-900/40 border-b border-red-600/50 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Zap size={18} className="text-red-400" />
          <span className="font-bold text-red-300">🔴 DEBUG PANEL</span>
        </div>
        <button
          onClick={() => handleToggle(false)}
          className="text-slate-400 hover:text-white"
        >
          ×
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto space-y-2 p-3">
        {/* API Response Status */}
        <DebugSection
          title="📡 API Response Status"
          isExpanded={expandedSections["response"]}
          onToggle={() => toggleSection("response")}
        >
          {apiResponse ? (
            <div className="space-y-2 text-xs">
              <div className="flex items-center gap-2">
                <CheckCircle size={14} className="text-green-400" />
                <span className="text-green-300">Response recibida</span>
              </div>
              <div className="bg-slate-900/60 p-2 rounded border border-slate-700">
                <div className="text-slate-300 font-mono text-[10px] max-h-32 overflow-y-auto">
                  {JSON.stringify(
                    {
                      hasTranscription: !!apiResponse.transcription,
                      transcriptionLength:
                        apiResponse.transcription?.length || 0,
                      hasFeedbackQuestions:
                        !!apiResponse.feedbackQuestions?.length,
                      feedbackQuestionsCount:
                        apiResponse.feedbackQuestions?.length || 0,
                      hasFeedbackWithAudio:
                        !!apiResponse.feedbackQuestionsWithAudio?.length,
                      feedbackWithAudioCount:
                        apiResponse.feedbackQuestionsWithAudio?.length || 0,
                      reportId: apiResponse.reportId,
                    },
                    null,
                    2,
                  )}
                </div>
              </div>
              <button
                onClick={() =>
                  copyToClipboard(JSON.stringify(apiResponse, null, 2))
                }
                className="text-[10px] px-2 py-1 bg-slate-700 hover:bg-slate-600 rounded flex items-center gap-1"
              >
                <Copy size={12} /> Copiar JSON
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-xs text-amber-300">
              <AlertCircle size={14} />
              No hay response aún
            </div>
          )}
        </DebugSection>

        {/* Validation */}
        <DebugSection
          title="✓ Validation"
          isExpanded={expandedSections["validation"]}
          onToggle={() => toggleSection("validation")}
        >
          {apiResponse ? (
            <div className="space-y-2 text-xs">
              <ValidationItem
                label="Transcription"
                isValid={!!apiResponse.transcription}
                details={`${apiResponse.transcription?.length || 0} caracteres`}
              />
              <ValidationItem
                label="Feedback Questions"
                isValid={!!apiResponse.feedbackQuestions?.length}
                details={`${apiResponse.feedbackQuestions?.length || 0} preguntas`}
              />
              <ValidationItem
                label="Feedback With Audio"
                isValid={!!apiResponse.feedbackQuestionsWithAudio?.length}
                details={`${apiResponse.feedbackQuestionsWithAudio?.length || 0} preguntas con audio`}
              />

              {/* Check each audio question */}
              {apiResponse.feedbackQuestionsWithAudio?.length > 0 && (
                <div className="mt-2 space-y-1">
                  <span className="text-slate-400 font-semibold">
                    Preguntas con Audio:
                  </span>
                  {apiResponse.feedbackQuestionsWithAudio.map(
                    (q: any, idx: number) => (
                      <ValidationItem
                        key={q.id}
                        label={`Q${idx + 1}`}
                        isValid={!!q.audioBase64 && q.audioBase64.length > 100}
                        details={`${q.audioBase64?.length || 0} bytes`}
                      />
                    ),
                  )}
                </div>
              )}
            </div>
          ) : (
            <span className="text-xs text-slate-400">
              Esperando response del backend...
            </span>
          )}
        </DebugSection>

        {/* Audio Test */}
        <DebugSection
          title="🔊 Audio Decoding Test"
          isExpanded={expandedSections["audioTest"]}
          onToggle={() => toggleSection("audioTest")}
        >
          {apiResponse?.feedbackQuestionsWithAudio?.length > 0 ? (
            <div className="space-y-2">
              {apiResponse.feedbackQuestionsWithAudio.map(
                (q: any, idx: number) => {
                  const result = audioTestResults[q.id];
                  const hasAudio = !!q.audioBase64;

                  return (
                    <div key={q.id} className="bg-slate-900/60 p-2 rounded">
                      <button
                        onClick={() =>
                          hasAudio && testAudioDecoding(q.audioBase64, q.id)
                        }
                        className="text-[10px] px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded flex items-center gap-1 mb-1"
                        disabled={!hasAudio}
                      >
                        <Volume2 size={12} /> Test Q{idx + 1}
                      </button>

                      {result && (
                        <div className="text-[10px] space-y-1 text-slate-300">
                          <div>
                            Base64:{" "}
                            <span
                              className={
                                result.isValidBase64
                                  ? "text-green-400"
                                  : "text-red-400"
                              }
                            >
                              {result.base64Length} bytes
                            </span>
                          </div>
                          <div>
                            Decoded:{" "}
                            <span className="text-blue-300">
                              {result.decodedSize} bytes
                            </span>
                          </div>
                          <div>
                            Blob:{" "}
                            <span
                              className={
                                result.canCreateBlob
                                  ? "text-green-400"
                                  : "text-red-400"
                              }
                            >
                              {result.canCreateBlob ? "✓" : "✗"}
                            </span>
                          </div>
                          {result.error && (
                            <div className="text-red-400">{result.error}</div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                },
              )}
            </div>
          ) : (
            <span className="text-xs text-slate-400">
              No hay audio para testear
            </span>
          )}
        </DebugSection>

        {/* Backend Checklist */}
        <DebugSection
          title="📋 Backend Checklist"
          isExpanded={false}
          onToggle={() => {}}
        >
          <div className="space-y-1 text-xs">
            <ChecklistItem
              label="Devolver transcription"
              isComplete={!!apiResponse?.transcription}
            />
            <ChecklistItem
              label="Devolver feedbackQuestions[]"
              isComplete={!!apiResponse?.feedbackQuestions?.length}
            />
            <ChecklistItem
              label="Devolver feedbackQuestionsWithAudio[]"
              isComplete={!!apiResponse?.feedbackQuestionsWithAudio?.length}
            />
            <ChecklistItem
              label="Incluir audioBase64 en cada pregunta"
              isComplete={apiResponse?.feedbackQuestionsWithAudio?.every(
                (q: any) => q.audioBase64,
              )}
            />
            <ChecklistItem
              label="AudioBase64 tiene contenido válido"
              isComplete={apiResponse?.feedbackQuestionsWithAudio?.every(
                (q: any) => (q.audioBase64?.length || 0) > 100,
              )}
            />
          </div>
        </DebugSection>

        {/* Useful Commands */}
        <DebugSection
          title="💻 Useful Commands"
          isExpanded={false}
          onToggle={() => {}}
        >
          <div className="space-y-1 text-[10px]">
            <code className="bg-slate-900 p-1 rounded block break-words">
              JSON.stringify(window.__lastDebugResponse, null, 2)
            </code>
            <code className="bg-slate-900 p-1 rounded block break-words">
              console.log(window.__lastDebugResponse)
            </code>
            <button
              onClick={() => {
                (window as any).__lastDebugResponse = apiResponse;
                alert("Response guardada en window.__lastDebugResponse");
              }}
              className="text-[10px] px-2 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded"
            >
              Guardar Response
            </button>
          </div>
        </DebugSection>
      </div>
    </motion.div>
  );
};

// Sub-components
interface DebugSectionProps {
  title: string;
  isExpanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}

const DebugSection: React.FC<DebugSectionProps> = ({
  title,
  isExpanded,
  onToggle,
  children,
}) => (
  <div className="bg-slate-900/40 border border-slate-700 rounded overflow-hidden">
    <button
      onClick={onToggle}
      className="w-full px-3 py-2 flex items-center justify-between hover:bg-slate-800/40 transition-colors"
    >
      <span className="text-xs font-semibold text-slate-300">{title}</span>
      <ChevronDown
        size={16}
        className={`transition-transform ${isExpanded ? "rotate-180" : ""}`}
      />
    </button>
    <AnimatePresence>
      {isExpanded && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          className="px-3 py-2 border-t border-slate-700 bg-slate-950/60"
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  </div>
);

interface ValidationItemProps {
  label: string;
  isValid: boolean;
  details?: string;
}

const ValidationItem: React.FC<ValidationItemProps> = ({
  label,
  isValid,
  details,
}) => (
  <div className="flex items-start gap-2">
    {isValid ? (
      <CheckCircle size={14} className="text-green-400 flex-shrink-0 mt-0.5" />
    ) : (
      <XCircle size={14} className="text-red-400 flex-shrink-0 mt-0.5" />
    )}
    <div className="flex-1">
      <div className={isValid ? "text-green-300" : "text-red-300"}>
        {label}
      </div>
      {details && <div className="text-slate-400">{details}</div>}
    </div>
  </div>
);

interface ChecklistItemProps {
  label: string;
  isComplete: boolean;
}

const ChecklistItem: React.FC<ChecklistItemProps> = ({ label, isComplete }) => (
  <div className="flex items-center gap-2">
    <div
      className={`w-3 h-3 rounded border ${
        isComplete
          ? "bg-green-500 border-green-400"
          : "bg-red-500/20 border-red-400"
      }`}
    />
    <span className={isComplete ? "text-green-300" : "text-red-300"}>
      {label}
    </span>
  </div>
);
