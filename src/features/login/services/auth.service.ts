import { axiosInstance } from "../../../api/axios.instance";

export interface DoctorData {
  id: string;
  name: string;
  email: string;
  hospitalId: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface SignUpPayload {
  name: string;
  email: string;
  password: string;
  hospitalId: string;
}

export interface AuthResponse {
  token: string;
  doctor: DoctorData;
}

export const authService = {
  async signup(data: SignUpPayload): Promise<AuthResponse> {
    const response = await axiosInstance.post<AuthResponse>(
      "/auth/signup",
      data,
    );
    return response.data;
  },

  async signin(email: string, password: string): Promise<AuthResponse> {
    const response = await axiosInstance.post<AuthResponse>("/auth/login", {
      email,
      password,
    });
    return response.data;
  },

  async getDoctorById(id: string): Promise<DoctorData> {
    const response = await axiosInstance.get<DoctorData>(`/doctors/${id}`);
    return response.data;
  },

  async getDoctorByEmail(email: string): Promise<DoctorData> {
    const response = await axiosInstance.get<DoctorData>(
      `/doctors/email/${email}`,
    );
    return response.data;
  },

  setAuthToken(token: string): void {
    localStorage.setItem("authToken", token);
    axiosInstance.defaults.headers.common.Authorization = `Bearer ${token}`;
  },

  getAuthToken(): string | null {
    return localStorage.getItem("authToken");
  },

  initializeAuthToken(): void {
    const token = localStorage.getItem("authToken");
    if (token) {
      axiosInstance.defaults.headers.common.Authorization = `Bearer ${token}`;
    }
  },

  logout(): void {
    localStorage.removeItem("authToken");
    delete axiosInstance.defaults.headers.common.Authorization;
  },
};
