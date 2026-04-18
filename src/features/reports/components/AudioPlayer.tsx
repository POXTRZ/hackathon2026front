import React, { useState, useRef, useEffect } from "react";
import { Play, Pause, Volume2, VolumeX } from "lucide-react";
import { motion } from "framer-motion";

interface AudioPlayerProps {
  audioBase64: string;
  questionNumber?: number;
  totalQuestions?: number;
  className?: string;
}

export const AudioPlayer: React.FC<AudioPlayerProps> = ({
  audioBase64,
  questionNumber,
  totalQuestions,
  className = "",
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioUrlRef = useRef<string | null>(null);

  // Initialize audio from base64
  useEffect(() => {
    try {
      setIsLoading(true);
      setError(null);

      // Decode base64 to Uint8Array
      const binaryString = atob(audioBase64);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      // Create Blob from bytes
      const blob = new Blob([bytes], { type: "audio/mp3" });
      const url = URL.createObjectURL(blob);
      audioUrlRef.current = url;

      // Create or update audio element
      if (!audioRef.current) {
        const audio = new Audio();
        audio.addEventListener("loadedmetadata", () => {
          setDuration(audio.duration);
          setIsLoading(false);
        });
        audio.addEventListener("timeupdate", () => {
          setCurrentTime(audio.currentTime);
        });
        audio.addEventListener("ended", () => {
          setIsPlaying(false);
          setCurrentTime(0);
        });
        audio.addEventListener("error", () => {
          setError("Error al cargar el audio");
          setIsLoading(false);
        });
        audio.src = url;
        audioRef.current = audio;
      } else {
        audioRef.current.src = url;
      }
    } catch (err) {
      console.error("Error creating audio player:", err);
      setError("Error al procesar el audio");
      setIsLoading(false);
    }

    // Cleanup
    return () => {
      if (audioUrlRef.current) {
        URL.revokeObjectURL(audioUrlRef.current);
      }
    };
  }, [audioBase64]);

  // Handle play/pause
  const handlePlayPause = async () => {
    if (!audioRef.current) return;

    try {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        await audioRef.current.play();
        setIsPlaying(true);
      }
    } catch (err) {
      console.error("Error playing audio:", err);
      setError("Error al reproducir el audio");
    }
  };

  // Handle seek
  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = parseFloat(e.target.value);
    if (audioRef.current) {
      audioRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  // Handle volume change
  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
    }
    if (newVolume > 0) {
      setIsMuted(false);
    }
  };

  // Handle mute
  const handleMute = () => {
    if (!audioRef.current) return;

    if (isMuted) {
      audioRef.current.volume = volume;
      setIsMuted(false);
    } else {
      audioRef.current.volume = 0;
      setIsMuted(true);
    }
  };

  // Format time
  const formatTime = (time: number): string => {
    if (isNaN(time)) return "0:00";
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  if (error) {
    return (
      <div className={`bg-red-900/20 border border-red-500/30 rounded-lg p-3 ${className}`}>
        <p className="text-xs text-red-400">⚠️ {error}</p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`bg-gradient-to-r from-slate-900 to-slate-950 border border-slate-700/50 rounded-lg p-4 backdrop-blur-sm ${className}`}
    >
      <div className="flex items-center gap-3">
        {/* Play/Pause Button */}
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          onClick={handlePlayPause}
          disabled={isLoading}
          className="flex-shrink-0 p-2 bg-gradient-to-br from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 disabled:from-slate-600 disabled:to-slate-700 text-white rounded-full transition-all shadow-lg hover:shadow-blue-500/50 disabled:shadow-none"
          title={isPlaying ? "Pausar" : "Reproducir"}
        >
          {isLoading ? (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : isPlaying ? (
            <Pause size={16} fill="currentColor" />
          ) : (
            <Play size={16} fill="currentColor" />
          )}
        </motion.button>

        {/* Timeline and Duration */}
        <div className="flex-1 flex items-center gap-2">
          <input
            type="range"
            min="0"
            max={duration || 0}
            value={currentTime}
            onChange={handleSeek}
            disabled={isLoading || duration === 0}
            className="flex-1 h-2 bg-slate-700 rounded-full appearance-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              background: `linear-gradient(to right, rgb(59, 130, 246) 0%, rgb(59, 130, 246) ${
                duration > 0 ? (currentTime / duration) * 100 : 0
              }%, rgb(55, 65, 81) ${
                duration > 0 ? (currentTime / duration) * 100 : 0
              }%, rgb(55, 65, 81) 100%)`,
            }}
          />
          <span className="text-xs text-slate-400 font-mono w-12 text-right flex-shrink-0">
            {formatTime(currentTime)} / {formatTime(duration)}
          </span>
        </div>

        {/* Volume Control */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleMute}
            className="p-1.5 hover:bg-slate-700/50 rounded-full transition-colors text-slate-400 hover:text-slate-200"
            title={isMuted ? "Activar sonido" : "Silenciar"}
          >
            {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
          </motion.button>
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={isMuted ? 0 : volume}
            onChange={handleVolumeChange}
            className="w-16 h-1.5 bg-slate-700 rounded-full appearance-none cursor-pointer"
            style={{
              background: `linear-gradient(to right, rgb(59, 130, 246) 0%, rgb(59, 130, 246) ${
                (volume * 100).toFixed(0)
              }%, rgb(55, 65, 81) ${(volume * 100).toFixed(0)}%, rgb(55, 65, 81) 100%)`,
            }}
            title="Volumen"
          />
        </div>

        {/* Question Indicator */}
        {questionNumber !== undefined && totalQuestions !== undefined && (
          <span className="text-xs text-slate-500 font-semibold flex-shrink-0">
            P{questionNumber}/{totalQuestions}
          </span>
        )}
      </div>
    </motion.div>
  );
};
