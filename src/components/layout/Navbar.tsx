import React, { useEffect } from "react";
import { ShieldCheck, Brain, FileText, Eye, User } from "lucide-react";
import { motion } from "framer-motion";
import { useAuthStore } from "../../store/useAuthStore";
import { authService } from "../../features/login/services/auth.service";

export const Navbar = ({
  activeTab,
  setActiveTab,
}: {
  activeTab: string;
  setActiveTab: (t: string) => void;
}) => {
  const { doctor, logout } = useAuthStore();

  useEffect(() => {
    if (doctor) {
      console.log("====== Navbar - Doctor data updated:", doctor);
      console.log("====== Navbar - Doctor name:", doctor.name);
      console.log("====== Navbar - Hospital name:", doctor.hospitalName);
    } else {
      console.log("====== Navbar - No doctor data");
    }
  }, [doctor]);

  const tabs = [
    { id: "reports", label: "Reportes AI", icon: Brain },
    { id: "records", label: "Expedientes", icon: FileText },
    { id: "vision", label: "Visión", icon: Eye },
  ];

  const handleLogout = () => {
    // Clear auth store first (triggers App.tsx to show SignInView)
    logout();
    // Then clear token from localStorage and axios headers
    authService.logout();
    console.log("Sesión cerrada correctamente");
  };

  return (
    <motion.div
      initial={{ x: -100, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      className="w-20 lg:w-72 bg-slate-950/80 backdrop-blur-3xl border-r border-slate-800 flex flex-col items-center lg:items-start py-8 relative z-50"
    >
      {/* Glow Effect Top Left */}
      <div className="absolute top-0 left-0 w-64 h-64 bg-blue-600/10 rounded-full blur-[80px] pointer-events-none" />

      <div className="px-6 mb-12 flex items-center gap-4 relative z-10 w-full">
        <motion.div
          whileHover={{ rotate: 180 }}
          transition={{ duration: 0.4 }}
          className="w-12 h-12 rounded-xl flex items-center justify-center shadow-lg shadow-blue-600/30 flex-shrink-0 relative overflow-hidden bg-transparent"
        >
          <img
            src="/favicon.svg"
            alt="Nexus logo"
            className="w-full h-full object-contain"
          />
        </motion.div>

        <div className="hidden lg:block overflow-hidden">
          <h1 className="font-extrabold text-xl tracking-tighter text-white leading-none">
            LUMY
          </h1>
          <span className="text-blue-500 font-medium text-xs tracking-widest uppercase">
            Med Digital
          </span>
        </div>
      </div>

      <nav className="flex-1 w-full px-4 space-y-2 relative z-10">
        {tabs.map((tab, idx) => {
          const isActive = activeTab === tab.id;
          return (
            <motion.button
              key={tab.id}
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.1 * idx }}
              onClick={() => setActiveTab(tab.id)}
              className="w-full relative group outline-none"
            >
              {isActive && (
                <motion.div
                  layoutId="activeTabBg"
                  className="absolute inset-0 bg-blue-600/90 rounded-2xl shadow-xl shadow-blue-600/30 ring-1 ring-blue-500"
                />
              )}
              <div
                className={`relative flex items-center justify-center lg:justify-start gap-4 px-4 py-4 rounded-2xl transition-colors duration-300 ${
                  isActive
                    ? "text-white"
                    : "text-slate-400 group-hover:bg-slate-900/50 group-hover:text-slate-200"
                }`}
              >
                <tab.icon
                  size={22}
                  className={isActive ? "animate-pulse-slow" : ""}
                />
                <span className="hidden lg:block font-bold text-sm tracking-wide">
                  {tab.label}
                </span>
              </div>
            </motion.button>
          );
        })}
      </nav>

      <div className="p-4 w-full relative z-10">
        <motion.div
          whileHover={{ y: -2 }}
          className="bg-slate-900/60 backdrop-blur-md rounded-2xl p-4 hidden lg:block border border-slate-800 hover:border-slate-700 transition-all cursor-pointer"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-500/20 to-purple-500/20 flex items-center justify-center ring-1 ring-blue-500/30 relative overflow-hidden">
              <div className="absolute inset-0 bg-blue-500/10 blur-xl" />
              <User className="text-blue-400 relative z-10" size={20} />
            </div>
            <div>
              <p className="text-sm font-bold text-white tracking-tight">
                {doctor?.name || "Dr."}
              </p>
              <p className="text-[10px] uppercase tracking-widest text-blue-400/80 font-semibold">
                {doctor?.hospitalName || "Hospital"}
              </p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full py-2.5 bg-slate-950 hover:bg-red-500/10 text-slate-400 hover:text-red-400 rounded-xl text-[10px] font-extrabold uppercase tracking-widest transition-colors ring-1 ring-slate-800 hover:ring-red-500/30"
          >
            Cerrar Sesión
          </button>
        </motion.div>
      </div>
    </motion.div>
  );
};
