import { api } from "./api.js";

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
  confirmPassword?: string;
  phone?: string;
}

export interface OtpPayload {
  email: string;
  otp: string;
}

export interface ResetPasswordPayload {
  token?: string;
  resetToken?: string;
  email?: string;
  otp?: string;
  newPassword: string;
  confirmPassword?: string;
}

export const authService = {
  adminLogin: async (data: LoginPayload) => {
    const res = await api.post("/api/auth/admin/login", data);
    if (res.data?.data) {
      Object.assign(res.data, res.data.data);
    }
    return res;
  },

  userLogin: async (data: LoginPayload) => {
    const res = await api.post("/api/auth/user/login", data);
    if (res.data?.data) {
      Object.assign(res.data, res.data.data);
    }
    return res;
  },

  // General login supporting both user and admin portals
  login: async (data: LoginPayload) => {
    try {
      const res = await api.post("/api/auth/user/login", data);
      if (res.data?.data) {
        Object.assign(res.data, res.data.data);
      }
      return res;
    } catch (err: unknown) {
      const errorObj = err as {
        response?: { status?: number; data?: { message?: string } };
      };
      if (
        errorObj?.response?.data?.message?.includes("administrative login") ||
        errorObj?.response?.status === 403
      ) {
        const adminRes = await api.post("/api/auth/admin/login", data);
        if (adminRes.data?.data) {
          Object.assign(adminRes.data, adminRes.data.data);
        }
        return adminRes;
      }
      throw err;
    }
  },

  register: (data: RegisterPayload) =>
    api.post("/api/auth/register", {
      ...data,
      confirmPassword: data.confirmPassword || data.password,
    }),

  forgotPassword: (email: string) =>
    api.post("/api/auth/forgot-password", { email }),

  sendOtp: (email: string) =>
    api.post("/api/auth/forgot-password", { email }),

  verifyOtp: async (data: OtpPayload) => {
    const res = await api.post("/api/auth/verify-otp", data);
    if (res.data?.data) {
      Object.assign(res.data, res.data.data);
    }
    return res;
  },

  resetPassword: (data: ResetPasswordPayload) =>
    api.post("/api/auth/reset-password", data),

  getMe: () => api.get("/api/auth/me"),

  logout: () => api.post("/api/auth/logout"),
};
