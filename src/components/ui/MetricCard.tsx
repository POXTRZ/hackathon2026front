import React from 'react';
import { motion } from 'framer-motion';

interface MetricCardProps {
  icon: React.ElementType;
  label: string;
  value: string;
  color: string;
  trend: string;
}

export const MetricCard: React.FC<MetricCardProps> = ({ icon: Icon, label, value, color, trend }) => {
  const colorStyles: Record<string, { bg: string; text: string; ring: string; blur: string }> = {
    blue: { bg: 'bg-blue-500/10', text: 'text-blue-400', ring: 'ring-blue-500/20', blur: 'bg-blue-500/5 group-hover:bg-blue-500/10' },
    emerald: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', ring: 'ring-emerald-500/20', blur: 'bg-emerald-500/5 group-hover:bg-emerald-500/10' },
    amber: { bg: 'bg-amber-500/10', text: 'text-amber-400', ring: 'ring-amber-500/20', blur: 'bg-amber-500/5 group-hover:bg-amber-500/10' },
    red: { bg: 'bg-red-500/10', text: 'text-red-400', ring: 'ring-red-500/20', blur: 'bg-red-500/5 group-hover:bg-red-500/10' },
  };
  const theme = colorStyles[color] || colorStyles.blue;

  return (
    <motion.div 
      whileHover={{ scale: 1.02, y: -2 }}
      className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6 backdrop-blur-md relative overflow-hidden group hover:border-slate-700 transition-colors"
    >
      <div className={`absolute top-0 right-0 w-32 h-32 rounded-full blur-2xl -mr-10 -mt-10 transition-colors ${theme.blur}`} />
      
      <div className="flex justify-between items-start mb-4 relative z-10">
        <div className={`p-3 rounded-xl ${theme.bg} ${theme.text} ring-1 ${theme.ring}`}>
          <Icon size={24} />
        </div>

        <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${trend.startsWith('-') ? 'bg-red-500/10 text-red-400 ring-1 ring-red-500/20' : trend === 'Normal' || trend === 'Optimo' ? 'bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/20' : 'bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/20'}`}>
          {trend}
        </span>
      </div>
      <p className="text-slate-500 text-xs font-bold uppercase tracking-[0.2em] relative z-10">{label}</p>
      <h3 className="text-2xl font-black text-white mt-1 relative z-10 tracking-tight">{value}</h3>
    </motion.div>
  );
};
