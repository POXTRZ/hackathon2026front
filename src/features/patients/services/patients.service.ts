import { axiosInstance } from "../../../api/axios.instance";
import { API_ENDPOINTS } from "../../../api/api.constants";
import type { Patient, Hospital } from "../../../types";

export const patientsService = {
  /**
   * Obtiene la lista de todos los pacientes
   */
  getAllPatients: async (): Promise<Patient[]> => {
    try {
      const response = await axiosInstance.get<Patient[]>(
        API_ENDPOINTS.PATIENTS,
      );
      return response.data;
    } catch (error) {
      console.error("Error fetching patients:", error);
      throw error;
    }
  },

  /**
   * Obtiene un paciente por ID
   */
  getPatientById: async (id: string): Promise<Patient> => {
    try {
      const response = await axiosInstance.get<Patient>(
        `${API_ENDPOINTS.PATIENTS}/${id}`,
      );
      return response.data;
    } catch (error) {
      console.error(`Error fetching patient ${id}:`, error);
      throw error;
    }
  },

  /**
   * Crea un nuevo paciente
   */
  createPatient: async (
    patient: Omit<Patient, "_id" | "createdAt" | "updatedAt">,
  ): Promise<Patient> => {
    try {
      const response = await axiosInstance.post<Patient>(
        API_ENDPOINTS.PATIENTS,
        patient,
      );
      return response.data;
    } catch (error) {
      console.error("Error creating patient:", error);
      throw error;
    }
  },

  /**
   * Actualiza datos generales del paciente
   */
  updatePatientData: async (
    id: string,
    patient: Partial<Omit<Patient, "vitalSigns">>,
  ): Promise<Patient> => {
    try {
      const response = await axiosInstance.patch<Patient>(
        `${API_ENDPOINTS.PATIENTS}/${id}`,
        patient,
      );
      return response.data;
    } catch (error) {
      console.error(`Error updating patient ${id}:`, error);
      throw error;
    }
  },

  /**
   * Actualiza signos vitales del paciente
   */
  updatePatientVitals: async (
    id: string,
    vitalSigns: Patient["vitalSigns"],
  ): Promise<Patient> => {
    try {
      const response = await axiosInstance.patch<Patient>(
        `${API_ENDPOINTS.PATIENTS}/${id}/vitals`,
        { vitalSigns },
      );
      return response.data;
    } catch (error) {
      console.error(`Error updating patient vitals ${id}:`, error);
      throw error;
    }
  },

  /**
   * Actualiza un paciente existente (datos generales y vitales)
   */
  updatePatient: async (
    id: string,
    patient: Partial<Patient>,
  ): Promise<Patient> => {
    try {
      const response = await axiosInstance.patch<Patient>(
        `${API_ENDPOINTS.PATIENTS}/${id}`,
        patient,
      );
      return response.data;
    } catch (error) {
      console.error(`Error updating patient ${id}:`, error);
      throw error;
    }
  },

  /**
   * Elimina un paciente
   */
  deletePatient: async (id: string): Promise<void> => {
    try {
      await axiosInstance.delete(`${API_ENDPOINTS.PATIENTS}/${id}`);
    } catch (error) {
      console.error(`Error deleting patient ${id}:`, error);
      throw error;
    }
  },

  /**
   * Obtiene la lista de todos los hospitales
   */
  getAllHospitals: async (): Promise<Hospital[]> => {
    try {
      const response = await axiosInstance.get<Hospital[]>(
        `${API_ENDPOINTS.HOSPITALS}`,
      );
      return response.data;
    } catch (error) {
      console.error("Error fetching hospitals:", error);
      throw error;
    }
  },

  /**
   * Obtiene un hospital por ID
   */
  getHospitalById: async (id: string): Promise<Hospital> => {
    try {
      const response = await axiosInstance.get<Hospital>(`/hospitals/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching hospital ${id}:`, error);
      throw error;
    }
  },
};
