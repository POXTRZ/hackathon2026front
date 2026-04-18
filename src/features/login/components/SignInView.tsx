import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { LogIn, Mail, Lock, AlertCircle, User, Building2 } from "lucide-react";
import { authService } from "../services/auth.service";
import { useAuthStore } from "../../../store/useAuthStore";
import { patientsService } from "../../patients/services/patients.service";
import type { Hospital } from "../../../types";

export const SignInView = () => {
  const [isLogin, setIsLogin] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [hospitalId, setHospitalId] = useState("");
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [loadingHospitals, setLoadingHospitals] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Get auth store methods
  const { setDoctor, setToken } = useAuthStore();

  // Load hospitals on component mount
  useEffect(() => {
    const loadHospitals = async () => {
      try {
        setLoadingHospitals(true);
        const data = await patientsService.getAllHospitals();
        setHospitals(data);
      } catch (err) {
        console.error("Error loading hospitals:", err);
      } finally {
        setLoadingHospitals(false);
      }
    };

    loadHospitals();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    setLoading(true);

    try {
      // Validations
      if (!email || !password) {
        setError("Por favor completa todos los campos");
        setLoading(false);
        return;
      }

      if (!email.includes("@")) {
        setError("Por favor ingresa un email válido");
        setLoading(false);
        return;
      }

      if (password.length < 6) {
        setError("La contraseña debe tener al menos 6 caracteres");
        setLoading(false);
        return;
      }

      let response;

      if (isLogin) {
        // LOGIN
        response = await authService.signin(email, password);
      } else {
        // SIGNUP
        if (!name || !hospitalId) {
          setError("Por favor completa todos los campos");
          setLoading(false);
          return;
        }

        response = await authService.signup({
          name,
          email,
          password,
          hospitalId,
        });
      }

      // Save token if provided
      if (response.token) {
        authService.setAuthToken(response.token);
        setToken(response.token);
      }

      console.log("Full response from backend:", response);
      console.log("response.doctor:", response.doctor);
      console.log("response.doctor?.name:", response.doctor?.name);
      console.log("response.doctor?.hospitalId:", response.doctor?.hospitalId);
      console.log("response.hospitalId:", response.hospitalId);
      console.log("response.name:", response.name);
      console.log("response.email from form:", email);

      // Extract doctor data - handle both response formats
      // Format 1: { token, doctor: { id, name, email, hospitalId } }
      // Format 2: { token, id, name, email, hospitalId }
      let doctorData = response.doctor || {
        id: response.id,
        name: response.name,
        email: response.email,
        hospitalId: response.hospitalId,
        createdAt: response.createdAt,
        updatedAt: response.updatedAt,
      };

      console.log("====== DOCTOR DATA EXTRACTED:", doctorData);
      console.log("====== doctor.name:", doctorData.name);
      console.log("====== doctor.id:", doctorData.id);

      // Ensure we have required doctor data
      if (!doctorData.id && !doctorData._id) {
        throw new Error(
          "No se pudo obtener los datos del doctor de la respuesta",
        );
      }

      console.log("Doctor Data extracted:", doctorData);
      console.log("Doctor hospitalId after extraction:", doctorData.hospitalId);
      console.log("HospitalId from form state:", hospitalId);

      // Get hospital ID - prefer from response, fallback to form selection
      let finalHospitalId = doctorData.hospitalId || hospitalId;
      console.log("Final hospitalId to use:", finalHospitalId);

      // Get hospital name from hospitalId
      let hospitalName = "Hospital";

      if (finalHospitalId) {
        try {
          const hospital =
            await patientsService.getHospitalById(finalHospitalId);
          console.log("Hospital fetched:", hospital);
          hospitalName = hospital.name || "Hospital";
        } catch (err) {
          console.error("Error fetching hospital data:", err);
          hospitalName = "Hospital";
        }
      } else {
        console.warn(
          "No hospitalId found. Doctor data:",
          JSON.stringify(doctorData, null, 2),
        );
      }

      // Save doctor data to auth store
      // For signup, use the name from the form since backend might not return it
      // For login, use the name from backend or fallback to email
      const doctorName = isLogin
        ? doctorData.name || email.split("@")[0]
        : name;

      const finalDoctorData = {
        _id: doctorData.id || doctorData._id,
        name: doctorName,
        email: doctorData.email || email,
        hospitalId: finalHospitalId,
        hospitalName: hospitalName,
        createdAt: doctorData.createdAt,
        updatedAt: doctorData.updatedAt,
      };

      console.log("====== FINAL DOCTOR DATA TO SAVE:", finalDoctorData);
      console.log("====== name value:", finalDoctorData.name);
      console.log("====== isLogin:", isLogin);
      console.log("====== hospitalName value:", finalDoctorData.hospitalName);
      setDoctor(finalDoctorData);

      // Verify it was saved
      const savedState = useAuthStore.getState();
      console.log(
        "Doctor data in store immediately after save:",
        savedState.doctor,
      );

      setSuccess(true);
      console.log(
        isLogin ? "Login successful:" : "Signup successful:",
        response,
      );

      // Reset form fields (not the store)
      setName("");
      setEmail("");
      setPassword("");
      setHospitalId("");
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message ||
        err.message ||
        `Error al ${isLogin ? "iniciar sesión" : "registrarse"}. Intenta nuevamente.`;
      setError(errorMessage);
      console.error(isLogin ? "Login error:" : "Signup error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4 relative overflow-hidden"
    >
      {/* Animated background gradients */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl opacity-50" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl opacity-50" />
      <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-purple-600/5 rounded-full blur-3xl opacity-30" />

      {/* Main Container */}
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.5 }}
        className="relative z-10 w-full max-w-md"
      >
        {/* Card */}
        <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-8 shadow-2xl">
          {/* Header */}
          <div className="text-center mb-8">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
              className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg"
            >
              <LogIn className="text-white" size={32} />
            </motion.div>

            <h1 className="text-3xl font-bold text-white mb-2">
              {isLogin ? "Iniciar Sesión" : "Registrarse como Doctor"}
            </h1>
            <p className="text-slate-400 text-sm">
              {isLogin
                ? "Accede a tu cuenta del sistema"
                : "Crea tu cuenta en el sistema regional intra-hospitalario"}
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Name Field - Only on Signup */}
            {!isLogin && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
                className="relative"
              >
                <label className="block text-sm font-semibold text-slate-200 mb-3">
                  Nombre Completo *
                </label>
                <div className="relative">
                  <User
                    className="absolute left-4 top-3.5 text-slate-400"
                    size={20}
                  />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Dr. Juan Pérez"
                    className="w-full pl-12 pr-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-white placeholder:text-slate-500 focus:border-blue-500 focus:outline-none transition-all duration-200 font-medium"
                  />
                </div>
              </motion.div>
            )}

            {/* Email Field */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.45 }}
              className="relative"
            >
              <label className="block text-sm font-semibold text-slate-200 mb-3">
                Correo Electrónico *
              </label>
              <div className="relative">
                <Mail
                  className="absolute left-4 top-3.5 text-slate-400"
                  size={20}
                />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="juan@hospital.com"
                  className="w-full pl-12 pr-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-white placeholder:text-slate-500 focus:border-blue-500 focus:outline-none transition-all duration-200 font-medium"
                />
              </div>
            </motion.div>

            {/* Hospital ID Field - Only on Signup */}
            {!isLogin && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 }}
                className="relative"
              >
                <label className="block text-sm font-semibold text-slate-200 mb-3">
                  Hospital *
                </label>
                <div className="relative">
                  <Building2
                    className="absolute left-4 top-3.5 text-slate-400 pointer-events-none"
                    size={20}
                  />
                  {loadingHospitals ? (
                    <div className="w-full pl-12 pr-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-slate-400 flex items-center">
                      <div className="w-4 h-4 border-2 border-slate-600 border-t-blue-500 rounded-full animate-spin" />
                      <span className="ml-2 text-sm">
                        Cargando hospitales...
                      </span>
                    </div>
                  ) : (
                    <select
                      value={hospitalId}
                      onChange={(e) => setHospitalId(e.target.value)}
                      className="w-full pl-12 pr-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-white placeholder:text-slate-500 focus:border-blue-500 focus:outline-none transition-all duration-200 font-medium appearance-none cursor-pointer"
                    >
                      <option value="">Seleccionar hospital...</option>
                      {hospitals.map((hospital) => (
                        <option key={hospital._id} value={hospital._id}>
                          {hospital.name}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              </motion.div>
            )}

            {/* Password Field */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.55 }}
              className="relative"
            >
              <label className="block text-sm font-semibold text-slate-200 mb-3">
                Contraseña *
              </label>
              <div className="relative">
                <Lock
                  className="absolute left-4 top-3.5 text-slate-400"
                  size={20}
                />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-12 pr-12 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-white placeholder:text-slate-500 focus:border-blue-500 focus:outline-none transition-all duration-200 font-medium"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-3.5 text-slate-400 hover:text-slate-300 transition-colors"
                >
                  {showPassword ? (
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-4.803m5.596-3.856a9.971 9.971 0 013.704 2.573m-4.175 4.242a3 3 0 105.496 1.584M9 9h.008v.008H9V9m4 0h.008v.008H13V9"
                      />
                    </svg>
                  ) : (
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                      />
                    </svg>
                  )}
                </button>
              </div>
            </motion.div>

            {/* Success Message */}
            {success && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-3 p-4 bg-emerald-900/20 border border-emerald-500/30 rounded-lg"
              >
                <svg
                  className="w-5 h-5 text-emerald-400"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                <p className="text-emerald-400 text-sm font-medium">
                  ¡Registro exitoso! Redirigiendo...
                </p>
              </motion.div>
            )}

            {/* Error Message */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-3 p-4 bg-red-900/20 border border-red-500/30 rounded-lg"
              >
                <AlertCircle className="text-red-400 flex-shrink-0" size={18} />
                <p className="text-red-400 text-sm font-medium">{error}</p>
              </motion.div>
            )}

            {/* Submit Button */}
            <motion.button
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={loading || success}
              className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-bold rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg hover:shadow-blue-500/50"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  {isLogin ? "Iniciando sesión..." : "Registrando..."}
                </>
              ) : success ? (
                <>
                  <svg
                    className="w-5 h-5"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  {isLogin ? "Sesión iniciada" : "Registrado"}
                </>
              ) : (
                <>
                  <LogIn size={20} />
                  {isLogin ? "Iniciar Sesión" : "Registrarse"}
                </>
              )}
            </motion.button>

            {/* Toggle Login/Signup */}
            <div className="text-center pt-2">
              <p className="text-sm text-slate-400">
                {isLogin ? "¿No tienes cuenta?" : "¿Ya tienes cuenta?"}{" "}
                <button
                  type="button"
                  onClick={() => {
                    setIsLogin(!isLogin);
                    setError(null);
                    setSuccess(false);
                    setName("");
                    setEmail("");
                    setPassword("");
                    setHospitalId("");
                  }}
                  className="text-blue-400 hover:text-blue-300 font-semibold transition-colors"
                >
                  {isLogin ? "Regístrate aquí" : "Inicia sesión aquí"}
                </button>
              </p>
            </div>
          </form>

          {/* Footer Info */}
        </div>

        {/* Bottom Text */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="text-center text-slate-500 text-xs mt-6"
        >
          Sistema de Gestión Regional Intra-Hospitalaria
        </motion.p>
      </motion.div>
    </motion.div>
  );
};
