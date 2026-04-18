import { Layers, Bell, Settings } from "lucide-react";
import { motion } from "framer-motion";

export const Header = () => {
  return (
    <motion.header
      initial={{ y: -50, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="h-20 px-8 flex items-center justify-between border-b border-slate-800/80 sticky top-0 bg-[#0a0f1d]/70 backdrop-blur-2xl z-40 mx-4 mt-4 rounded-3xl lg:rounded-b-none lg:mx-0 lg:mt-0 lg:rounded-none ring-1 ring-slate-800/50"
    >
      <div className="flex items-center gap-4">
        <div className="hidden md:flex items-center gap-3 px-4 py-2 bg-slate-900/50 rounded-full border border-emerald-500/20 shadow-inner">
          <div className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
          </div>
          <span className="text-[10px] font-extrabold text-slate-300 uppercase tracking-widest">
            Red Regional <span className="text-emerald-400">Sincronizada</span>
          </span>
        </div>
      </div>

      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2 text-slate-300 px-3 py-1.5 rounded-lg bg-slate-950/40 ring-1 ring-slate-800">
          <Layers size={16} className="text-blue-400" />
          <span className="text-xs font-bold tracking-widest uppercase text-slate-400">
            Node: <span className="text-white">MX-QTRO-01</span>
          </span>
        </div>
        <div className="h-8 w-[1px] bg-slate-800/80"></div>
        <button className="relative p-2 text-slate-400 hover:text-white hover:bg-slate-900 rounded-xl transition-colors ring-1 ring-transparent hover:ring-slate-800">
          <Bell size={20} />
          <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-blue-500 rounded-full border-2 border-[#0a0f1d] animate-pulse"></span>
        </button>
        <button className="p-2 text-slate-400 hover:text-white hover:bg-slate-900 rounded-xl transition-colors ring-1 ring-transparent hover:ring-slate-800">
          <Settings size={20} />
        </button>
      </div>
    </motion.header>
  );
};
