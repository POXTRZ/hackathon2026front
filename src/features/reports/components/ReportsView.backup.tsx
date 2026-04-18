import { useState } from "react";
import {
  Activity,
  Mic,
  Brain,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Loader,
  Send,
  User,
  Users,
  FileText,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { useAI } from "../../ai/hooks/useAI";
import { reportsService } from "../services/reports.service";
import { SimpleAudioPlayer } from "./SimplAudioPlayer";
import { DebugPanel } from "./DebugPanel";
import type { FeedbackResponse } from "../../../types";

const TRIAGE_TREND = [
  { name: "00h", value: 30, prediction: 35 },
  { name: "04h", value: 25, prediction: 28 },
  { name: "08h", value: 65, prediction: 70 },
  { name: "12h", value: 85, prediction: 82 },
  { name: "16h", value: 55, prediction: 60 },
  { name: "20h", value: 90, prediction: 95 },
];

const TRIAGE_COLORS: Record<
  number,
  { bg: string; border: string; text: string }
> = {
  1: {
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/30",
    text: "text-emerald-400",
  },
  2: {
    bg: "bg-yellow-500/10",
    border: "border-yellow-500/30",
    text: "text-yellow-400",
  },
  3: {
    bg: "bg-orange-500/10",
    border: "border-orange-500/30",
    text: "text-orange-400",
  },
  4: { bg: "bg-red-500/10", border: "border-red-500/30", text: "text-red-400" },
  5: { bg: "bg-red-600/10", border: "border-red-600/30", text: "text-red-500" },
};

// Datos hardcodeados de pacientes y médicos
const PATIENTS = [
  { id: "PAT001", name: "Juan García López", age: 45 },
  { id: "PAT002", name: "María Rodríguez Pérez", age: 67 },
  { id: "PAT003", name: "Carlos Martínez Silva", age: 52 },
];

const DOCTORS = [
  { id: "DOC001", name: "Dr. Fernando López", specialty: "Cardiología" },
  { id: "DOC002", name: "Dra. Carmen García", specialty: "Emergencia" },
  { id: "DOC003", name: "Dr. Roberto Díaz", specialty: "Cirugía" },
];

export const ReportsView = () => {
  const {
    isRecording,
    isProcessing,
    analysis,
    error,
    startRecording,
    stopRecording,
    clearError,
  } = useAI();

  // State
  const [selectedPatient, setSelectedPatient] = useState(PATIENTS[0]);
  const [selectedDoctor, setSelectedDoctor] = useState(DOCTORS[0]);
  const [transcription, setTranscription] = useState<string>("");
  const [feedbackQuestions, setFeedbackQuestions] = useState<any[]>([]);
  const [feedbackWithAudio, setFeedbackWithAudio] = useState<any[]>([]);
  const [feedbackAnswers, setFeedbackAnswers] = useState<FeedbackResponse[]>(
    [],
  );
  const [reportId, setReportId] = useState<string | null>(null);
  const [submittingFeedback, setSubmittingFeedback] = useState(false);
  const [validityScore, setValidityScore] = useState<number | null>(null);
  const [recommendations, setRecommendations] = useState<string[]>([]);
  const [debugResponse, setDebugResponse] = useState<any>(null);
  const [showDebug, setShowDebug] = useState(false);

  const handleRecord = async () => {
    if (!isRecording) {
      clearError();
      await startRecording();
    } else {
      const audioBlob = await stopRecording();
      if (audioBlob) {
        console.log("📢 Audio grabado, tamaño:", audioBlob.size, "bytes");
        await uploadAndAnalyzeAudio(audioBlob);
      }
    }
  };

  const uploadAndAnalyzeAudio = async (audioBlob: Blob) => {
    try {
      clearError();
      const formData = reportsService.createAudioFormData(
        audioBlob,
        selectedPatient.id,
        selectedDoctor.id,
        selectedDoctor.specialty,
      );

      const result = await reportsService.uploadAudioWithFeedback(formData);

      // Store for debug panel
      setDebugResponse(result);
      setShowDebug(true);

      console.log("=== BACKEND RESPONSE ===");
      console.log("✅ Full response:", result);
      console.log("📝 Transcription:", result.transcription?.substring(0, 100));
      console.log(
        "📊 Feedback questions count:",
        result.feedbackQuestions?.length,
      );
      console.log(
        "🎵 Audio questions count:",
        result.feedbackQuestionsWithAudio?.length,
      );

      // Log each audio question
      if (
        result.feedbackQuestionsWithAudio &&
        result.feedbackQuestionsWithAudio.length > 0
      ) {
        console.log("--- Audio Questions Details ---");
        result.feedbackQuestionsWithAudio.forEach((q, idx) => {
          const audioLength = q.audioBase64?.length || 0;
          const audioSample = q.audioBase64?.substring(0, 50) || "NO AUDIO";
          console.log(`Q${idx + 1}:`, {
            id: q.id,
            question: q.question?.substring(0, 60) + "...",
            audioBase64Length: audioLength,
            audioBase64Sample: audioSample,
            hasAudio: audioLength > 100,
          });
        });
      } else {
        console.warn("⚠️ No audio questions returned from backend!");
      }

      setReportId(result.reportId);
      setTranscription(result.transcription || "");
      setFeedbackQuestions(result.feedbackQuestions || []);
      setFeedbackWithAudio(result.feedbackQuestionsWithAudio || []);
      setFeedbackAnswers([]);
      setValidityScore(null);
      setRecommendations([]);
    } catch (err) {
      console.error("❌ Error uploading audio:", err);
    }
  };

  const handleFeedbackChange = (questionId: string, answer: string) => {
    setFeedbackAnswers((prev) => {
      const existing = prev.find((r) => r.questionId === questionId);
      if (existing) {
        return prev.map((r) =>
          r.questionId === questionId ? { ...r, answer } : r,
        );
      }
      return [...prev, { questionId, answer }];
    });
  };

  const handleSubmitFeedback = async () => {
    if (!reportId || feedbackAnswers.length === 0) return;

    try {
      setSubmittingFeedback(true);
      const result = await reportsService.submitFeedback(reportId, {
        responses: feedbackAnswers,
      });

      setValidityScore(result.validityScore);
      setRecommendations(result.recommendations || []);
    } catch (err) {
      console.error("Error submitting feedback:", err);
    } finally {
      setSubmittingFeedback(false);
    }
  };

  const getTriageColor = (level: number) => {
    return TRIAGE_COLORS[level] || TRIAGE_COLORS[3];
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="grid grid-cols-1 lg:grid-cols-3 gap-8"
    >
      {/* Main Content */}
      <div className="lg:col-span-2 space-y-8">
        {/* Patient & Doctor Selector */}
        <motion.div className="bg-[#0f172a]/80 border border-slate-800/80 rounded-[2rem] p-8 backdrop-blur-2xl shadow-2xl">
          <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
            <Users size={20} className="text-blue-400" />
            Seleccionar Paciente y Médico
          </h3>

          <div className="grid grid-cols-2 gap-6">
            {/* Patient Selector */}
            <div>
              <label className="block text-sm font-bold text-slate-300 mb-2">
                <User size={16} className="inline mr-2" />
                Paciente
              </label>
              <select
                value={selectedPatient.id}
                onChange={(e) => {
                  const patient = PATIENTS.find((p) => p.id === e.target.value);
                  if (patient) setSelectedPatient(patient);
                }}
                className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-blue-500"
              >
                {PATIENTS.map((patient) => (
                  <option key={patient.id} value={patient.id}>
                    {patient.name} ({patient.age} años)
                  </option>
                ))}
              </select>
              <p className="text-xs text-slate-400 mt-2">
                ID:{" "}
                <span className="text-blue-400 font-mono">
                  {selectedPatient.id}
                </span>
              </p>
            </div>

            {/* Doctor Selector */}
            <div>
              <label className="block text-sm font-bold text-slate-300 mb-2">
                <User size={16} className="inline mr-2" />
                Médico
              </label>
              <select
                value={selectedDoctor.id}
                onChange={(e) => {
                  const doctor = DOCTORS.find((d) => d.id === e.target.value);
                  if (doctor) setSelectedDoctor(doctor);
                }}
                className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-blue-500"
              >
                {DOCTORS.map((doctor) => (
                  <option key={doctor.id} value={doctor.id}>
                    {doctor.name} - {doctor.specialty}
                  </option>
                ))}
              </select>
              <p className="text-xs text-slate-400 mt-2">
                ID:{" "}
                <span className="text-blue-400 font-mono">
                  {selectedDoctor.id}
                </span>
              </p>
            </div>
          </div>
        </motion.div>

        {/* Error Alert */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="p-4 bg-red-900/20 border border-red-500/30 rounded-lg flex items-center gap-3"
            >
              <AlertCircle className="text-red-400 flex-shrink-0" size={20} />
              <p className="text-red-400 text-sm">{error}</p>
              <button
                onClick={clearError}
                className="ml-auto text-red-400 hover:text-red-300"
              >
                ✕
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Recording Section */}
        <motion.div className="bg-[#0f172a]/80 border border-slate-800/80 rounded-[2rem] p-10 backdrop-blur-2xl shadow-2xl relative overflow-hidden">
          <div className="absolute -top-40 -left-40 w-96 h-96 bg-blue-600/10 blur-[100px] rounded-full pointer-events-none" />

          <div className="flex items-center justify-between mb-10 relative z-10">
            <div>
              <h2 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400 tracking-tight">
                Grabación de Audio Clínico
              </h2>
              <p className="text-blue-400 font-medium text-xs mt-2 uppercase tracking-widest flex items-center gap-2">
                <Brain size={14} /> Análisis Automático con Gemini Pro
              </p>
            </div>
            <div className="flex items-center gap-3 bg-slate-900/50 py-2 px-4 rounded-full border border-slate-800/50">
              <div
                className={`w-2 h-2 rounded-full ${
                  isRecording || isProcessing
                    ? "bg-red-500 animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.8)]"
                    : "bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.8)]"
                }`}
              ></div>
              <span className="text-[10px] font-extrabold text-slate-300 uppercase tracking-widest">
                {isRecording
                  ? "Grabando..."
                  : isProcessing
                    ? "Procesando..."
                    : "Listo"}
              </span>
            </div>
          </div>

          <div className="relative">
            <div
              className={`absolute inset-0 border-2 border-dashed rounded-[2rem] transition-colors duration-500 ${
                isRecording
                  ? "border-red-500/30 bg-red-500/5"
                  : "border-blue-500/20 bg-blue-500/5"
              }`}
            />

            <div className="flex flex-col items-center justify-center py-16 relative z-10 gap-6">
              {!isRecording && !isProcessing && (
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleRecord}
                  className="w-28 h-28 rounded-full flex items-center justify-center transition-all duration-500 bg-blue-600 hover:bg-blue-500 text-white shadow-[0_0_30px_rgba(37,99,235,0.4)] ring-4 ring-blue-500/30 hover:ring-blue-400/50"
                  title="Iniciar grabación"
                >
                  <Mic size={48} />
                </motion.button>
              )}

              {isRecording && (
                <motion.button
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ duration: 0.6, repeat: Infinity }}
                  onClick={handleRecord}
                  className="w-28 h-28 rounded-full flex items-center justify-center bg-red-500 text-white shadow-[0_0_40px_rgba(239,68,68,0.5)] ring-4 ring-red-500/20 cursor-pointer"
                >
                  <Activity size={48} className="animate-pulse" />
                  <div className="absolute inset-0 rounded-full border-2 border-white/20 animate-ping" />
                </motion.button>
              )}

              {isProcessing && (
                <motion.div className="flex flex-col items-center gap-4">
                  <motion.button
                    disabled={true}
                    className="w-28 h-28 rounded-full flex items-center justify-center bg-purple-600 text-white shadow-[0_0_40px_rgba(147,51,234,0.5)] ring-4 ring-purple-500/20 cursor-not-allowed"
                  >
                    <Loader size={48} className="animate-spin" />
                  </motion.button>
                  <p className="text-slate-300 font-bold">
                    Procesando audio...
                  </p>
                </motion.div>
              )}

              <p className="text-slate-400 text-sm font-bold uppercase tracking-widest">
                {isProcessing
                  ? "Analizando con IA..."
                  : isRecording
                    ? "Dicta ahora..."
                    : "Toca para Grabar"}
              </p>
            </div>

            {/* Finalize Report Button */}
            {(transcription || feedbackQuestions.length > 0) && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-8 pt-6 border-t border-slate-700/50 flex justify-center relative z-10"
              >
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    if (reportId) {
                      reportsService.finalizeReport(reportId);
                    }
                  }}
                  disabled={!reportId || submittingFeedback}
                  className="px-8 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-700 text-white rounded-xl font-bold transition-all shadow-lg flex items-center gap-2"
                  title="Finalizar reporte"
                >
                  <CheckCircle size={20} />
                  Finalizar Reporte
                </motion.button>
              </motion.div>
            )}
          </div>
        </motion.div>

        {/* Real-time Transcription Display */}
        <AnimatePresence>
          {transcription && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gradient-to-br from-cyan-900/30 to-blue-900/20 border-2 border-cyan-500/40 rounded-[2rem] p-8 shadow-2xl relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/10 blur-[80px] rounded-full pointer-events-none" />

              <div className="flex items-center justify-between mb-6 relative z-10">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-cyan-500/20 rounded-lg">
                    <FileText size={24} className="text-cyan-400" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">
                      Transcripción de Audio
                    </h3>
                    <p className="text-xs text-cyan-400/80 font-bold uppercase tracking-wider">
                      📝 Se guardará en el reporte final
                    </p>
                  </div>
                </div>
                <span className="text-xs font-bold bg-cyan-500/20 text-cyan-300 px-4 py-2 rounded-full border border-cyan-500/30">
                  ✓ Palabras: {transcription.split(/\s+/).length}
                </span>
              </div>

              <div className="relative z-10 bg-slate-950/70 rounded-xl p-6 border border-slate-800/60 max-h-64 overflow-y-auto shadow-inner">
                <p className="text-slate-200 leading-relaxed text-sm whitespace-pre-wrap font-medium">
                  {transcription}
                </p>
              </div>

              <div className="mt-4 flex items-center justify-between relative z-10">
                <p className="text-xs text-cyan-400 font-semibold">
                  ✓ Transcripción completada - Esperando análisis
                </p>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(transcription);
                    alert("Transcripción copiada al portapapeles");
                  }}
                  className="text-xs px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded transition-colors"
                  title="Copiar transcripción"
                >
                  Copiar
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Analysis Results */}
        <AnimatePresence>
          {analysis && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              {/* Diagnosis Card */}
              <motion.div className="bg-gradient-to-br from-blue-900/40 to-slate-900/60 border border-blue-500/30 rounded-[2rem] p-8 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/20 blur-3xl pointer-events-none" />

                <div className="flex items-center gap-3 mb-6 text-blue-400 relative z-10">
                  <Brain size={24} className="animate-pulse" />
                  <span className="text-xs font-black uppercase tracking-[0.2em]">
                    Análisis Clínico
                  </span>
                </div>

                <h3 className="text-2xl text-white font-bold mb-4 relative z-10">
                  {analysis.diagnostico_presuntivo}
                </h3>

                <p className="text-slate-300 leading-relaxed mb-6 relative z-10">
                  {analysis.resumen}
                </p>

                {/* SOAP Grid */}
                <div className="grid grid-cols-2 gap-4 relative z-10">
                  <div className="bg-slate-950/60 p-4 rounded-lg border border-slate-800/80">
                    <p className="text-[10px] text-blue-400/80 uppercase font-black mb-2">
                      Subjetivo
                    </p>
                    <p className="text-xs text-slate-300 line-clamp-4">
                      {analysis.soap.subjetivo}
                    </p>
                  </div>
                  <div className="bg-slate-950/60 p-4 rounded-lg border border-slate-800/80">
                    <p className="text-[10px] text-emerald-400/80 uppercase font-black mb-2">
                      Objetivo
                    </p>
                    <p className="text-xs text-slate-300 line-clamp-4">
                      {analysis.soap.objetivo}
                    </p>
                  </div>
                  <div className="bg-slate-950/60 p-4 rounded-lg border border-slate-800/80">
                    <p className="text-[10px] text-amber-400/80 uppercase font-black mb-2">
                      Análisis
                    </p>
                    <p className="text-xs text-slate-300 line-clamp-4">
                      {analysis.soap.analisis}
                    </p>
                  </div>
                  <div className="bg-slate-950/60 p-4 rounded-lg border border-slate-800/80">
                    <p className="text-[10px] text-purple-400/80 uppercase font-black mb-2">
                      Plan
                    </p>
                    <p className="text-xs text-slate-300 line-clamp-4">
                      {analysis.soap.plan}
                    </p>
                  </div>
                </div>
              </motion.div>

              {/* Triage Badge */}
              <div
                className={`${getTriageColor(analysis.nivel_triage).bg} border ${getTriageColor(analysis.nivel_triage).border} rounded-lg p-6`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">
                      Nivel de Triaje
                    </p>
                    <p
                      className={`text-3xl font-black ${getTriageColor(analysis.nivel_triage).text}`}
                    >
                      {analysis.nivel_triage} / 5
                    </p>
                  </div>
                  <p className="text-sm text-slate-300 text-right max-w-xs">
                    {analysis.nivel_triage_justificacion}
                  </p>
                </div>
              </div>

              {/* Critical Findings */}
              {analysis.hallazgos_criticos &&
                analysis.hallazgos_criticos.length > 0 && (
                  <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-6">
                    <h4 className="text-sm font-bold text-red-400 mb-4 flex items-center gap-2">
                      <AlertCircle size={18} />
                      Hallazgos Críticos
                    </h4>
                    <ul className="space-y-2">
                      {analysis.hallazgos_criticos.map((finding, idx) => (
                        <li
                          key={idx}
                          className="text-sm text-slate-300 flex items-center gap-2"
                        >
                          <div className="w-1.5 h-1.5 bg-red-400 rounded-full" />
                          {finding}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Feedback Section */}
        <AnimatePresence>
          {feedbackQuestions.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-[#0f172a]/80 border border-slate-800/80 rounded-[2rem] p-8 backdrop-blur-2xl shadow-2xl space-y-6"
            >
              <div className="flex items-center gap-3">
                <CheckCircle className="text-emerald-400" size={24} />
                <h3 className="text-xl font-bold text-white">
                  Preguntas de Validación
                </h3>
              </div>

              <div className="space-y-6">
                {feedbackQuestions.map((question, idx) => {
                  const audioQuestion = feedbackWithAudio.find(
                    (q) => q.id === question.id,
                  );

                  if (!audioQuestion) {
                    console.warn(
                      `⚠️ No audio found for question ${question.id}`,
                    );
                  }

                  return (
                    <motion.div
                      key={question.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.1 }}
                      className="bg-gradient-to-br from-slate-900/70 to-slate-950/50 border border-slate-800/70 rounded-xl p-5 space-y-4"
                    >
                      {/* Question Header */}
                      <div>
                        <div className="text-xs font-bold text-blue-400 uppercase tracking-wider mb-2">
                          Pregunta {idx + 1} de {feedbackQuestions.length}
                        </div>
                        <p className="font-semibold text-slate-100 text-sm leading-relaxed mb-3">
                          {question.question}
                        </p>
                      </div>

                      {/* Audio Player */}
                      {audioQuestion?.audioBase64 ? (
                        <SimpleAudioPlayer
                          audioBase64={audioQuestion.audioBase64}
                          questionNumber={idx + 1}
                          totalQuestions={feedbackQuestions.length}
                          className="mb-3"
                        />
                      ) : (
                        <p className="text-xs text-slate-500">
                          ⚠️ Audio no disponible para esta pregunta
                        </p>
                      )}

                      {/* Analysis/Context */}
                      {question.analysis && (
                        <div className="text-xs bg-slate-950/60 border border-slate-700/50 rounded-lg p-3">
                          <span className="text-blue-300 font-bold">
                            💡 Contexto:
                          </span>
                          <p className="text-slate-300 mt-1">
                            {question.analysis}
                          </p>
                        </div>
                      )}

                      {/* Input Field */}
                      <input
                        type="text"
                        placeholder="Escribe tu respuesta..."
                        onChange={(e) =>
                          handleFeedbackChange(question.id, e.target.value)
                        }
                        className="w-full px-4 py-3 bg-slate-950/80 border border-slate-700/50 rounded-lg text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-blue-500/70 focus:ring-1 focus:ring-blue-500/30 text-sm transition-all"
                      />
                    </motion.div>
                  );
                })}
              </div>

              <div className="flex gap-3">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleSubmitFeedback}
                  disabled={submittingFeedback || feedbackAnswers.length === 0}
                  className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-700 text-white rounded-lg font-bold transition-colors flex items-center justify-center gap-2"
                >
                  {submittingFeedback ? (
                    <>
                      <Loader size={18} className="animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    <>
                      <Send size={18} />
                      Enviar Retroalimentación
                    </>
                  )}
                </motion.button>
              </div>

              {validityScore !== null && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-gradient-to-br from-emerald-900/40 to-emerald-950/20 border border-emerald-500/40 rounded-xl p-5 space-y-4"
                >
                  <div className="flex items-center gap-2">
                    <CheckCircle className="text-emerald-400" size={20} />
                    <p className="text-sm font-bold text-emerald-300">
                      ✅ Retroalimentación Procesada
                    </p>
                  </div>

                  <div className="bg-slate-900/50 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-slate-400">
                        Puntuación de Validez:
                      </span>
                      <span className="text-lg font-bold text-emerald-400">
                        {(validityScore * 100).toFixed(1)}%
                      </span>
                    </div>
                    <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${validityScore * 100}%` }}
                        transition={{ duration: 0.8 }}
                        className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400"
                      />
                    </div>
                  </div>

                  {recommendations.length > 0 && (
                    <div>
                      <p className="text-xs font-bold text-slate-400 mb-3 uppercase tracking-wide">
                        Recomendaciones del Sistema:
                      </p>
                      <ul className="space-y-2">
                        {recommendations.map((rec, idx) => (
                          <li
                            key={idx}
                            className="text-xs text-slate-300 flex items-start gap-3 p-2 bg-slate-950/40 rounded-lg"
                          >
                            <span className="text-emerald-400 font-bold flex-shrink-0">
                              •
                            </span>
                            <span>{rec}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Triage Prediction Chart */}
      <motion.div
        initial={{ opacity: 0, x: 30 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="bg-[#0f172a]/80 border border-slate-800/80 rounded-[2rem] p-8 backdrop-blur-2xl shadow-2xl flex flex-col relative overflow-hidden group"
      >
        <div className="absolute bottom-0 right-0 w-64 h-64 bg-red-500/5 blur-[80px] rounded-full pointer-events-none group-hover:bg-red-500/10 transition-colors duration-700" />

        <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-3 relative z-10">
          <div className="p-2 bg-blue-500/10 rounded-lg">
            <TrendingUp size={20} className="text-blue-500" />
          </div>
          Saturación Proyectada
        </h3>
        <p className="text-slate-500 font-semibold text-xs mb-8 tracking-wide relative z-10">
          Modelado predictivo en tiempo real
        </p>

        <div className="h-72 w-full relative z-10">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={TRIAGE_TREND}
              margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
            >
              <defs>
                <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorPred" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#1e293b"
                vertical={false}
              />
              <XAxis
                dataKey="name"
                stroke="#475569"
                fontSize={10}
                axisLine={false}
                tickLine={false}
                dy={10}
              />
              <YAxis
                stroke="#475569"
                fontSize={10}
                axisLine={false}
                tickLine={false}
                dx={-10}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "rgba(15, 23, 42, 0.9)",
                  border: "1px solid #334155",
                  borderRadius: "16px",
                  fontSize: "11px",
                  backdropFilter: "blur(10px)",
                  color: "#f8fafc",
                  fontWeight: "bold",
                }}
                itemStyle={{ color: "#fff" }}
                cursor={{
                  stroke: "#334155",
                  strokeWidth: 1,
                  strokeDasharray: "4 4",
                }}
              />
              <Area
                type="monotone"
                dataKey="value"
                stroke="#3b82f6"
                fillOpacity={1}
                fill="url(#colorValue)"
                strokeWidth={3}
                activeDot={{
                  r: 6,
                  fill: "#3b82f6",
                  stroke: "#0f172a",
                  strokeWidth: 2,
                }}
              />
              <Area
                type="monotone"
                dataKey="prediction"
                stroke="#ef4444"
                strokeDasharray="5 5"
                fill="url(#colorPred)"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="mt-auto pt-8 border-t border-slate-800/50 relative z-10">
          <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-[0.2em] mb-3">
            <span className="text-slate-400">Alerta 20:00h</span>
            <span className="text-red-400 drop-shadow-[0_0_5px_rgba(239,68,68,0.8)]">
              Crítico (95%)
            </span>
          </div>
          <div className="w-full bg-slate-900 h-2.5 rounded-full overflow-hidden flex ring-1 ring-slate-800/50 relative">
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0IiBoZWlnaHQ9IjQiPjxyZWN0IHdpZHRoPSI0IiBoZWlnaHQ9IjQiIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIi8+PC9zdmc+')] opacity-20"></div>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: "95%" }}
              transition={{ duration: 1.5, delay: 0.5, ease: "easeOut" }}
              className="bg-gradient-to-r from-red-600 to-red-400 h-full relative"
            >
              <div className="absolute top-0 right-0 bottom-0 w-20 bg-gradient-to-r from-transparent to-white/30" />
            </motion.div>
          </div>
        </div>
      </motion.div>

      {/* Debug Panel */}
      <DebugPanel
        apiResponse={debugResponse}
        isVisible={showDebug}
        onToggle={setShowDebug}
      />
    </motion.div>
  );
};
