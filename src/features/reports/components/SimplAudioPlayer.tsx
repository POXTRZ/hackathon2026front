import React, { useState, useRef } from "react";
import { Play, Pause, AlertCircle } from "lucide-react";
import { motion } from "framer-motion";

interface SimpleAudioPlayerProps {
  audioBase64: string;
  questionNumber?: number;
  totalQuestions?: number;
  className?: string;
}

export const SimpleAudioPlayer: React.FC<SimpleAudioPlayerProps> = ({
  audioBase64,
  questionNumber,
  totalQuestions,
  className = "",
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  const handlePlayClick = async () => {
    try {
      setError(null);

      if (!audioBase64) {
        setError("No hay audio disponible");
        return;
      }

      if (isPlaying) {
        // Pause
        if (audioRef.current) {
          audioRef.current.pause();
          setIsPlaying(false);
        }
        return;
      }

      // Decode base64 to Blob
      const binaryString = atob(audioBase64);
      const bytes = new Uint8Array(binaryString.length);

      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      // Create Blob and URL
      const audioBlob = new Blob([bytes], { type: "audio/mp3" });
      const audioUrl = URL.createObjectURL(audioBlob);

      // Set audio source and play
      if (audioRef.current) {
        audioRef.current.src = audioUrl;
        await audioRef.current.play();
        setIsPlaying(true);
      }
    } catch (err) {
      console.error("Error reproduciendo audio:", err);
      setError("Error al reproducir el audio");
      setIsPlaying(false);
    }
  };

  const handleAudioEnded = () => {
    setIsPlaying(false);
  };

  if (error) {
    return (
      <div className={`flex items-center gap-2 p-3 bg-red-900/20 border border-red-500/30 rounded-lg ${className}`}>
        <AlertCircle size={16} className="text-red-400" />
        <span className="text-xs text-red-400">{error}</span>
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-3 p-3 bg-slate-900/50 border border-slate-700/50 rounded-lg ${className}`}>
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={handlePlayClick}
        className="flex-shrink-0 p-2 bg-gradient-to-br from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white rounded-full transition-all shadow-lg"
        title={isPlaying ? "Pausar" : "Reproducir"}
      >
        {isPlaying ? (
          <Pause size={18} fill="currentColor" />
        ) : (
          <Play size={18} fill="currentColor" />
        )}
      </motion.button>

      <span className="text-xs text-slate-300 font-medium">
        {isPlaying ? "▶️ Reproduciendo..." : "🔊 Reproducir pregunta"}
      </span>

      {questionNumber && totalQuestions && (
        <span className="text-xs text-slate-500 ml-auto">
          P{questionNumber}/{totalQuestions}
        </span>
      )}

      <audio
        ref={audioRef}
        onEnded={handleAudioEnded}
        style={{ display: "none" }}
      />
    </div>
  );
};
