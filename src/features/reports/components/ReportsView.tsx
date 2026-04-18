import React, { useState } from 'react';
import { Activity, Mic, Brain, TrendingUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const TRIAGE_TREND = [
  { name: '00h', value: 30, prediction: 35 },
  { name: '04h', value: 25, prediction: 28 },
  { name: '08h', value: 65, prediction: 70 },
  { name: '12h', value: 85, prediction: 82 },
  { name: '16h', value: 55, prediction: 60 },
  { name: '20h', value: 90, prediction: 95 },
];

export const ReportsView = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<any>(null);

  const startScribing = () => {
    setIsRecording(true);
    setAiAnalysis(null);
    setTimeout(() => {
      setIsRecording(false);
      setAiAnalysis({
        summary: "Paciente masculino con trauma torácico leve. Signos estables.",
        diagnosis: "Posible fisura costal en 5ta vértebra.",
        triage: "Prioridad 3 - Estable",
        nextSteps: ["Radiografía de tórax", "Administrar analgésico IV"]
      });
    }, 3500);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="grid grid-cols-1 lg:grid-cols-3 gap-8"
    >
      
      {/* Scribing Area */}
      <div className="lg:col-span-2 space-y-8">
        <motion.div 
          className="bg-[#0f172a]/80 border border-slate-800/80 rounded-[2rem] p-10 backdrop-blur-2xl shadow-2xl relative overflow-hidden"
        >
          {/* Glass effects */}
          <div className="absolute -top-40 -left-40 w-96 h-96 bg-blue-600/10 blur-[100px] rounded-full pointer-events-none" />
          
          <div className="flex items-center justify-between mb-10 relative z-10">
            <div>
              <h2 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400 tracking-tight">
                Inteligencia Clínica Ambiental
              </h2>
              <p className="text-blue-400 font-medium text-xs mt-2 uppercase tracking-widest flex items-center gap-2">
                <Brain size={14} /> Scribe Autonómo Gemini Pro
              </p>
            </div>
            <div className="flex items-center gap-3 bg-slate-900/50 py-2 px-4 rounded-full border border-slate-800/50">
              <div className={`w-2 h-2 rounded-full ${isRecording ? 'bg-red-500 animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.8)]' : 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.8)]'}`}></div>
              <span className="text-[10px] font-extrabold text-slate-300 uppercase tracking-widest">
                {isRecording ? 'Capturando Audio' : 'Sistema Listo'}
              </span>
            </div>
          </div>

          <div className="relative group cursor-pointer" onClick={startScribing}>
            <div className={`absolute inset-0 border-2 border-dashed rounded-[2rem] transition-colors duration-500 ${isRecording ? 'border-red-500/30 bg-red-500/5' : 'border-blue-500/20 bg-blue-500/5 group-hover:border-blue-400/40 group-hover:bg-blue-500/10'}`} />
            
            <div className="flex flex-col items-center justify-center py-16 relative z-10">
              <motion.button 
                whileHover={!isRecording ? { scale: 1.1 } : {}}
                whileTap={!isRecording ? { scale: 0.95 } : {}}
                disabled={isRecording}
                className={`w-28 h-28 rounded-full flex items-center justify-center transition-all duration-500 relative ${
                  isRecording 
                  ? 'bg-red-500 text-white shadow-[0_0_40px_rgba(239,68,68,0.5)] ring-4 ring-red-500/20' 
                  : 'bg-blue-600 text-white shadow-[0_0_30px_rgba(37,99,235,0.4)] ring-4 ring-transparent group-hover:ring-blue-500/30'
                }`}
              >
                {isRecording ? (
                  <Activity size={48} className="animate-spin-slow" />
                ) : (
                  <Mic size={48} />
                )}
                
                {isRecording && (
                  <div className="absolute inset-0 rounded-full border-2 border-white/20 animate-ping" />
                )}
              </motion.button>
              
              <p className="text-slate-400 mt-8 text-sm font-bold uppercase tracking-widest">
                {isRecording ? "Procesando Ondas Vocales..." : "Toca para Scribe Analítico"}
              </p>
            </div>
          </div>

          <AnimatePresence>
            {aiAnalysis && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="mt-10 p-8 bg-gradient-to-br from-blue-900/40 to-slate-900/60 border border-blue-500/30 rounded-[2rem] shadow-2xl relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/20 blur-3xl pointer-events-none" />
                
                <div className="flex items-center gap-3 mb-6 text-blue-400 relative z-10">
                  <Brain size={24} className="animate-pulse-slow" />
                  <span className="text-xs font-black uppercase tracking-[0.2em]">Síntesis Gemini</span>
                </div>
                
                <h4 className="text-2xl text-white font-bold leading-relaxed mb-6 relative z-10 max-w-2xl">
                  "{aiAnalysis.summary}"
                </h4>
                
                <div className="grid grid-cols-2 gap-6 relative z-10">
                  <div className="bg-slate-950/60 p-5 rounded-2xl border border-slate-800/80 hover:border-blue-500/30 transition-colors">
                    <p className="text-[10px] text-blue-400/80 uppercase font-black tracking-widest mb-2">Diagnóstico Latente</p>
                    <p className="text-sm text-slate-200 font-semibold leading-relaxed">{aiAnalysis.diagnosis}</p>
                  </div>
                  <div className="bg-slate-950/60 p-5 rounded-2xl border border-slate-800/80 hover:border-emerald-500/30 transition-colors flex flex-col justify-between">
                    <p className="text-[10px] text-emerald-400/80 uppercase font-black tracking-widest mb-2">Triage Sugerido</p>
                    <p className="text-xl text-emerald-400 font-black tracking-tight">{aiAnalysis.triage}</p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>

      {/* Triage Predictivo Chart */}
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
        <p className="text-slate-500 font-semibold text-xs mb-8 tracking-wide relative z-10">Modelado predictivo AI en tiempo real</p>
        
        <div className="h-72 w-full relative z-10">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={TRIAGE_TREND} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorPred" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
              <XAxis dataKey="name" stroke="#475569" fontSize={10} axisLine={false} tickLine={false} dy={10} />
              <YAxis stroke="#475569" fontSize={10} axisLine={false} tickLine={false} dx={-10} />
              <Tooltip 
                contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', border: '1px solid #334155', borderRadius: '16px', fontSize: '11px', backdropFilter: 'blur(10px)', color: '#f8fafc', fontWeight: 'bold' }}
                itemStyle={{ color: '#fff' }}
                cursor={{ stroke: '#334155', strokeWidth: 1, strokeDasharray: '4 4' }}
              />
              <Area type="monotone" dataKey="value" stroke="#3b82f6" fillOpacity={1} fill="url(#colorValue)" strokeWidth={3} activeDot={{ r: 6, fill: '#3b82f6', stroke: '#0f172a', strokeWidth: 2 }} />
              <Area type="monotone" dataKey="prediction" stroke="#ef4444" strokeDasharray="5 5" fill="url(#colorPred)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="mt-auto pt-8 border-t border-slate-800/50 relative z-10">
          <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-[0.2em] mb-3">
            <span className="text-slate-400">Alerta 20:00h</span>
            <span className="text-red-400 drop-shadow-[0_0_5px_rgba(239,68,68,0.8)]">Crítico (95%)</span>
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

    </motion.div>
  );
};