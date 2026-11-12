import { api } from "./api.js";

export interface AdminUserItem {
  id: number;
  name: string;
  email: string;
  role: "admin" | "user";
  status: "pending" | "approved" | "rejected" | "blocked";
  isActive: boolean;
  pointsBalance: number | null;
  availablePoints?: number | null;
  totalEarned?: number | null;
  totalRedeemed?: number | null;
  createdAt: string;
  updatedAt: string;
  approvedAt?: string | null;
}

export interface GetUsersParams {
  page?: number;
  limit?: number;
  status?: string;
  search?: string;
}

export const adminService = {
  getPendingUsers: () =>
    api.get<{ success: boolean; data: AdminUserItem[] }>("/api/admin/users/pending"),

  getAllUsers: (params?: GetUsersParams) =>
    api.get<{
      success: boolean;
      data: AdminUserItem[];
      pagination?: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
      };
    }>("/api/admin/users", { params }),

  getUserById: (id: number) =>
    api.get<{ success: boolean; data: AdminUserItem }>(`/api/admin/users/${id}`),

  approveUser: (id: number) =>
    api.patch<{ success: boolean; message: string; data: AdminUserItem }>(
      `/api/admin/users/${id}/approve`
    ),

  rejectUser: (id: number) =>
    api.patch<{ success: boolean; message: string; data: AdminUserItem }>(
      `/api/admin/users/${id}/reject`
    ),

  getRecentUsers: (limit = 10) =>
    api.get<{ success: boolean; message?: string; data: AdminUserItem[] }>("/api/admin/users/recent", {
      params: { limit },
    }),
};

