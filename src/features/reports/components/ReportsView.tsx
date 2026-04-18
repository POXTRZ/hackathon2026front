import { useMemo, useRef, useState } from "react";
import {
  Activity,
  Brain,
  CheckCircle,
  Loader,
  Mic,
  Send,
  FileText,
  MessageSquareText,
  Stethoscope,
  AlertCircle,
  TrendingUp,
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
import { aiService } from "../../ai/services/ai.service";
import { reportsService } from "../services/reports.service";
import { SimpleAudioPlayer } from "./SimplAudioPlayer";
import type { FeedbackResponse } from "../../../types";

const TRIAGE_TREND = [
  { name: "00h", value: 30, prediction: 35 },
  { name: "04h", value: 25, prediction: 28 },
  { name: "08h", value: 65, prediction: 70 },
  { name: "12h", value: 85, prediction: 82 },
  { name: "16h", value: 55, prediction: 60 },
  { name: "20h", value: 90, prediction: 95 },
];

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

type CompleteReport = {
  summary: string;
  findings: string[];
  recommendations: string[];
  riskLevel: "low" | "medium" | "high";
};

export const ReportsView = () => {
  const { isRecording, error, startRecording, stopRecording, clearError } =
    useAI();

  const [selectedPatient, setSelectedPatient] = useState(PATIENTS[0]);
  const [selectedDoctor, setSelectedDoctor] = useState(DOCTORS[0]);
  const [transcription, setTranscription] = useState("");
  const [feedbackQuestions, setFeedbackQuestions] = useState<any[]>([]);
  const [feedbackWithAudio, setFeedbackWithAudio] = useState<any[]>([]);
  const [feedbackAnswers, setFeedbackAnswers] = useState<FeedbackResponse[]>(
    [],
  );
  const [reportId, setReportId] = useState<string | null>(null);
  const [submittingFeedback, setSubmittingFeedback] = useState(false);
  const [validityScore, setValidityScore] = useState<number | null>(null);
  const [recommendations, setRecommendations] = useState<string[]>([]);
  const [reportAnalysis, setReportAnalysis] = useState<any | null>(null);
  const [completeReport, setCompleteReport] = useState<CompleteReport | null>(
    null,
  );
  const [isUploading, setIsUploading] = useState(false);
  const [finalNotes, setFinalNotes] = useState("");
  const [autoplayBlocked, setAutoplayBlocked] = useState(false);
  const [reportAudioBlocked, setReportAudioBlocked] = useState(false);

  const isProcessing = isUploading;
  const isReady = !isRecording && !isProcessing;
  const autoplayUnlockedRef = useRef(false);
  const lastAudioQuestionsRef = useRef<any[]>([]);
  const lastReportAudioRef = useRef<{
    audioBase64?: string;
    audioUrl?: string;
    mimeType?: string;
  } | null>(null);

  const unlockAutoplay = async () => {
    if (autoplayUnlockedRef.current) {
      setAutoplayBlocked(false);
      setReportAudioBlocked(false);
      return true;
    }
    try {
      const AudioContextCtor =
        window.AudioContext ||
        (window as Window & { webkitAudioContext?: typeof AudioContext })
          .webkitAudioContext;

      if (AudioContextCtor) {
        const context = new AudioContextCtor();
        if (context.state === "suspended") {
          await context.resume();
        }
        const buffer = context.createBuffer(1, 1, 22050);
        const source = context.createBufferSource();
        source.buffer = buffer;
        source.connect(context.destination);
        source.start(0);
        source.stop(0);
        await new Promise<void>((resolve) => {
          source.onended = () => resolve();
        });
        await context.close();
      } else {
        const audio = new Audio();
        audio.muted = true;
        await audio.play().catch(() => undefined);
        audio.pause();
      }

      autoplayUnlockedRef.current = true;
      setAutoplayBlocked(false);
      setReportAudioBlocked(false);
      return true;
    } catch (err) {
      console.warn("Autoplay unlock failed:", err);
      setAutoplayBlocked(true);
      return false;
    }
  };

  const playAudioSource = async (source: {
    audioBase64?: string;
    audioUrl?: string;
    mimeType?: string;
  }): Promise<"played" | "blocked" | "error"> => {
    if (!source?.audioBase64 && !source?.audioUrl) return "error";

    const shouldRevoke = !source.audioUrl;
    const audioUrl =
      source.audioUrl ||
      reportsService.createAudioUrl(
        source.audioBase64,
        source.mimeType || "audio/mpeg",
      );

    return new Promise((resolve) => {
      const audio = new Audio(audioUrl);
      audio.onended = () => {
        if (shouldRevoke) {
          URL.revokeObjectURL(audioUrl);
        }
        resolve("played");
      };
      audio.onerror = () => {
        if (shouldRevoke) {
          URL.revokeObjectURL(audioUrl);
        }
        resolve("error");
      };
      audio.play().catch((err) => {
        if (shouldRevoke) {
          URL.revokeObjectURL(audioUrl);
        }
        if (err?.name === "NotAllowedError") {
          resolve("blocked");
          return;
        }
        resolve("error");
      });
    });
  };

  const handleRecord = async () => {
    if (!isRecording) {
      clearError();
      await startRecording();
      return;
    }

    void unlockAutoplay();

    const audioBlob = await stopRecording();
    if (audioBlob) {
      await uploadAndAnalyzeAudio(audioBlob);
    }
  };

  const playGeneratedQuestionsAudio = async (questions: any[]) => {
    const audioQuestions = questions.filter((q) => q?.audioBase64);
    if (audioQuestions.length === 0) return true;

    for (const question of audioQuestions) {
      try {
        const result = await playAudioSource({
          audioBase64: question.audioBase64,
          mimeType: question.mimeType || "audio/mpeg",
        });

        if (result === "blocked") {
          setAutoplayBlocked(true);
          return false;
        }
      } catch (err) {
        console.error("Error playing question audio:", err);
      }
    }

    return true;
  };

  const handlePlayQuestionsManual = async () => {
    const unlocked = await unlockAutoplay();
    if (!unlocked) return;

    const questions =
      lastAudioQuestionsRef.current.length > 0
        ? lastAudioQuestionsRef.current
        : feedbackWithAudio;

    const played = await playGeneratedQuestionsAudio(questions);
    if (played) {
      setAutoplayBlocked(false);
    }
  };

  const handlePlayReportAudioManual = async () => {
    const unlocked = await unlockAutoplay();
    if (!unlocked) return;

    const source = lastReportAudioRef.current;
    if (!source) return;

    const played = await playAudioSource(source);
    if (played === "played") {
      setReportAudioBlocked(false);
    }
  };

  const normalizeAudioQuestions = (questions: any[]) =>
    (questions || []).map((question: any) => {
      if (!question) return question;
      if (question.audioBase64) return question;
      if (question.audio?.data) {
        return { ...question, audioBase64: question.audio.data };
      }
      if (question.audioData?.data) {
        return { ...question, audioBase64: question.audioData.data };
      }
      return question;
    });

  const uploadAndAnalyzeAudio = async (audioBlob: Blob) => {
    try {
      clearError();
      setIsUploading(true);

      const formData = reportsService.createAudioFormData(
        audioBlob,
        selectedPatient.id,
        selectedDoctor.id,
        selectedDoctor.specialty,
      );

      const result = await reportsService.uploadAudioWithFeedback(formData);

      const reportData = result.report || {};
      const normalizedTranscription =
        result.transcription || reportData.transcription || "";
      const normalizedAnalysis =
        result.analysis || reportData.analysis || reportData.aiAnalysis || null;
      const rawFeedbackQuestions =
        result.feedbackQuestions || reportData.feedbackQuestions || [];
      const rawFeedbackWithAudio =
        result.feedbackQuestionsWithAudio ||
        reportData.feedbackQuestionsWithAudio ||
        [];
      const normalizedFeedbackWithAudio = normalizeAudioQuestions(
        rawFeedbackWithAudio.length > 0
          ? rawFeedbackWithAudio
          : rawFeedbackQuestions,
      );
      const normalizedFeedbackQuestions =
        rawFeedbackQuestions.length > 0
          ? rawFeedbackQuestions
          : normalizedFeedbackWithAudio;

      const audioQuestions = normalizedFeedbackWithAudio;

      setCompleteReport(null);
      setReportAudioBlocked(false);
      lastReportAudioRef.current = null;

      setReportId(result.reportId || reportData._id || null);
      setTranscription(normalizedTranscription);
      setReportAnalysis(normalizedAnalysis);
      setFeedbackQuestions(normalizedFeedbackQuestions);
      setFeedbackWithAudio(audioQuestions);
      setFeedbackAnswers([]);
      setValidityScore(null);
      setRecommendations([]);

      if (audioQuestions.length === 0) {
        setAutoplayBlocked(false);
      } else {
        const unlocked = await unlockAutoplay();
        if (unlocked) {
          await playGeneratedQuestionsAudio(audioQuestions);
        }
      }

      if (normalizedTranscription) {
        try {
          const completeResult = await aiService.completeReport({
            transcript: normalizedTranscription,
          });

          if (completeResult?.success && completeResult.report) {
            setCompleteReport(completeResult.report);

            const speechText =
              completeResult.raw ||
              completeResult.report.summary ||
              normalizedTranscription;

            if (speechText) {
              const speechResult = await aiService.elevenlabsSpeech({
                text: speechText,
              });

              if (
                speechResult?.success &&
                (speechResult.audioBase64 || speechResult.audioUrl)
              ) {
                const source = {
                  audioBase64: speechResult.audioBase64,
                  audioUrl: speechResult.audioUrl,
                  mimeType: speechResult.mimeType,
                };
                lastReportAudioRef.current = source;

                const unlocked = await unlockAutoplay();
                if (unlocked) {
                  const played = await playAudioSource(source);
                  if (played === "blocked") {
                    setReportAudioBlocked(true);
                  } else if (played === "played") {
                    setReportAudioBlocked(false);
                  }
                } else {
                  setReportAudioBlocked(true);
                }
              }
            }
          }
        } catch (err) {
          console.error("Error completing report:", err);
        }
      }
    } catch (err) {
      console.error("Error uploading audio:", err);
    } finally {
      setIsUploading(false);
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

  const handleFinalize = async () => {
    if (!reportId) return;
    try {
      await reportsService.finalizeReport(reportId, {
        finalNotes: finalNotes.trim() || undefined,
      });
    } catch (err) {
      console.error("Error finalizing report:", err);
    }
  };

  const answersByQuestion = useMemo(() => {
    const map = new Map<string, string>();
    feedbackAnswers.forEach((a) => map.set(a.questionId, a.answer));
    return map;
  }, [feedbackAnswers]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="grid grid-cols-1 lg:grid-cols-2 gap-8"
    >
      <>
        {/* Selector */}
        <div className="lg:col-span-2 bg-[#0f172a]/80 border border-slate-800/80 rounded-[2rem] p-6 backdrop-blur-2xl shadow-2xl">
          <h3 className="text-sm font-bold text-slate-200 mb-4 flex items-center gap-2">
            <Stethoscope size={16} className="text-blue-400" />
            Seleccionar Paciente y Médico
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className="text-xs font-semibold text-slate-400">
              Paciente
              <select
                value={selectedPatient.id}
                onChange={(e) => {
                  const patient = PATIENTS.find((p) => p.id === e.target.value);
                  if (patient) setSelectedPatient(patient);
                }}
                className="mt-2 w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200"
              >
                {PATIENTS.map((patient) => (
                  <option key={patient.id} value={patient.id}>
                    {patient.name} ({patient.age} años)
                  </option>
                ))}
              </select>
            </label>

            <label className="text-xs font-semibold text-slate-400">
              Médico
              <select
                value={selectedDoctor.id}
                onChange={(e) => {
                  const doctor = DOCTORS.find((d) => d.id === e.target.value);
                  if (doctor) setSelectedDoctor(doctor);
                }}
                className="mt-2 w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200"
              >
                {DOCTORS.map((doctor) => (
                  <option key={doctor.id} value={doctor.id}>
                    {doctor.name} - {doctor.specialty}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>

        {/* Error */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 6 }}
              className="lg:col-span-2 p-4 bg-red-900/20 border border-red-500/30 rounded-lg flex items-center gap-3"
            >
              <AlertCircle className="text-red-400" size={18} />
              <p className="text-red-300 text-sm">{error}</p>
              <button onClick={clearError} className="ml-auto text-red-300">
                ✕
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Panel de grabación */}
        <div className="lg:col-span-1 bg-[#0f172a]/80 border border-slate-800/80 rounded-[2rem] p-8 backdrop-blur-2xl shadow-2xl h-full">
          <div className="mx-auto w-full max-w-[520px] flex flex-col items-center text-center">
            <div className="flex flex-col items-center gap-3 mb-6">
              <div>
                <h2 className="text-2xl font-bold text-white">
                  Grabación de Audio Clínico
                </h2>
                <p className="text-xs text-slate-400 mt-2 flex items-center justify-center gap-2 uppercase tracking-wider">
                  <Brain size={14} className="text-blue-400" />
                  Análisis Automático con Gemini Pro
                </p>
              </div>

              <div className="flex items-center gap-2 rounded-full border border-slate-800/80 bg-slate-950/60 px-3 py-2">
                <span
                  className={`h-2 w-2 rounded-full ${
                    isRecording || isProcessing
                      ? "bg-red-500 animate-pulse"
                      : "bg-emerald-500"
                  }`}
                />
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  {isRecording
                    ? "Grabando"
                    : isProcessing
                      ? "Procesando"
                      : "Listo"}
                </span>
              </div>
            </div>

            <div className="border border-slate-800/60 rounded-[1.5rem] p-15 bg-slate-950/50 w-full min-h-[260px]">
              <div className="flex flex-col items-center justify-center gap-4">
                <motion.button
                  whileHover={{ scale: isReady ? 1.05 : 1 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleRecord}
                  className={`w-24 h-24 rounded-full flex items-center justify-center transition-all ${
                    isRecording
                      ? "bg-red-500 shadow-[0_0_30px_rgba(239,68,68,0.5)]"
                      : isProcessing
                        ? "bg-slate-700 cursor-not-allowed"
                        : "bg-blue-600 hover:bg-blue-500 shadow-[0_0_30px_rgba(37,99,235,0.45)]"
                  }`}
                  disabled={isProcessing}
                  title={isRecording ? "Pausar" : "Grabar"}
                >
                  {isProcessing ? (
                    <Loader className="animate-spin text-white" size={36} />
                  ) : isRecording ? (
                    <Activity className="text-white" size={36} />
                  ) : (
                    <Mic className="text-white" size={36} />
                  )}
                </motion.button>

                <p className="text-xs text-slate-400 uppercase tracking-[0.2em]">
                  {isRecording
                    ? "Presiona para pausar"
                    : isProcessing
                      ? "Procesando audio"
                      : "Toca para grabar"}
                </p>
              </div>
            </div>

            <div className="mt-6 flex flex-col items-center gap-3">
              <button
                onClick={handleFinalize}
                disabled={!reportId || submittingFeedback}
                className="self-center px-6 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-700 text-white font-bold flex items-center gap-2 transition"
              >
                <CheckCircle size={18} />
                Finalizar Reporte
              </button>
            </div>
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="lg:col-span-1 bg-[#0f172a]/80 border border-slate-800/80 rounded-[2rem] p-8 backdrop-blur-2xl shadow-2xl flex flex-col relative overflow-hidden group h-full"
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

        {/* Reporte con IA */}
        <div className="bg-[#0f172a]/80 border border-slate-800/80 rounded-[2rem] p-8 backdrop-blur-2xl shadow-2xl h-full lg:col-span-2">
          <h3 className="text-lg font-bold text-white mb-6">Reporte con IA</h3>

          <div className="border border-slate-800/70 rounded-[1.5rem] p-6 bg-slate-950/50 space-y-6">
            {/* Transcripción */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-slate-300 font-semibold">
                <FileText size={16} className="text-cyan-400" />
                Transcripción detectada por voz
              </div>
              <div className="bg-slate-950/70 border border-slate-800 rounded-lg p-4 text-sm text-slate-200">
                {transcription || "Sin transcripción aún."}
              </div>
            </div>

            {completeReport ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm text-slate-300 font-semibold">
                  <Brain size={16} className="text-purple-400" />
                  Reporte IA (completado)
                </div>
                <div className="bg-slate-950/70 border border-slate-800 rounded-lg p-4 text-sm text-slate-200 space-y-3">
                  <div>
                    <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">
                      Resumen
                    </p>
                    <p className="text-slate-200">{completeReport.summary}</p>
                  </div>

                  {completeReport.findings?.length > 0 && (
                    <div>
                      <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">
                        Hallazgos
                      </p>
                      <ul className="list-disc pl-5 space-y-1">
                        {completeReport.findings.map((finding, idx) => (
                          <li key={idx}>{finding}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {completeReport.recommendations?.length > 0 && (
                    <div>
                      <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">
                        Recomendaciones
                      </p>
                      <ul className="list-disc pl-5 space-y-1">
                        {completeReport.recommendations.map((rec, idx) => (
                          <li key={idx}>{rec}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <p className="text-xs text-slate-400 uppercase tracking-wider">
                    Riesgo:{" "}
                    <span className="text-slate-200">
                      {completeReport.riskLevel}
                    </span>
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-500">
                Reporte IA pendiente de completarse.
              </p>
            )}

            {reportAudioBlocked && lastReportAudioRef.current && (
              <div className="bg-amber-900/20 border border-amber-500/30 rounded-lg p-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <AlertCircle size={18} className="text-amber-400" />
                  <div>
                    <p className="text-sm font-semibold text-amber-200">
                      Reproducir reporte IA
                    </p>
                    <p className="text-xs text-amber-300/80">
                      Toca para habilitar audio y escuchar el reporte
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    void handlePlayReportAudioManual();
                  }}
                  className="px-3 py-2 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-100 text-xs font-bold uppercase tracking-wider"
                >
                  Reproducir
                </button>
              </div>
            )}

            {autoplayBlocked && feedbackWithAudio.length > 0 && (
              <div className="bg-amber-900/20 border border-amber-500/30 rounded-lg p-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <AlertCircle size={18} className="text-amber-400" />
                  <div>
                    <p className="text-sm font-semibold text-amber-200">
                      Reproducir preguntas
                    </p>
                    <p className="text-xs text-amber-300/80">
                      Toca para habilitar audio y escuchar las preguntas
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    void handlePlayQuestionsManual();
                  }}
                  className="px-3 py-2 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-100 text-xs font-bold uppercase tracking-wider"
                >
                  Reproducir
                </button>
              </div>
            )}

            {/* Preguntas */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm text-slate-300 font-semibold">
                <MessageSquareText size={16} className="text-blue-400" />
                Preguntas
              </div>

              {feedbackQuestions.length === 0 ? (
                <p className="text-xs text-slate-500">
                  Sin preguntas por ahora.
                </p>
              ) : (
                <div className="space-y-4">
                  {feedbackQuestions.map((question, idx) => {
                    const audioQuestion = feedbackWithAudio.find(
                      (q) => q.id === question.id,
                    );

                    return (
                      <div
                        key={question.id}
                        className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 space-y-3"
                      >
                        <p className="text-xs text-slate-400 uppercase tracking-wider">
                          Pregunta {idx + 1}
                        </p>
                        <p className="text-sm text-slate-100">
                          {question.question}
                        </p>

                        {audioQuestion?.audioBase64 && (
                          <SimpleAudioPlayer
                            audioBase64={audioQuestion.audioBase64}
                            questionNumber={idx + 1}
                            totalQuestions={feedbackQuestions.length}
                            className="mb-2"
                          />
                        )}

                        <input
                          type="text"
                          placeholder="Escribe tu respuesta..."
                          onChange={(e) =>
                            handleFeedbackChange(question.id, e.target.value)
                          }
                          className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 text-sm"
                        />
                      </div>
                    );
                  })}

                  <button
                    onClick={handleSubmitFeedback}
                    disabled={
                      submittingFeedback || feedbackAnswers.length === 0
                    }
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-700 text-white rounded-lg text-sm font-bold flex items-center gap-2"
                  >
                    {submittingFeedback ? (
                      <>
                        <Loader size={16} className="animate-spin" />
                        Enviando...
                      </>
                    ) : (
                      <>
                        <Send size={16} />
                        Guardar respuestas
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>

            {/* Respuestas */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-slate-300 font-semibold">
                <CheckCircle size={16} className="text-emerald-400" />
                Respuestas
              </div>
              {feedbackQuestions.length === 0 ? (
                <p className="text-xs text-slate-500">Sin respuestas.</p>
              ) : (
                <ul className="space-y-2 text-sm text-slate-200">
                  {feedbackQuestions.map((q, idx) => (
                    <li key={q.id} className="bg-slate-950/70 p-3 rounded-lg">
                      <span className="text-slate-400 text-xs block mb-1">
                        Pregunta {idx + 1}
                      </span>
                      <span>{answersByQuestion.get(q.id) || "Pendiente"}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* SOAP */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-slate-300 font-semibold">
                <Brain size={16} className="text-purple-400" />
                SOAP
              </div>
              {reportAnalysis?.soap ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  <div className="bg-slate-950/70 border border-slate-800 rounded-lg p-3">
                    <p className="text-blue-300 font-bold mb-1">Subjetivo</p>
                    <p className="text-slate-200">
                      {reportAnalysis.soap.subjetivo}
                    </p>
                  </div>
                  <div className="bg-slate-950/70 border border-slate-800 rounded-lg p-3">
                    <p className="text-emerald-300 font-bold mb-1">Objetivo</p>
                    <p className="text-slate-200">
                      {reportAnalysis.soap.objetivo}
                    </p>
                  </div>
                  <div className="bg-slate-950/70 border border-slate-800 rounded-lg p-3">
                    <p className="text-amber-300 font-bold mb-1">Análisis</p>
                    <p className="text-slate-200">
                      {reportAnalysis.soap.analisis}
                    </p>
                  </div>
                  <div className="bg-slate-950/70 border border-slate-800 rounded-lg p-3">
                    <p className="text-purple-300 font-bold mb-1">Plan</p>
                    <p className="text-slate-200">{reportAnalysis.soap.plan}</p>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-slate-500">SOAP pendiente.</p>
              )}
            </div>

            {/* Triage */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-slate-300 font-semibold">
                <AlertCircle size={16} className="text-amber-400" />
                Información para Triage
              </div>
              {reportAnalysis?.nivel_triage ? (
                <div className="bg-slate-950/70 border border-slate-800 rounded-lg p-3 text-sm text-slate-200">
                  <p className="font-bold">
                    Nivel: {reportAnalysis.nivel_triage} / 5
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    {reportAnalysis.nivel_triage_justificacion}
                  </p>
                </div>
              ) : (
                <p className="text-xs text-slate-500">
                  Triage pendiente de análisis.
                </p>
              )}
            </div>

            {/* Score */}
            {validityScore !== null && (
              <div className="bg-emerald-900/20 border border-emerald-500/30 rounded-lg p-4 text-sm text-emerald-200">
                <p className="font-bold">
                  Validez: {(validityScore * 100).toFixed(1)}%
                </p>
                {recommendations.length > 0 && (
                  <ul className="mt-2 text-xs text-slate-300 list-disc pl-5">
                    {recommendations.map((rec, idx) => (
                      <li key={idx}>{rec}</li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>
        </div>
      </>
    </motion.div>
  );
};
