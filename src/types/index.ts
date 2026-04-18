export interface VitalSigns {
  heartRate: number;
  bloodPressure: string;
  temperature: number;
}

export interface Triage {
  level: "bajo" | "medio" | "alto";
  score: number;
}

export interface Hospital {
  _id: string;
  name: string;
  city: string;
  state: string;
  capacity: number;
  icuBeds: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
  __v?: number;
}

export interface Patient {
  _id: string;
  name: string;
  age: number;
  gender: "M" | "F";
  diagnosis: string;
  hospitalId: string;
  vitalSigns: VitalSigns;
  triage: Triage;
  createdAt: string;
  updatedAt: string;
  __v?: number;
}

export interface ApiResponse<T> {
  data: T;
  status: number;
  message?: string;
}
