import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { X } from "lucide-react";
import { patientsService } from "../services/patients.service";
import type { Patient, Hospital } from "../../../types";

interface AddPatientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (patient: Patient) => void;
  editingPatient?: Patient | null;
  hospitals: Hospital[];
}

export const AddPatientModal = ({
  isOpen,
  onClose,
  onSuccess,
  editingPatient,
  hospitals,
}: AddPatientModalProps) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [initialFormData, setInitialFormData] = useState({
    name: "",
    age: 0,
    gender: "M" as "M" | "F",
    diagnosis: "",
    hospitalId: "",
    vitalSigns: {
      heartRate: 0,
      bloodPressure: "",
      temperature: 0,
    },
    triage: {
      level: "bajo" as "bajo" | "medio" | "alto",
      score: 0,
    },
  });
  const [formData, setFormData] = useState({
    name: "",
    age: 0,
    gender: "M" as "M" | "F",
    diagnosis: "",
    hospitalId: "",
    vitalSigns: {
      heartRate: 0,
      bloodPressure: "",
      temperature: 0,
    },
    triage: {
      level: "bajo" as "bajo" | "medio" | "alto",
      score: 0,
    },
  });

  // Cargar datos si estamos editando
  useEffect(() => {
    if (editingPatient) {
      const patientData = {
        name: editingPatient.name,
        age: editingPatient.age,
        gender: editingPatient.gender,
        diagnosis: editingPatient.diagnosis,
        hospitalId: editingPatient.hospitalId,
        vitalSigns: editingPatient.vitalSigns,
        triage: editingPatient.triage,
      };
      setFormData(patientData);
      setInitialFormData(patientData);
    } else {
      resetForm();
    }
  }, [editingPatient, isOpen]);

  const resetForm = () => {
    const emptyData = {
      name: "",
      age: 0,
      gender: "M" as "M" | "F",
      diagnosis: "",
      hospitalId: "",
      vitalSigns: {
        heartRate: 0,
        bloodPressure: "",
        temperature: 0,
      },
      triage: {
        level: "bajo" as "bajo" | "medio" | "alto",
        score: 0,
      },
    };
    setFormData(emptyData);
    setInitialFormData(emptyData);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      let result: Patient;

      if (editingPatient) {
        // Detectar qué cambió
        const vitalsChanged =
          JSON.stringify(formData.vitalSigns) !==
          JSON.stringify(initialFormData.vitalSigns);

        const dataChanged =
          formData.name !== initialFormData.name ||
          formData.age !== initialFormData.age ||
          formData.gender !== initialFormData.gender ||
          formData.diagnosis !== initialFormData.diagnosis ||
          formData.hospitalId !== initialFormData.hospitalId ||
          JSON.stringify(formData.triage) !==
            JSON.stringify(initialFormData.triage);

        // Actualizar datos generales si cambiaron
        if (dataChanged) {
          const dataToUpdate = {
            name: formData.name,
            age: formData.age,
            gender: formData.gender,
            diagnosis: formData.diagnosis,
            hospitalId: formData.hospitalId,
            triage: formData.triage,
          };
          result = await patientsService.updatePatientData(
            editingPatient._id,
            dataToUpdate,
          );
          // Mergear con formData para asegurar todos los campos
          result = { ...result, ...formData };
        } else {
          result = { ...editingPatient, ...formData };
        }

        // Actualizar signos vitales si cambiaron
        if (vitalsChanged) {
          const vitalResult = await patientsService.updatePatientVitals(
            editingPatient._id,
            formData.vitalSigns,
          );
          // Mergear vitals con el resultado anterior
          result = { ...result, vitalSigns: vitalResult.vitalSigns };
        }
      } else {
        // Crear nuevo paciente
        result = await patientsService.createPatient(formData);
      }

      onSuccess(result);
      resetForm();
      onClose();
    } catch (err) {
      console.error("Error saving patient:", err);
      setError(
        editingPatient
          ? "Error al actualizar el paciente"
          : "Error al crear el paciente",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) => {
    const { name, value } = e.target;
    const keys = name.split(".");

    if (keys.length === 1) {
      setFormData((prev) => ({
        ...prev,
        [name]: isNaN(Number(value)) ? value : Number(value),
      }));
    } else if (keys.length === 2) {
      setFormData((prev) => ({
        ...prev,
        [keys[0]]: {
          ...(prev[keys[0] as keyof typeof prev] as any),
          [keys[1]]: isNaN(Number(value)) ? value : Number(value),
        },
      }));
    }
  };

  const getHospitalName = (hospitalId: string): string => {
    return hospitals.find((h) => h._id === hospitalId)?.name || hospitalId;
  };

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl"
      >
        {/* Header */}
        <div className="sticky top-0 flex items-center justify-between p-6 border-b border-slate-700 bg-slate-900/95">
          <h2 className="text-2xl font-bold text-white">
            {editingPatient ? "Editar Paciente" : "Agregar Nuevo Paciente"}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-800 rounded-lg transition-colors text-slate-400 hover:text-white"
          >
            <X size={24} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="p-4 bg-red-900/20 border border-red-500/30 rounded-lg text-red-400 text-sm">
              {error}
            </div>
          )}

          {/* Row 1: Nombre y Edad */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-2">
                Nombre *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder:text-slate-500 focus:border-blue-500 focus:outline-none transition-colors"
                placeholder="Ej: Carlos Ramírez"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">
                  Edad *
                </label>
                <input
                  type="number"
                  name="age"
                  value={formData.age}
                  onChange={handleInputChange}
                  required
                  min="0"
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:border-blue-500 focus:outline-none transition-colors"
                  placeholder="52"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">
                  Género *
                </label>
                <select
                  name="gender"
                  value={formData.gender}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:border-blue-500 focus:outline-none transition-colors"
                >
                  <option value="M">Masculino</option>
                  <option value="F">Femenino</option>
                </select>
              </div>
            </div>
          </div>

          {/* Row 2: Diagnóstico y Hospital */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-2">
                Diagnóstico *
              </label>
              <input
                type="text"
                name="diagnosis"
                value={formData.diagnosis}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder:text-slate-500 focus:border-blue-500 focus:outline-none transition-colors"
                placeholder="Ej: Diabetes tipo 2"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-2">
                Hospital *
              </label>
              <select
                name="hospitalId"
                value={formData.hospitalId}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder:text-slate-500 focus:border-blue-500 focus:outline-none transition-colors"
              >
                <option value="">Seleccionar hospital...</option>
                {hospitals.map((hospital) => (
                  <option key={hospital._id} value={hospital._id}>
                    {hospital.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Row 3: Signos Vitales */}
          <div className="border-t border-slate-700 pt-4">
            <h3 className="text-lg font-semibold text-white mb-4">
              Signos Vitales
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">
                  Frecuencia Cardíaca (bpm) *
                </label>
                <input
                  type="number"
                  name="vitalSigns.heartRate"
                  value={formData.vitalSigns.heartRate}
                  onChange={handleInputChange}
                  required
                  min="0"
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:border-blue-500 focus:outline-none transition-colors"
                  placeholder="80"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">
                  Presión Arterial *
                </label>
                <input
                  type="text"
                  name="vitalSigns.bloodPressure"
                  value={formData.vitalSigns.bloodPressure}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder:text-slate-500 focus:border-blue-500 focus:outline-none transition-colors"
                  placeholder="120/80"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">
                  Temperatura (°C) *
                </label>
                <input
                  type="number"
                  name="vitalSigns.temperature"
                  value={formData.vitalSigns.temperature}
                  onChange={handleInputChange}
                  required
                  step="0.1"
                  min="0"
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:border-blue-500 focus:outline-none transition-colors"
                  placeholder="36.5"
                />
              </div>
            </div>
          </div>

          {/* Row 4: Triaje */}
          <div className="border-t border-slate-700 pt-4">
            <h3 className="text-lg font-semibold text-white mb-4">Triaje</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">
                  Nivel de Triaje *
                </label>
                <select
                  name="triage.level"
                  value={formData.triage.level}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:border-blue-500 focus:outline-none transition-colors"
                >
                  <option value="bajo">Bajo</option>
                  <option value="medio">Medio</option>
                  <option value="alto">Alto</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">
                  Puntuación de Triaje *
                </label>
                <input
                  type="number"
                  name="triage.score"
                  value={formData.triage.score}
                  onChange={handleInputChange}
                  required
                  min="0"
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:border-blue-500 focus:outline-none transition-colors"
                  placeholder="0"
                />
              </div>
            </div>
          </div>

          {/* Botones */}
          <div className="flex gap-4 pt-4 border-t border-slate-700">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg font-semibold transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading
                ? editingPatient
                  ? "Actualizando..."
                  : "Creando..."
                : editingPatient
                  ? "Actualizar Paciente"
                  : "Crear Paciente"}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
};
