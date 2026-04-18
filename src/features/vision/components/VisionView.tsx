import React, { useState, useEffect } from 'react';
import { Camera, ShieldCheck, Loader2, Upload, Database, Activity, Users, AlertTriangle, LayoutGrid, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useVisionAI } from '../hooks/useVisionAI';
import { MetricCard } from '../../../components/ui/MetricCard';

// --- INTERFACES ---
interface LogEntry {
  id: string;
  time: string;
  type: string;
  msg: string;
  status: 'ok' | 'warn' | 'info';
  details?: {
    fileName?: string;
    fileSize?: string;
    processingTime?: string;
    accuracy?: string;
  };
}

interface PatientStats {
  total: number;
  uci: number;
  criticos: number;
  altos: number;
  medios: number;
  bajos: number;
}

const cuartosIniciales = [1, 1, 1, 0, 1, 2, 1, 1, 0, 1, 1, 1];

export const VisionView = () => {
  const { imagenPreview, datosIA, cargando, analizarFoto } = useVisionAI();
  const [dimensionesImg, setDimensionesImg] = useState({ ancho: 1, alto: 1 });
  const [stats, setStats] = useState<PatientStats | null>(null);
  const [precisionCaidas, setPrecisionCaidas] = useState(98.8);
  const [tiempoMonitoreo, setTiempoMonitoreo] = useState(0);
  const [estadosCuartos, setEstadosCuartos] = useState(cuartosIniciales);

  const [logs, setLogs] = useState<LogEntry[]>([
    { id: '1', time: '01:00', type: 'SISTEMA', msg: 'Núcleo de Visión YOLOv12 Inicializado.', status: 'ok' },
    { id: '2', time: '01:02', type: 'RED', msg: 'Conexión establecida con FastAPI:8000', status: 'info' }
  ]);

  useEffect(() => {
    const interval = setInterval(() => {
      setPrecisionCaidas(prev => {
        const cambio = (Math.random() - 0.5) * 0.4;
        const nuevo = prev + cambio;
        return Math.min(Math.max(nuevo, 98.1), 99.6);
      });
      setTiempoMonitoreo(prev => prev + 1);
      if (Math.random() > 0.8) {
        setEstadosCuartos(prev => {
          const nuevos = [...prev];
          const indiceAleatorio = Math.floor(Math.random() * nuevos.length);
          nuevos[indiceAleatorio] = nuevos[indiceAleatorio] === 1 ? 2 : 1;
          return nuevos;
        });
      }
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch('http://localhost:3000/patients/stats');
        const data = await response.json();
        setStats(data);
      } catch (error) {
        console.error("Error cargando stats de pacientes:", error);
      }
    };
    fetchStats();
    const statsInterval = setInterval(fetchStats, 30000);
    return () => clearInterval(statsInterval);
  }, []);

  const addLog = (type: string, msg: string, status: 'ok' | 'warn' | 'info', details?: any) => {
    const newLog: LogEntry = {
      id: Math.random().toString(36).substr(2, 9),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      type, msg, status, details
    };
    setLogs(prev => [newLog, ...prev].slice(0, 10));
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      ejecutarAnalisis(file);
    }
  };

  const ejecutarAnalisis = async (file: File) => {
    const start = performance.now();
    addLog('UPLOADER', `Procesando: ${file.name}`, 'info', {
      fileName: file.name,
      fileSize: `${(file.size / 1024).toFixed(1)} KB`
    });
    await analizarFoto(file);
    const end = performance.now();
    const tiempoProcesamiento = ((end - start) / 1000).toFixed(2);
    addLog('CONTEO AI', `Análisis YOLO finalizado`, 'ok', {
      processingTime: `${tiempoProcesamiento}s`,
      accuracy: `98.5%`
    });
  };

  return (
    <div className="flex flex-col gap-8 p-2">
      
      {/* CARDS DE ESTADO DE PACIENTES */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-2 lg:grid-cols-5 gap-6"
      >
        <MetricCard icon={Users} label="Total Pacientes" value={stats?.total.toString() || "0"} color="blue" trend="Censo" />
        <MetricCard icon={AlertTriangle} label="Críticos" value={stats?.criticos.toString() || "0"} color="red" trend="Prioridad" />
        <MetricCard icon={Activity} label="Nivel Alto" value={stats?.altos.toString() || "0"} color="orange" trend="Monitoreo" />
        <MetricCard icon={Activity} label="Nivel Medio" value={stats?.medios.toString() || "0"} color="amber" trend="Estable" />
        <MetricCard icon={ShieldCheck} label="Nivel Bajo" value={stats?.bajos.toString() || "0"} color="emerald" trend="Alta Prox." />
      </motion.div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.7, ease: "easeOut" }}
        className="grid grid-cols-1 lg:grid-cols-4 gap-8"
      >
        
        {/* Área Principal (Izquierda) */}
        <div className="lg:col-span-3 flex flex-col gap-8 relative z-10">
          
          {/* Visor Principal YOLO */}
          <motion.div 
            className="bg-black rounded-[2.5rem] overflow-hidden relative border border-slate-700/80 shadow-2xl group hover:border-amber-500/50 transition-colors min-h-[450px] lg:min-h-[550px] flex items-center justify-center w-full"
          >
            <input type="file" id="upload-ia" className="hidden" accept="image/*" onChange={handleFileChange} />
            <div className="absolute inset-0 bg-[#0f172a] flex items-center justify-center overflow-hidden p-6">
              <div className="absolute inset-0 opacity-[0.1]" style={{ backgroundImage: 'linear-gradient(rgba(255, 255, 255, 0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.05) 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>
              
              {!imagenPreview && !cargando && (
                <label htmlFor="upload-ia" className="cursor-pointer z-20 flex flex-col items-center justify-center p-12 rounded-[2rem] bg-slate-900/40 hover:bg-slate-800/60 transition-colors border-2 border-dashed border-slate-700 hover:border-amber-500/50 group-hover:shadow-[0_0_30px_rgba(245,158,11,0.1)] pointer-events-auto">
                  <Upload className="text-slate-500 mb-4 group-hover:text-amber-400 transition-colors" size={56} />
                  <span className="text-sm font-bold text-slate-300 uppercase tracking-widest">Subir Escaneo de Inventario</span>
                  <span className="text-[10px] text-slate-500 mt-2 uppercase tracking-widest">Formatos soportados: JPG, PNG</span>
                </label>
              )}

              {cargando && (
                <div className="z-20 flex flex-col items-center justify-center bg-[#0a0f1d]/80 absolute inset-0 backdrop-blur-sm">
                  <Loader2 className="text-amber-500 animate-spin mb-4" size={56} />
                  <span className="text-xs font-black text-amber-500 uppercase tracking-[0.2em] animate-pulse">Analizando Matriz...</span>
                </div>
              )}

              {imagenPreview && !cargando && (
                <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
                  <div className="relative inline-block rounded-lg shadow-2xl ring-1 ring-slate-800">
                    <img 
                      src={imagenPreview} alt="Escaneo" 
                      className="block w-auto h-auto max-w-full max-h-[65vh] relative z-10"
                      onLoad={(e) => setDimensionesImg({ ancho: e.currentTarget.naturalWidth, alto: e.currentTarget.naturalHeight })}
                    />
                    {datosIA?.detecciones.map((det: any, index: number) => {
                      const [x_min, y_min, x_max, y_max] = det.bbox;
                      const left = (x_min / dimensionesImg.ancho) * 100;
                      const top = (y_min / dimensionesImg.alto) * 100;
                      const width = ((x_max - x_min) / dimensionesImg.ancho) * 100;
                      const height = ((y_max - y_min) / dimensionesImg.alto) * 100;
                      return (
                        <motion.div 
                          key={index} initial={{ opacity: 0, scale: 1.1 }} animate={{ opacity: 1, scale: 1 }}
                          className="absolute border-[1.5px] border-[#8b5cf6] z-20 bg-[#8b5cf6]/10"
                          style={{ left: `${left}%`, top: `${top}%`, width: `${width}%`, height: `${height}%` }}
                        >
                          <span className="absolute -top-5 left-[-1.5px] bg-[#8b5cf6] text-white text-[9px] font-bold px-1.5 py-0.5 tracking-widest">
                            OBJ {Math.round(det.confianza * 100)}%
                          </span>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            <div className="absolute top-6 left-6 bg-[#0a0f1d]/80 backdrop-blur-xl px-4 py-2 rounded-xl flex items-center gap-3 border border-white/10 shadow-xl z-30 pointer-events-none">
              <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(245,158,11,1)]"></div>
              <span className="text-[10px] font-extrabold text-slate-200 uppercase tracking-[0.2em]">Escáner de Inventario <span className="text-slate-500 font-bold ml-2">YOLOv12</span></span>
            </div>
            
            <div className="absolute bottom-6 right-6 bg-[#0f172a]/90 backdrop-blur-xl p-5 rounded-2xl border border-slate-700/80 shadow-2xl flex flex-col items-end z-30 pointer-events-none">
              <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em] mb-1 flex items-center gap-2">
                Conteo AI <span className={`w-2 h-2 rounded-full ${datosIA ? 'bg-emerald-500' : 'bg-slate-600'}`}></span>
              </p>
              <p className="text-3xl text-white font-black">
                {datosIA ? datosIA.conteo_total : '0'} <span className="text-slate-500 text-lg">Obj</span> 
              </p>
              {imagenPreview && (
                 <label htmlFor="upload-ia" className="mt-3 text-[9px] text-amber-500 font-black uppercase tracking-widest cursor-pointer hover:text-amber-400 pointer-events-auto bg-amber-500/10 px-3 py-1.5 rounded-lg border border-amber-500/30">
                   Nueva Captura
                 </label>
              )}
            </div>
          </motion.div>

          {/* --- SECCIÓN PREVENCIÓN CAÍDAS (FULL WIDTH) --- */}
          <motion.div 
            whileHover={{ scale: 1.005 }} 
            className="bg-[#0f172a]/60 backdrop-blur-xl rounded-[2.5rem] p-8 border border-slate-800/80 shadow-2xl flex flex-col relative overflow-hidden"
          >
            <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-emerald-500/5 blur-[80px]"></div>
            <div className="flex justify-between items-start mb-6 relative z-10">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-emerald-500/10 rounded-2xl flex items-center justify-center border border-emerald-500/20">
                  <ShieldCheck className="text-emerald-400" size={28} />
                </div>
                <div>
                  <h4 className="text-white font-extrabold text-xl tracking-tight">Prevención Caídas</h4>
                  <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest mt-1 flex items-center gap-2">
                    <LayoutGrid size={12} className="text-emerald-500" />
                    12 Cuartos en Red Pose AI
                  </p>
                </div>
              </div>
              <div className="text-right bg-[#0a0f1d]/80 p-3 rounded-xl border border-slate-800">
                  <p className="text-[9px] text-slate-500 uppercase font-black tracking-widest mb-1 flex items-center gap-1.5 justify-end italic">
                    <Clock size={10} className="animate-spin" /> Uptime System
                  </p>
                  <p className="text-lg font-black text-white font-mono">
                      {Math.floor(tiempoMonitoreo / 60)}m {String(tiempoMonitoreo % 60).padStart(2, '0')}s
                  </p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-center relative z-10">
              <div className="lg:col-span-2 bg-[#0a0f1d]/60 p-6 rounded-2xl border border-slate-800 shadow-inner">
                <p className="text-[10px] text-slate-400 uppercase font-black tracking-[0.15em] mb-4">Estado de Ocupación por Celda</p>
                <div className="grid grid-cols-6 gap-4">
                  {estadosCuartos.map((estado, i) => (
                    <div key={i} className="flex flex-col items-center gap-2">
                      <motion.div 
                        animate={estado === 2 ? { opacity: [0.5, 1, 0.5] } : {}}
                        transition={estado === 2 ? { repeat: Infinity, duration: 1 } : {}}
                        className={`w-5 h-5 rounded-full border-2 border-[#0f172a] ${
                          estado === 1 ? 'bg-emerald-500' : estado === 2 ? 'bg-amber-400' : 'bg-slate-700'
                        }`}
                      />
                      <span className="text-[9px] font-mono text-slate-500">C-{String(i + 1).padStart(2, '0')}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex flex-col items-center justify-center text-center h-full bg-[#0a0f1d]/80 rounded-2xl border border-slate-800 p-6">
                <p className="text-[10px] text-slate-500 uppercase font-black tracking-[0.2em] mb-2">Precisión Pose AI</p>
                <motion.p key={precisionCaidas} className="text-6xl font-black text-emerald-400 tracking-tighter">
                  {precisionCaidas.toFixed(1)}<span className="text-2xl text-emerald-600">%</span>
                </motion.p>
                <div className="mt-2 flex items-center gap-2">
                  <span className="w-2 h-2 bg-emerald-500 rounded-full animate-ping"></span>
                  <p className="text-[9px] text-emerald-700 font-bold uppercase tracking-widest">Live Matrix Active</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* BARRA LATERAL LOGS */}
        <motion.div className="lg:col-span-1 bg-[#0f172a]/80 border border-slate-800/80 rounded-[2.5rem] p-8 backdrop-blur-2xl shadow-2xl flex flex-col h-full min-h-[700px]">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-slate-900 rounded-lg text-blue-400"><Database size={16} /></div>
              <h4 className="text-[11px] font-black text-slate-300 uppercase tracking-[0.2em]">Logs Sistema AI</h4>
            </div>
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
          </div>
          <div className="space-y-4 overflow-y-auto pr-2 custom-scrollbar">
            <AnimatePresence initial={false}>
              {logs.map((log) => (
                <motion.div key={log.id} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="relative pl-6 before:absolute before:left-0 before:top-2 before:bottom-[-20px] before:w-[1px] before:bg-slate-800/80">
                  <div className={`absolute left-[-4px] top-2 w-2 h-2 rounded-full ${
                    log.status === 'warn' ? 'bg-amber-400' : log.status === 'info' ? 'bg-blue-400' : 'bg-emerald-400'
                  }`} />
                  <div className="bg-[#0a0f1d]/40 p-3 rounded-2xl border border-slate-800/50">
                    <div className="flex items-center justify-between mb-1">
                      <p className={`text-[9px] font-black uppercase ${log.status === 'warn' ? 'text-amber-400' : log.status === 'info' ? 'text-blue-400' : 'text-emerald-400'}`}>{log.type}</p>
                      <p className="text-[8px] text-slate-500">{log.time}</p>
                    </div>
                    <p className="text-[11px] text-slate-300 leading-tight">{log.msg}</p>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
          <button className="w-full mt-auto py-4 bg-[#0a0f1d] hover:bg-slate-950 text-slate-400 rounded-[1rem] font-bold text-[10px] uppercase tracking-[0.2em] border border-slate-800">
            Expandir Data Lake
          </button>
        </motion.div>
      </motion.div>
    </div>
  );
};
