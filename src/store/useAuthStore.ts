import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface Doctor {
  _id: string;
  name: string;
  email: string;
  hospitalId: string;
  hospitalName?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface AuthState {
  doctor: Doctor | null;
  token: string | null;
  isAuthenticated: boolean;
  setDoctor: (doctor: Doctor) => void;
  setToken: (token: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      doctor: null,
      token: null,
      isAuthenticated: false,

      setDoctor: (doctor: Doctor) => {
        set({
          doctor,
          isAuthenticated: true,
        });
      },

      setToken: (token: string) => {
        set({
          token,
        });
      },

      logout: () => {
        set({
          doctor: null,
          token: null,
          isAuthenticated: false,
        });
      },
    }),
    {
      name: "auth-storage",
      partialize: (state) => ({
        doctor: state.doctor,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    },
  ),
);
