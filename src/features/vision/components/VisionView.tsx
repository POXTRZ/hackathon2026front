import { Camera, ShieldCheck } from "lucide-react";
import { motion } from "framer-motion";

export const VisionView = () => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.7, ease: "easeOut" }}
      className="grid grid-cols-1 lg:grid-cols-4 gap-8"
    >
      {/* Video Grid */}
      <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
        {/* Cam 1 - UCI */}
        <motion.div className="bg-black rounded-[2.5rem] overflow-hidden aspect-video relative border border-slate-700/80 shadow-2xl group hover:border-blue-500/50 transition-colors">
          <div className="absolute inset-0 bg-[#0f172a] flex items-center justify-center overflow-hidden">
            {/* Grid Pattern */}
            <div
              className="absolute inset-0 opacity-[0.15]"
              style={{
                backgroundImage:
                  "radial-gradient(circle, #60a5fa 1px, transparent 1px)",
                backgroundSize: "30px 30px",
              }}
            ></div>

            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 60, ease: "linear" }}
              className="absolute w-[200%] h-[200%] bg-gradient-to-r from-transparent via-blue-500/5 to-transparent pointer-events-none"
            />

            <Camera
              className="text-slate-800 drop-shadow-[0_0_15px_rgba(30,41,59,1)]"
              size={64}
            />

            {/* Vision Overlays (Bounding Boxes) */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.5 }}
              className="absolute top-1/4 left-1/4 w-40 h-56 border border-emerald-400/80 rounded-xl flex items-start p-2 bg-emerald-500/5 backdrop-blur-[2px] shadow-[inset_0_0_20px_rgba(16,185,129,0.2)]"
            >
              <div className="bg-emerald-500/90 backdrop-blur-md text-white text-[8px] font-black px-2 py-1 rounded shadow-lg tracking-widest flex items-center gap-2">
                PACIENTE: 98%
                <span className="w-1 h-1 rounded-full bg-white animate-pulse" />
              </div>
            </motion.div>
          </div>

          <div className="absolute top-6 left-6 bg-[#0a0f1d]/80 backdrop-blur-xl px-4 py-2 rounded-xl flex items-center gap-3 border border-white/10 ring-1 ring-black/50 shadow-xl">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(239,68,68,1)]"></div>
            <span className="text-[10px] font-extrabold text-slate-200 uppercase tracking-[0.2em]">
              UCI 04{" "}
              <span className="text-slate-500 font-bold ml-2">Contactless</span>
            </span>
          </div>

          <div className="absolute bottom-6 left-6 flex gap-3">
            <motion.div
              whileHover={{ y: -2 }}
              className="bg-[#0f172a]/90 backdrop-blur-md text-emerald-400 px-4 py-2 rounded-xl text-[11px] font-black tracking-widest border border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.2)]"
            >
              FC: 72 BPM
            </motion.div>
            <motion.div
              whileHover={{ y: -2 }}
              className="bg-[#0f172a]/90 backdrop-blur-md text-blue-400 px-4 py-2 rounded-xl text-[11px] font-black tracking-widest border border-blue-500/30 shadow-[0_0_15px_rgba(59,130,246,0.2)]"
            >
              FR: 18 RPM
            </motion.div>
          </div>
        </motion.div>

        {/* Cam 2 - Quirófano */}
        <motion.div className="bg-black rounded-[2.5rem] overflow-hidden aspect-video relative border border-slate-700/80 shadow-2xl group hover:border-amber-500/50 transition-colors">
          <div className="absolute inset-0 bg-[#0f172a] flex items-center justify-center overflow-hidden">
            <div
              className="absolute inset-0 opacity-[0.1]"
              style={{
                backgroundImage:
                  "linear-gradient(rgba(255, 255, 255, 0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.05) 1px, transparent 1px)",
                backgroundSize: "40px 40px",
              }}
            ></div>

            <Camera
              className="text-slate-800 drop-shadow-[0_0_15px_rgba(30,41,59,1)]"
              size={64}
            />

            {/* YOLO Boxes */}
            <motion.div
              animate={{ x: [0, 5, -5, 0], y: [0, -5, 5, 0] }}
              transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
              className="absolute top-1/2 left-1/2 w-20 h-20 border border-blue-400/80 rounded flex items-start p-1.5 bg-blue-500/5 backdrop-blur-[1px] shadow-[inset_0_0_15px_rgba(59,130,246,0.3)]"
            >
              <span className="bg-blue-600/90 backdrop-blur-md text-white text-[8px] font-black px-1.5 py-0.5 rounded shadow-lg tracking-widest">
                GASA
              </span>
            </motion.div>
            <motion.div
              animate={{ x: [0, -3, 3, 0], y: [0, 6, -3, 0] }}
              transition={{
                repeat: Infinity,
                duration: 5,
                ease: "linear",
                delay: 1,
              }}
              className="absolute top-1/3 left-1/3 w-28 h-14 border border-amber-400/80 rounded flex items-start p-1.5 bg-amber-500/5 backdrop-blur-[1px] shadow-[inset_0_0_15px_rgba(245,158,11,0.3)]"
            >
              <span className="bg-amber-600/90 backdrop-blur-md text-white text-[8px] font-black px-1.5 py-0.5 rounded shadow-lg tracking-widest">
                BISTURÍ
              </span>
            </motion.div>
          </div>

          <div className="absolute top-6 left-6 bg-[#0a0f1d]/80 backdrop-blur-xl px-4 py-2 rounded-xl flex items-center gap-3 border border-white/10 ring-1 ring-black/50 shadow-xl">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(239,68,68,1)]"></div>
            <span className="text-[10px] font-extrabold text-slate-200 uppercase tracking-[0.2em]">
              Quirófano 02{" "}
              <span className="text-slate-500 font-bold ml-2">YOLOv12</span>
            </span>
          </div>

          <div className="absolute bottom-6 right-6 bg-[#0f172a]/90 backdrop-blur-xl p-4 rounded-2xl border border-slate-700/80 shadow-[0_10px_40px_rgba(0,0,0,0.5)] flex flex-col items-end">
            <p className="text-[9px] text-slate-400 font-black uppercase tracking-[0.2em] mb-1 flex items-center gap-2">
              Conteo AI{" "}
              <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full shadow-[0_0_5px_rgba(16,185,129,1)]"></div>
            </p>
            <p className="text-xl text-white font-black tracking-tight">
              14 <span className="text-slate-500">/ 14</span>{" "}
              <span className="text-emerald-400 font-extrabold text-sm uppercase tracking-widest ml-2">
                OK
              </span>
            </p>
          </div>
        </motion.div>

        {/* Info Cards Grid */}
        <motion.div
          whileHover={{ scale: 1.02 }}
          className="bg-[#0f172a]/60 backdrop-blur-xl rounded-[2.5rem] p-8 border border-slate-800/80 shadow-2xl flex flex-col justify-center text-center relative overflow-hidden group hover:border-emerald-500/30 transition-colors"
        >
          <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-emerald-500/10 blur-[80px] group-hover:bg-emerald-500/20 transition-colors"></div>

          <div className="mb-6 relative z-10">
            <div className="w-16 h-16 bg-emerald-500/10 rounded-[1.5rem] flex items-center justify-center mx-auto mb-4 border border-emerald-500/20 shadow-[inset_0_0_20px_rgba(16,185,129,0.1)] group-hover:shadow-[inset_0_0_30px_rgba(16,185,129,0.3)] transition-shadow">
              <ShieldCheck
                className="text-emerald-400 drop-shadow-[0_0_10px_rgba(16,185,129,0.5)]"
                size={32}
              />
            </div>
            <h4 className="text-white font-extrabold text-xl tracking-tight">
              Prevención Caídas
            </h4>
            <p className="text-[11px] text-slate-400 font-bold uppercase tracking-[0.2em] mt-2">
              12 Cuartos Activos
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 relative z-10 w-full max-w-[250px] mx-auto">
            <div className="bg-[#0a0f1d]/80 p-4 rounded-2xl border border-slate-800/80 shadow-inner">
              <p className="text-[9px] text-slate-500 uppercase font-black tracking-[0.2em] mb-1">
                Alertas Hoy
              </p>
              <p className="text-2xl font-black text-white">0</p>
            </div>
            <div className="bg-[#0a0f1d]/80 p-4 rounded-2xl border border-slate-800/80 shadow-inner">
              <p className="text-[9px] text-slate-500 uppercase font-black tracking-[0.2em] mb-1">
                Precisión
              </p>
              <p className="text-2xl font-black text-emerald-400 drop-shadow-[0_0_10px_rgba(16,185,129,0.3)]">
                99%
              </p>
            </div>
          </div>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.02 }}
          className="bg-[#0f172a]/60 backdrop-blur-xl rounded-[2.5rem] p-8 border border-slate-800/80 shadow-2xl flex items-center justify-between gap-6 relative overflow-hidden group hover:border-blue-500/30 transition-colors"
        >
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 blur-[80px] group-hover:bg-blue-500/15 transition-colors"></div>

          <div className="flex-1 relative z-10">
            <h4 className="text-white font-extrabold text-xl tracking-tight">
              Signos Vitales Ópticos
            </h4>
            <p className="text-[11px] text-slate-400 font-bold uppercase tracking-[0.2em] mt-2">
              rPPG Matrix Activa
            </p>

            <div className="mt-8 flex items-baseline gap-3">
              <span className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-300 drop-shadow-[0_0_20px_rgba(59,130,246,0.3)]">
                72
              </span>
              <span className="text-xs font-black text-slate-500 uppercase tracking-widest">
                BPM
              </span>
            </div>
          </div>

          <div className="relative flex items-center justify-center p-4">
            <div className="absolute inset-0 rounded-full border-4 border-dashed border-slate-700 animate-[spin_10s_linear_infinite]" />
            <div className="w-28 h-28 rounded-full border-4 border-blue-500/20 border-t-blue-500 border-r-blue-400 animate-spin shadow-[0_0_30px_rgba(59,130,246,0.5)]"></div>
            <div className="absolute w-20 h-20 bg-[#0a0f1d] rounded-full flex items-center justify-center shadow-inner z-10">
              <Camera size={24} className="text-blue-500" />
            </div>
          </div>
        </motion.div>
      </div>

      {/* Sidebar Alerts */}
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6, delay: 0.3 }}
        className="lg:col-span-1 bg-[#0f172a]/80 border border-slate-800/80 rounded-[2.5rem] p-8 backdrop-blur-2xl shadow-2xl relative overflow-hidden"
      >
        <div className="absolute -bottom-20 -right-20 w-80 h-80 bg-slate-800/20 blur-[100px] pointer-events-none" />

        <div className="flex items-center justify-between mb-8 relative z-10">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-slate-900 rounded-lg ring-1 ring-slate-800/50">
              <ShieldCheck size={16} className="text-slate-400" />
            </div>
            <h4 className="text-[11px] font-black text-slate-300 uppercase tracking-[0.2em]">
              Logs Sistema AI
            </h4>
          </div>
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.8)] animate-pulse"></span>
        </div>

        <div className="space-y-6 relative z-10 pl-2">
          {[
            {
              time: "14:20",
              type: "Conteo AI",
              msg: "Quirófano 02: Análisis YOLO validado.",
              status: "ok",
            },
            {
              time: "14:15",
              type: "UCI Optic",
              msg: "UCI 04: Fluctuación rPPG (<2%).",
              status: "warn",
            },
            {
              time: "14:02",
              type: "Pose Est.",
              msg: "Hab 302: Paciente sentado en borde.",
              status: "info",
            },
            {
              time: "13:55",
              type: "Conteo AI",
              msg: "Quirófano 01: Matriz inicializada.",
              status: "ok",
            },
          ].map((log, i) => (
            <div
              key={i}
              className="relative pl-6 before:absolute before:left-0 before:top-2 before:bottom-[-24px] last:before:hidden before:w-[1px] before:bg-slate-800/80 group"
            >
              <div
                className={`absolute left-[-4px] top-2 w-2 h-2 rounded-full border border-[#0f172a] shadow-sm z-10 ${
                  log.status === "warn"
                    ? "bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.6)]"
                    : log.status === "info"
                      ? "bg-blue-400 shadow-[0_0_8px_rgba(96,165,250,0.6)]"
                      : "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]"
                }`}
              />

              <div className="flex flex-col gap-1 bg-[#0a0f1d]/40 p-4 rounded-2xl border border-slate-800/50 group-hover:bg-slate-900/60 transition-colors">
                <div className="flex items-center justify-between">
                  <p
                    className={`text-[10px] font-black uppercase tracking-[0.2em] ${
                      log.status === "warn"
                        ? "text-amber-400/90"
                        : log.status === "info"
                          ? "text-blue-400/90"
                          : "text-emerald-400/90"
                    }`}
                  >
                    {log.type}
                  </p>
                  <p className="text-[10px] text-slate-500 font-bold tracking-widest">
                    {log.time}
                  </p>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed font-medium mt-1">
                  {log.msg}
                </p>
              </div>
            </div>
          ))}
        </div>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="w-full mt-10 py-4 bg-[#0a0f1d] hover:bg-slate-950 text-slate-400 hover:text-white rounded-[1rem] font-bold text-[10px] uppercase tracking-[0.2em] transition-colors border border-slate-800/80 hover:border-slate-700 relative z-10 shadow-lg"
        >
          Expandir Data Lake
        </motion.button>
      </motion.div>
    </motion.div>
  );
};
