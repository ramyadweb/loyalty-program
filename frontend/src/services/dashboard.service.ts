import { api } from "./api.js";

export interface AdminDashboardStats {
  totalUsers: number;
  approvedUsers: number;
  pendingUsers: number;
  rejectedUsers: number;
  activeUsers: number;
  totalTickets: number;
  openTickets: number;
  resolvedTickets: number;
}

export interface RecentActivityItem {
  id: number;
  activityType: string;
  ipAddress: string | null;
  createdAt: string;
  userId: number;
  userName: string;
  userEmail: string;
  userRole: string;
}

export const dashboardService = {
  getAdminStats: () =>
    api.get<{ success: boolean; data: AdminDashboardStats }>("/api/dashboard/admin/stats"),

  getRecentActivities: () =>
    api.get<{ success: boolean; data: RecentActivityItem[] }>("/api/dashboard/admin/recent-activities"),
};

