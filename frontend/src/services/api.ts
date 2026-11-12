import axios from "axios";

export const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  (import.meta.env.DEV ? "" : "http://localhost:5000");

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Attach Authorization Bearer token to requests
api.interceptors.request.use((config) => {
  try {
    const stored =
      localStorage.getItem("auth_user") || sessionStorage.getItem("auth_user");
    if (stored) {
      const user = JSON.parse(stored);
      if (user?.token) {
        config.headers.Authorization = `Bearer ${user.token}`;
      }
    }
  } catch {
    // Ignore JSON parsing errors
  }
  return config;
});

// Response interceptor to handle unauthenticated 401
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const currentPath = window.location.pathname;
      if (!currentPath.includes("/login") && !currentPath.includes("/register")) {
        localStorage.removeItem("auth_user");
        sessionStorage.removeItem("auth_user");
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

// Re-export common types and services for backward compatibility
export * from "./auth.service.js";
export * from "./admin.service.js";
export * from "./rewards.service.js";
export * from "./userRewards.service.js";
export * from "./redemption.service.js";
export * from "./tickets.service.js";
export * from "./audit.service.js";
export * from "./dashboard.service.js";
export * from "./notifications.service.js";
export * from "./reports.service.js";
export * from "./points.service.js";

// Backward-compatible aliasing
import { authService } from "./auth.service.js";
import { userRewardsService } from "./userRewards.service.js";
import { ticketsService } from "./tickets.service.js";

export const authApi = authService;
export const userApi = {
  redeemReward: userRewardsService.claimReward,
  getMyRewards: userRewardsService.getMyRewards,
  raiseTicket: ticketsService.createTicket,
  getMyTickets: ticketsService.getTickets,
};

export default api;
