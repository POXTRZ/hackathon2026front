import {
  FileText,
  Brain,
  AlertCircle,
  CheckCircle,
  TrendingUp,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { Analysis, FeedbackResponse } from "../../../../types";

interface ReportScreenProps {
  analysis: Analysis | null;
  transcription: string;
  feedbackWithAudio: Array<{id: string; question: string; audioBase64?: string}>;
  feedbackAnswers: FeedbackResponse[];
  validityScore: number | null;
  recommendations: string[];
  isLoading?: boolean;
}

const TRIAGE_COLORS: Record<
  number,
  { bg: string; border: string; text: string; icon: string }
> = {
  1: {
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/30",
    text: "text-emerald-400",
    icon: "🟢",
  },
  2: {
    bg: "bg-yellow-500/10",
    border: "border-yellow-500/30",
    text: "text-yellow-400",
    icon: "🟡",
  },
  3: {
    bg: "bg-orange-500/10",
    border: "border-orange-500/30",
    text: "text-orange-400",
    icon: "🟠",
  },
  4: {
    bg: "bg-red-500/10",
    border: "border-red-500/30",
    text: "text-red-400",
    icon: "🔴",
  },
  5: {
    bg: "bg-red-600/10",
    border: "border-red-600/30",
    text: "text-red-500",
    icon: "⛔",
  },
};

export const ReportScreen = ({
  analysis,
  transcription,
  feedbackWithAudio,
  feedbackAnswers,
  validityScore,
  recommendations,
  isLoading = false,
}: ReportScreenProps) => {
  if (isLoading) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex items-center justify-center min-h-96"
      >
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className="w-16 h-16 rounded-full border-4 border-slate-700 border-t-blue-500"
        />
      </motion.div>
    );
  }

  if (!analysis) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="text-center py-12"
      >
        <p className="text-slate-400">No hay análisis disponible</p>
      </motion.div>
    );
  }

  const triageColor = TRIAGE_COLORS[analysis.nivel_triage] || TRIAGE_COLORS[3];

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-2"
      >
        <h1 className="text-4xl font-black text-white">Reporte con IA</h1>
        <p className="text-blue-400/90 font-semibold text-sm flex items-center gap-2">
          <Brain size={16} className="animate-pulse" />
          Análisis Automático con Gemini Pro
        </p>
      </motion.div>

      {/* Transcription Section */}
      <AnimatePresence>
        {transcription && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-linear-to-br from-cyan-900/30 to-blue-900/20 border-2 border-cyan-500/40 rounded-2xl p-8 relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/10 blur-[80px] rounded-full pointer-events-none" />

            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-cyan-500/20 rounded-lg">
                  <FileText size={24} className="text-cyan-400" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">
                    Transcripción Detectada por Voz
                  </h2>
                  <p className="text-xs text-cyan-400/80 font-bold uppercase tracking-wider">
                    📝 Palabras: {transcription.split(/\s+/).length}
                  </p>
                </div>
              </div>

              <div className="bg-slate-950/70 rounded-xl p-6 border border-slate-800/60 max-h-64 overflow-y-auto">
                <p className="text-slate-200 leading-relaxed text-sm whitespace-pre-wrap font-medium">
                  {transcription}
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Analysis Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-linear-to-br from-blue-900/40 to-slate-900/60 border border-blue-500/30 rounded-2xl p-8 relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/20 blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-6">
          <div>
            <div className="flex items-center gap-3 mb-4 text-blue-400">
              <Brain size={24} className="animate-pulse" />
              <span className="text-xs font-black uppercase tracking-[0.2em]">
                Análisis Clínico
              </span>
            </div>

            <h2 className="text-3xl font-bold text-white mb-4">
              {analysis.diagnostico_presuntivo}
            </h2>

            <p className="text-slate-300 leading-relaxed">{analysis.resumen}</p>
          </div>

          {/* SOAP Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-6 border-t border-slate-700/50">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-slate-950/60 p-5 rounded-xl border border-slate-800/80 hover:border-emerald-500/30 transition-colors"
            >
              <p className="text-[10px] text-emerald-400/80 uppercase font-black mb-3">
                📋 Subjetivo
              </p>
              <p className="text-sm text-slate-300 leading-relaxed line-clamp-6">
                {analysis.soap.subjetivo}
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-slate-950/60 p-5 rounded-xl border border-slate-800/80 hover:border-blue-500/30 transition-colors"
            >
              <p className="text-[10px] text-blue-400/80 uppercase font-black mb-3">
                📊 Objetivo
              </p>
              <p className="text-sm text-slate-300 leading-relaxed line-clamp-6">
                {analysis.soap.objetivo}
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-slate-950/60 p-5 rounded-xl border border-slate-800/80 hover:border-amber-500/30 transition-colors"
            >
              <p className="text-[10px] text-amber-400/80 uppercase font-black mb-3">
                🔍 Análisis
              </p>
              <p className="text-sm text-slate-300 leading-relaxed line-clamp-6">
                {analysis.soap.analisis}
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-slate-950/60 p-5 rounded-xl border border-slate-800/80 hover:border-purple-500/30 transition-colors"
            >
              <p className="text-[10px] text-purple-400/80 uppercase font-black mb-3">
                📋 Plan
              </p>
              <p className="text-sm text-slate-300 leading-relaxed line-clamp-6">
                {analysis.soap.plan}
              </p>
            </motion.div>
          </div>
        </div>
      </motion.div>

      {/* Triage Information */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className={`${triageColor.bg} border-2 ${triageColor.border} rounded-2xl p-8 relative overflow-hidden`}
      >
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 blur-3xl rounded-full pointer-events-none" />

        <div className="relative z-10">
          <div className="flex items-start justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="text-6xl">{triageColor.icon}</div>
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">
                  Nivel de Triaje
                </p>
                <p className={`text-4xl font-black ${triageColor.text}`}>
                  {analysis.nivel_triage} / 5
                </p>
              </div>
            </div>
            <div className="flex-1 text-right">
              <p className="text-sm text-slate-300 leading-relaxed">
                {analysis.nivel_triage_justificacion}
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Critical Findings */}
      <AnimatePresence>
        {analysis.hallazgos_criticos &&
          analysis.hallazgos_criticos.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-red-900/20 border-2 border-red-500/30 rounded-2xl p-8 relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/10 blur-3xl rounded-full pointer-events-none" />

              <div className="relative z-10">
                <h3 className="text-lg font-bold text-red-400 mb-6 flex items-center gap-3">
                  <AlertCircle size={24} />
                  Hallazgos Críticos
                </h3>
                <div className="space-y-3">
                  {analysis.hallazgos_criticos.map((finding: string, idx: number) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3 + idx * 0.1 }}
                      className="flex items-start gap-3 p-3 bg-red-900/30 rounded-lg border border-red-500/20"
                    >
                      <div className="w-2 h-2 bg-red-400 rounded-full mt-1.5 shrink-0" />
                      <p className="text-sm text-slate-200">{finding}</p>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
      </AnimatePresence>

      {/* Feedback Questions and Answers */}
      <AnimatePresence>
        {feedbackWithAudio.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-[#0f172a]/80 border border-slate-800/80 rounded-2xl p-8 space-y-6"
          >
            <div className="flex items-center gap-3">
              <CheckCircle className="text-emerald-400" size={24} />
              <h2 className="text-2xl font-bold text-white">
                Preguntas y Respuestas
              </h2>
            </div>

            <div className="space-y-4">
              {feedbackWithAudio.map((question: {id: string; question: string; audioBase64?: string}, idx: number) => {
                const answer = feedbackAnswers.find(
                  (a) => a.questionId === question.id,
                );
                return (
                  <motion.div
                    key={question.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 + idx * 0.1 }}
                    className="border border-slate-700/50 rounded-xl p-5 bg-slate-900/30 hover:bg-slate-900/50 transition-colors"
                  >
                    <div className="mb-4">
                      <p className="text-[10px] text-blue-400 uppercase font-black mb-2">
                        Pregunta {idx + 1}
                      </p>
                      <p className="text-sm font-semibold text-slate-200">
                        {question.question}
                      </p>
                    </div>

                    {answer && (
                      <div>
                        <p className="text-[10px] text-emerald-400 uppercase font-black mb-2">
                          Respuesta
                        </p>
                        <p className="text-sm text-slate-300">
                          {answer.response}
                        </p>
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Validity Score */}
      <AnimatePresence>
        {validityScore !== null && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-linear-to-r from-purple-900/30 to-blue-900/30 border border-purple-500/30 rounded-2xl p-8"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <TrendingUp className="text-purple-400" size={32} />
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-1">
                    Puntuación de Validez
                  </p>
                  <p className="text-3xl font-black text-purple-400">
                    {validityScore}%
                  </p>
                </div>
              </div>
              <div className="w-24 h-24 rounded-full border-4 border-slate-700 flex items-center justify-center relative">
                <svg className="w-full h-full" viewBox="0 0 100 100">
                  <circle
                    cx="50"
                    cy="50"
                    r="45"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="8"
                    className="text-slate-700"
                  />
                  <motion.circle
                    cx="50"
                    cy="50"
                    r="45"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="8"
                    strokeDasharray="282.7"
                    initial={{ strokeDashoffset: 282.7 }}
                    animate={{
                      strokeDashoffset: 282.7 - (282.7 * validityScore) / 100,
                    }}
                    transition={{ duration: 1 }}
                    className="text-purple-500 transform -rotate-90 origin-center"
                  />
                </svg>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Recommendations */}
      <AnimatePresence>
        {recommendations.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="bg-linear-to-br from-amber-900/30 to-orange-900/20 border border-amber-500/30 rounded-2xl p-8"
          >
            <h3 className="text-lg font-bold text-amber-400 mb-6 flex items-center gap-2">
              💡 Recomendaciones
            </h3>
            <div className="space-y-3">
              {recommendations.map((rec: string, idx: number) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.6 + idx * 0.1 }}
                  className="flex items-start gap-3 p-3 bg-amber-900/20 rounded-lg border border-amber-500/20"
                >
                  <span className="text-amber-400 font-bold shrink-0">
                    •
                  </span>
                  <p className="text-sm text-slate-200">{rec}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
