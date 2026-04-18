import { useState, useEffect } from "react";
import {
  Search,
  ChevronRight,
  Zap,
  Volume2,
  MessageSquare,
  AlertCircle,
} from "lucide-react";
import { motion } from "framer-motion";
import { patientsService } from "../services/patients.service";
import type { Patient } from "../../../types";

export const RecordsView = () => {
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [isPlayingVoice, setIsPlayingVoice] = useState(false);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch patients on component mount
  useEffect(() => {
    const fetchPatients = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await patientsService.getAllPatients();
        setPatients(data);
      } catch (err) {
        console.error("Error fetching patients:", err);
        setError(
          "No se pudieron cargar los pacientes. Verifica que el servidor esté en puerto 4000.",
        );
      } finally {
        setLoading(false);
      }
    };

    fetchPatients();
  }, []);

  // Helper function to map triage level to priority display
  const getPatientPriority = (
    triageLevel: string,
  ): "Alta" | "Media" | "Baja" => {
    switch (triageLevel.toLowerCase()) {
      case "alto":
        return "Alta";
      case "medio":
        return "Media";
      case "bajo":
      default:
        return "Baja";
    }
  };

  // Filter patients by search query
  const filteredPatients = patients.filter(
    (p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.diagnosis.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const playVoice = () => {
    setIsPlayingVoice(true);
    setTimeout(() => setIsPlayingVoice(false), 3000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="grid grid-cols-1 lg:grid-cols-4 gap-8"
    >
      {/* Patient List */}
      <div className="lg:col-span-3 bg-[#0f172a]/80 border border-slate-800/80 rounded-[2.5rem] p-10 backdrop-blur-2xl shadow-2xl relative overflow-hidden group">
        <div className="absolute top-0 left-0 w-96 h-96 bg-blue-600/5 blur-[100px] pointer-events-none group-hover:bg-blue-600/10 transition-colors" />

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12 relative z-10">
          <div>
            <h2 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400 tracking-tight">
              Red Regional Intra-Hospitalaria
            </h2>
            <p className="text-blue-400 font-medium text-xs mt-2 uppercase tracking-widest">
              Sincronización HL7 FHIR (1.2ms)
            </p>
          </div>
          <div className="relative w-full md:w-80 group/search">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl blur opacity-20 group-hover/search:opacity-40 transition duration-500" />
            <div className="relative bg-slate-900 ring-1 ring-slate-800 rounded-2xl flex items-center p-1 px-3">
              <Search
                className="text-slate-400 mr-2 group-focus-within/search:text-blue-400 transition-colors"
                size={18}
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar por nombre o diagnóstico..."
                className="w-full bg-transparent border-none py-2.5 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-0 leading-tight placeholder:tracking-wide font-medium"
              />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto relative z-10 pb-4 custom-scrollbar">
          <table className="w-full text-left border-separate border-spacing-y-3">
            <thead>
              <tr className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500/80 mb-4 px-4 bg-transparent border-b-0">
                <th className="pb-4 px-6 opacity-80">Paciente</th>
                <th className="pb-4 px-4 opacity-80">Hospital</th>
                <th className="pb-4 px-4 opacity-80">Diagnóstico</th>
                <th className="pb-4 px-4 opacity-80">Prioridad</th>
                <th className="pb-4 px-6 text-right opacity-80">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={5} className="py-12 text-center">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ repeat: Infinity, duration: 2 }}
                      className="inline-block"
                    >
                      <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full" />
                    </motion.div>
                    <p className="text-slate-400 mt-4 text-sm">
                      Cargando pacientes...
                    </p>
                  </td>
                </tr>
              )}

              {error && (
                <tr>
                  <td colSpan={5} className="py-8">
                    <div className="flex items-center gap-3 p-6 bg-red-900/20 border border-red-500/30 rounded-2xl">
                      <AlertCircle
                        className="text-red-400 flex-shrink-0"
                        size={20}
                      />
                      <p className="text-red-400 text-sm">{error}</p>
                    </div>
                  </td>
                </tr>
              )}

              {!loading && !error && filteredPatients.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-12 text-center">
                    <p className="text-slate-400 text-sm">
                      {searchQuery
                        ? "No se encontraron pacientes"
                        : "No hay pacientes disponibles"}
                    </p>
                  </td>
                </tr>
              )}

              {!loading &&
                !error &&
                filteredPatients.map((patient, idx) => (
                  <motion.tr
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    key={patient._id}
                    onClick={() => setSelectedPatient(patient)}
                    className="group/row hover:bg-white/[0.02] transition-colors cursor-pointer rounded-2xl relative"
                  >
                    <td className="py-4 px-6 bg-slate-900/40 rounded-l-2xl border-y border-l border-slate-800/50 group-hover/row:border-slate-700/50">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-sm font-extrabold text-blue-400 group-hover/row:bg-blue-600 group-hover/row:text-white transition-all shadow-inner ring-1 ring-slate-800/80">
                          {patient.name.charAt(0)}
                        </div>
                        <div>
                          <p className="text-sm font-extrabold text-slate-200 tracking-wide group-hover/row:text-white transition-colors">
                            {patient.name}
                          </p>
                          <p className="text-[10px] font-bold tracking-widest uppercase text-slate-500 mt-0.5">
                            {patient.age} años • {patient.gender}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4 bg-slate-900/40 border-y border-slate-800/50 text-sm font-medium text-slate-400 group-hover/row:border-slate-700/50 group-hover/row:text-slate-300 transition-colors">
                      {patient.hospitalId}
                    </td>
                    <td className="py-4 px-4 bg-slate-900/40 border-y border-slate-800/50 group-hover/row:border-slate-700/50">
                      <span className="text-xs px-3 py-1.5 bg-slate-950/50 border border-slate-800 rounded-lg text-slate-300 font-bold uppercase tracking-wider group-hover/row:border-slate-700 transition-colors shadow-inner max-w-[200px] block truncate">
                        {patient.diagnosis}
                      </span>
                    </td>
                    <td className="py-4 px-4 bg-slate-900/40 border-y border-slate-800/50 group-hover/row:border-slate-700/50">
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          {getPatientPriority(patient.triage.level) ===
                            "Alta" && (
                            <div className="absolute inset-0 rounded-full bg-red-500 blur-sm animate-pulse opacity-50" />
                          )}
                          <div
                            className={`w-2.5 h-2.5 rounded-full relative z-10 ${
                              getPatientPriority(patient.triage.level) ===
                              "Alta"
                                ? "bg-red-500 ring-2 ring-red-500/20"
                                : getPatientPriority(patient.triage.level) ===
                                    "Media"
                                  ? "bg-amber-500 ring-2 ring-amber-500/20"
                                  : "bg-emerald-500 ring-2 ring-emerald-500/20"
                            }`}
                          />
                        </div>
                        <span
                          className={`text-[10px] font-black uppercase tracking-widest ${
                            getPatientPriority(patient.triage.level) === "Alta"
                              ? "text-red-400"
                              : getPatientPriority(patient.triage.level) ===
                                  "Media"
                                ? "text-amber-400"
                                : "text-emerald-400"
                          }`}
                        >
                          {getPatientPriority(patient.triage.level)}
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-6 bg-slate-900/40 rounded-r-2xl border-y border-r border-slate-800/50 text-right group-hover/row:border-slate-700/50">
                      <motion.button
                        whileHover={{ x: 5 }}
                        className="p-2 text-slate-500 hover:text-white bg-slate-950/50 hover:bg-slate-800 rounded-lg transition-colors ring-1 ring-slate-800"
                      >
                        <ChevronRight size={18} />
                      </motion.button>
                    </td>
                  </motion.tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Post-Hospital Voice Assistant */}
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="lg:col-span-1 space-y-6"
      >
        <div className="bg-gradient-to-b from-[#0f172a] to-blue-950/30 border border-blue-500/20 rounded-[2rem] p-8 backdrop-blur-3xl relative overflow-hidden shadow-2xl group hover:border-blue-400/40 transition-colors">
          <div className="absolute -top-10 -right-10 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <Zap size={150} className="text-blue-500 fill-blue-500 rotate-12" />
          </div>

          <div className="relative z-10">
            <div className="flex items-center gap-3 text-blue-400 mb-8">
              <div className="p-2 bg-blue-500/10 rounded-lg ring-1 ring-blue-500/30">
                <Volume2 size={16} />
              </div>
              <span className="text-[10px] font-black uppercase tracking-[0.2em]">
                Asistente Vocal IA
              </span>
            </div>

            <div className="flex flex-col items-center text-center">
              <div className="relative mb-8 cursor-pointer" onClick={playVoice}>
                {isPlayingVoice && (
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1.5, opacity: 0 }}
                    transition={{ repeat: Infinity, duration: 1.5 }}
                    className="absolute inset-0 rounded-full border-4 border-blue-400"
                  />
                )}
                <div
                  className={`w-24 h-24 rounded-full bg-slate-950/80 border-4 border-slate-800/80 flex items-center justify-center relative z-10 transition-colors shadow-2xl ${isPlayingVoice ? "border-blue-500 ring-4 ring-blue-500/20 bg-slate-900" : "hover:border-slate-600"}`}
                >
                  <div
                    className={`w-14 h-14 rounded-full flex items-center justify-center transition-all duration-500 ${isPlayingVoice ? "bg-gradient-to-br from-blue-500 to-indigo-500 shadow-[0_0_30px_rgba(59,130,246,0.8)]" : "bg-blue-600 shadow-[0_0_20px_rgba(59,130,246,0.3)]"}`}
                  >
                    <MessageSquare className="text-white" size={24} />
                  </div>
                </div>
              </div>

              <h3 className="text-2xl text-white font-extrabold mb-3 tracking-tight">
                Síntesis Post-Alta
              </h3>
              <p className="text-xs text-slate-400 font-medium mb-10 leading-relaxed max-w-[200px] mx-auto">
                Genera instrucciones de recuperación personalizadas vía
                ElevenLabs.
              </p>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={playVoice}
                disabled={isPlayingVoice}
                className="w-full py-4 bg-white hover:bg-slate-50 text-slate-950 rounded-xl font-black text-[11px] uppercase tracking-[0.2em] transition-colors shadow-xl"
              >
                {isPlayingVoice
                  ? `Sintetizando ${selectedPatient?.name || "Paciente"}...`
                  : "Ejecutar Protocolo"}
              </motion.button>
            </div>
          </div>
        </div>

        <div className="bg-[#0f172a]/60 border border-slate-800/80 rounded-[2rem] p-6 backdrop-blur-md">
          <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]"></div>
            Status Interoperabilidad
          </h4>
          <div className="space-y-4">
            <div className="flex items-center justify-between bg-slate-900/50 px-4 py-3 rounded-xl border border-slate-800/50">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                HL7 FHIR Core
              </span>
              <span className="text-xs text-emerald-400 font-black tracking-wider">
                Activo
              </span>
            </div>
            <div className="flex items-center justify-between bg-slate-900/50 px-4 py-3 rounded-xl border border-slate-800/50">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                Cloud Sync Latencia
              </span>
              <span className="text-xs text-blue-400 font-black tracking-wider">
                1.2ms
              </span>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};
