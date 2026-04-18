<<<<<<< HEAD
﻿import { useState } from "react";
=======
﻿import React, { useState, useEffect } from "react";
>>>>>>> edd472bd21f9bfb2004c4c092ac8c3cc76ead16e
import { Activity, ShieldCheck, Brain, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import { Navbar } from "./components/layout/Navbar";
import { Header } from "./components/layout/Header";
import { MetricCard } from "./components/ui/MetricCard";

import { ReportsView } from "./features/reports/components/ReportsView";
import { RecordsView } from "./features/patients/components/RecordsView";
import { VisionView } from "./features/vision/components/VisionView";
<<<<<<< HEAD

export default function App() {
  const [activeTab, setActiveTab] = useState("reports");
=======
import { SignInView } from "./features/login/components/SignInView";
import { authService } from "./features/login/services/auth.service";
import { useAuthStore } from "./store/useAuthStore";

export default function App() {
  const [activeTab, setActiveTab] = useState("reports");
  const doctor = useAuthStore((state) => state.doctor);
  const token = useAuthStore((state) => state.token);

  // Debug effect to monitor doctor state changes
  useEffect(() => {
    console.log("App - Doctor state changed:", doctor);
  }, [doctor]);

  // Initialize auth on app load
  useEffect(() => {
    // Rehydrate state from localStorage
    useAuthStore.persist.rehydrate();

    // Initialize auth token in axios headers
    authService.initializeAuthToken();

    // If there's a token but no doctor, make sure the doctor is restored
    const storedToken = authService.getAuthToken();
    if (storedToken && !doctor) {
      // Token exists but doctor data might not be loaded yet due to async rehydration
      // Wait a moment for Zustand to rehydrate from localStorage
      const timer = setTimeout(() => {
        // Check again after rehydration
        const state = useAuthStore.getState();
        if (!state.doctor) {
          // If still no doctor, clear the token for security
          authService.logout();
          useAuthStore.getState().logout();
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, []);

  // Si no hay doctor autenticado, mostrar SignInView
  if (!doctor) {
    return <SignInView />;
  }
>>>>>>> edd472bd21f9bfb2004c4c092ac8c3cc76ead16e

  return (
    <div className="flex h-screen bg-[#060a16] text-slate-200 overflow-hidden font-sans selection:bg-blue-500/30 selection:text-white">
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />

      <div className="flex-1 flex flex-col overflow-y-auto custom-scrollbar relative z-10">
        <Header />

        <main className="p-8 lg:p-12 max-w-[1600px] w-full mx-auto pb-24 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 gap-6"
          >
            <div>
              <p className="text-blue-500/80 text-[10px] font-black uppercase tracking-[0.3em] mb-3 flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(59,130,246,0.8)]"></span>
                Lumy Hub
              </p>
              <h2 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-200 to-slate-500 tracking-tighter drop-shadow-sm">
                {activeTab === "reports"
                  ? "Panel de Inteligencia"
                  : activeTab === "records"
                    ? "Red de Expedientes"
                    : "Centro de Visión IA"}
              </h2>
            </div>

            <div className="flex items-center gap-5 bg-slate-900/40 border border-slate-800/80 p-2 pr-6 rounded-2xl backdrop-blur-md shadow-inner">
              <div className="w-12 h-12 bg-blue-600/10 border border-blue-500/20 rounded-xl flex items-center justify-center shadow-[inset_0_0_20px_rgba(59,130,246,0.1)]">
                <Activity
                  className="text-blue-400 drop-shadow-[0_0_5px_rgba(59,130,246,0.6)]"
                  size={24}
                />
              </div>
              <div className="text-right">
                <p className="text-[9px] text-slate-500 font-black uppercase tracking-[0.2em] mb-1">
                  Última Actualización
                </p>
                <p className="text-sm font-extrabold text-white tracking-wide">
                  Hace 12 seg
                </p>
              </div>
            </div>
          </motion.div>

<<<<<<< HEAD
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-12"
          >
            <MetricCard
              icon={Brain}
              label="Reducción Burnout"
              value="2.5h / día"
              color="blue"
              trend="+15%"
            />
            <MetricCard
              icon={ShieldCheck}
              label="Precisión Qx."
              value="100.0%"
              color="emerald"
              trend="Optimo"
            />
            <MetricCard
              icon={Activity}
              label="Capacidad Nido"
              value="84%"
              color="amber"
              trend="Normal"
            />
            <MetricCard
              icon={AlertCircle}
              label="Alertas Críticas"
              value="02"
              color="red"
              trend="-5%"
            />
          </motion.div>
=======
          {activeTab == "reports" && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-12"
            >
              <MetricCard
                icon={Brain}
                label="Reducción Burnout"
                value="2.5h / día"
                color="blue"
                trend="+15%"
              />
              <MetricCard
                icon={ShieldCheck}
                label="Precisión Qx."
                value="100.0%"
                color="emerald"
                trend="Optimo"
              />
              <MetricCard
                icon={Activity}
                label="Capacidad Nido"
                value="84%"
                color="amber"
                trend="Normal"
              />
              <MetricCard
                icon={AlertCircle}
                label="Alertas Críticas"
                value="02"
                color="red"
                trend="-5%"
              />
            </motion.div>
          )}
>>>>>>> edd472bd21f9bfb2004c4c092ac8c3cc76ead16e

          <div className="relative z-10 min-h-[500px]">
            <AnimatePresence mode="wait">
              {activeTab === "reports" && (
                <motion.div
                  key="reports"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.3 }}
                >
                  <ReportsView />
                </motion.div>
              )}
              {activeTab === "records" && (
                <motion.div
                  key="records"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.3 }}
                >
                  <RecordsView />
                </motion.div>
              )}
              {activeTab === "vision" && (
                <motion.div
                  key="vision"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.3 }}
                >
                  <VisionView />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </main>
      </div>

      <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden bg-[#060a16]">
        <div
          className="absolute top-[-20%] right-[-10%] w-[1000px] h-[1000px] bg-blue-600/5 blur-[150px] rounded-full mix-blend-screen animate-pulse"
          style={{ animationDuration: "8s" }}
        />
        <div
          className="absolute bottom-[-20%] left-[-10%] w-[800px] h-[800px] bg-teal-500/5 blur-[120px] rounded-full mix-blend-screen animate-pulse"
          style={{ animationDuration: "12s", animationDelay: "2s" }}
        />
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255, 255, 255, 1) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 1) 1px, transparent 1px)",
            backgroundSize: "100px 100px",
          }}
        />
      </div>
    </div>
  );
}
