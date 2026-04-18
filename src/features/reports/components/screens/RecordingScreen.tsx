import { useState } from "react";
import { Mic, Loader, CheckCircle, Brain, Square } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAI } from "../../../ai/hooks/useAI";
import { reportsService } from "../../services/reports.service";

interface RecordingScreenProps {
  // // onRecordingComplete?: (transcription: string) => void;
  onFinalize?: () => void;
  reportId?: string | null;
}

export const RecordingScreen = ({
  
  onFinalize,
  reportId,
}: RecordingScreenProps) => {
  const { isRecording, isProcessing, startRecording, stopRecording } = useAI();
  const [isFinalizingReport, setIsFinalizingReport] = useState(false);
  const [showFinalizeModal, setShowFinalizeModal] = useState(false);
  const [finalNotes, setFinalNotes] = useState("");

  const handleRecordClick = async () => {
    if (isRecording) {
      await stopRecording();
    } else {
      await startRecording();
    }
  };

  const handleFinalizeClick = async () => {
    if (!reportId) return;

    setIsFinalizingReport(true);
    try {
      await reportsService.finalizeReport(reportId, finalNotes ? { finalNotes } : undefined);
      setShowFinalizeModal(false);
      onFinalize?.();
    } catch (error) {
      console.error("Error finalizing report:", error);
    } finally {
      setIsFinalizingReport(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-2"
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-black text-white">
              Grabación de Audio Clínico
            </h1>
            <p className="text-blue-400/90 font-semibold text-sm mt-2 flex items-center gap-2">
              <Brain size={16} className="animate-pulse" />
              Análisis Automático con Gemini Pro
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
      </motion.div>

      {/* Main Recording Container */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-linear-to-br from-blue-900/20 to-slate-900/40 border-2 border-blue-500/20 rounded-3xl p-16 relative overflow-hidden"
      >
        {/* Background glow effect */}
        <div className="absolute -top-32 -left-32 w-64 h-64 bg-blue-600/20 blur-[100px] rounded-full pointer-events-none" />
        <div className="absolute -bottom-32 -right-32 w-64 h-64 bg-teal-600/10 blur-[100px] rounded-full pointer-events-none" />

        {/* Recording Section */}
        <div className="flex flex-col items-center justify-center gap-8 relative z-10 min-h-96">
          {/* Circular Record Button */}
          {!isProcessing && (
            <motion.div className="relative">
              {/* Outer ring pulse */}
              {isRecording && (
                <>
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 0.6, repeat: Infinity }}
                    className="absolute inset-0 rounded-full border-2 border-red-500/30 pointer-events-none"
                    style={{ width: 130, height: 130 }}
                  />
                  <motion.div
                    animate={{ scale: [1, 1.35, 1] }}
                    transition={{ duration: 0.6, repeat: Infinity, delay: 0.1 }}
                    className="absolute inset-0 rounded-full border border-red-500/20 pointer-events-none"
                    style={{ width: 150, height: 150 }}
                  />
                </>
              )}

              {/* Main Button */}
              <motion.button
                whileHover={!isRecording ? { scale: 1.1 } : undefined}
                whileTap={{ scale: 0.95 }}
                onClick={handleRecordClick}
                disabled={isProcessing}
                animate={isRecording ? { scale: [1, 1.05, 1] } : undefined}
                transition={
                  isRecording
                    ? { duration: 0.6, repeat: Infinity }
                    : undefined
                }
                className={`w-32 h-32 rounded-full flex items-center justify-center font-bold text-white shadow-2xl transition-all duration-300 relative z-20 ${
                  isRecording
                    ? "bg-linear-to-br from-red-600 to-red-700 ring-4 ring-red-500/30 cursor-pointer"
                    : "bg-linear-to-br from-blue-600 to-blue-700 ring-4 ring-blue-500/20 hover:ring-blue-400/40 cursor-pointer"
                } disabled:bg-slate-600 disabled:cursor-not-allowed`}
                title={
                  isRecording
                    ? "Presionar para pausar"
                    : "Presionar para grabar"
                }
              >
                {isRecording ? (
                  <Square size={48} className="fill-white" />
                ) : (
                  <Mic size={48} />
                )}
              </motion.button>
            </motion.div>
          )}

          {/* Processing State */}
          {isProcessing && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center gap-6"
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                className="w-32 h-32 rounded-full border-4 border-slate-700 border-t-purple-500 shadow-lg"
              />
              <motion.p
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="text-white font-bold text-lg"
              >
                Procesando audio...
              </motion.p>
            </motion.div>
          )}

          {/* Instructions Text */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center space-y-2"
          >
            <p className="text-slate-200 font-bold text-lg">
              {isProcessing
                ? "Análisis en progreso..."
                : isRecording
                  ? "Dicta ahora... Presiona el botón para pausar"
                  : "Presiona el botón para grabar"}
            </p>
            <p className="text-slate-400 text-sm max-w-md">
              {isRecording
                ? "Se pone en rojo, presiona de nuevo y hace la función de pausa"
                : "Al presionarlo, es tocar para grabar y capturar el audio clínico"}
            </p>
          </motion.div>
        </div>
      </motion.div>

      {/* Finalize Report Button */}
      <AnimatePresence>
        {reportId && !isRecording && !isProcessing && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex justify-center pt-4"
          >
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setShowFinalizeModal(true)}
              className="px-10 py-4 bg-linear-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white rounded-2xl font-bold text-lg transition-all shadow-lg flex items-center gap-3 group"
            >
              <CheckCircle size={24} className="group-hover:scale-110 transition-transform" />
              Finalizar Reporte
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Finalize Report Modal */}
      <AnimatePresence>
        {showFinalizeModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
            onClick={() => setShowFinalizeModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-linear-to-br from-slate-900 to-slate-950 border border-slate-700/80 rounded-3xl p-8 max-w-md w-full mx-4 shadow-2xl"
            >
              <h2 className="text-2xl font-bold text-white mb-2">
                Finalizar Reporte
              </h2>
              <p className="text-slate-400 text-sm mb-6">
                Confirma la finalización del reporte y añade notas finales si es necesario.
              </p>

              <div className="space-y-4 mb-6">
                <label className="block">
                  <span className="text-sm font-semibold text-slate-300 mb-2 block">
                    Notas Finales (Opcional)
                  </span>
                  <textarea
                    value={finalNotes}
                    onChange={(e) => setFinalNotes(e.target.value)}
                    placeholder="Añade observaciones o notas finales..."
                    className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/50 resize-none"
                    rows={4}
                  />
                </label>
              </div>

              <div className="flex gap-3">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setShowFinalizeModal(false)}
                  className="flex-1 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg font-semibold transition-colors"
                >
                  Cancelar
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleFinalizeClick}
                  disabled={isFinalizingReport}
                  className="flex-1 px-4 py-2 bg-linear-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 disabled:from-slate-600 disabled:to-slate-600 text-white rounded-lg font-semibold transition-all flex items-center justify-center gap-2"
                >
                  {isFinalizingReport ? (
                    <>
                      <Loader size={18} className="animate-spin" />
                      Finalizando...
                    </>
                  ) : (
                    <>
                      <CheckCircle size={18} />
                      Confirmar
                    </>
                  )}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
