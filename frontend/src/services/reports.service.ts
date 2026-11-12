import { api } from "./api.js";

export interface ReportDashboardSummary {
  totalUsers: number;
  totalRewards: number;
  totalRedemptions: number;
  totalRedemptionCodes: number;
  totalTickets: number;
  totalPointsRedeemed: number;
}

export const reportsService = {
  getDashboardSummary: () =>
    api.get<{ success: boolean; data: ReportDashboardSummary }>("/api/reports/dashboard"),

  getUserStats: () =>
    api.get<{
      success: boolean;
      data: {
        totalUsers: number;
        usersByStatus: { status: string; total: number }[];
        usersByRole: { role: string; total: number }[];
      };
    }>("/api/reports/users"),

  getRewardStats: () =>
    api.get<{
      success: boolean;
      data: {
        totalRewards: number;
        rewardsByStatus: { status: string; total: number }[];
        rewardPerformance: {
          rewardId: number;
          rewardName: string;
          pointsRequired: number;
          stock: number;
          totalRedemptions: number;
          totalPointsSpent: number;
        }[];
      };
    }>("/api/reports/rewards"),

  getRedemptionStats: () =>
    api.get<{
      success: boolean;
      data: {
        totalRedemptions: number;
        redemptionsByStatus: { status: string; total: number }[];
        redemptionCodes: { status: string; total: number }[];
      };
    }>("/api/reports/redemptions"),

  getTicketStats: () =>
    api.get<{
      success: boolean;
      data: {
        totalTickets: number;
        ticketsByStatus: { status: string; total: number }[];
        ticketsByPriority: { priority: string; total: number }[];
      };
    }>("/api/reports/tickets"),

  getAuditStats: () =>
    api.get<{
      success: boolean;
      data: {
        totalActivities: number;
        activitiesByType: { activityType: string; total: number }[];
        recentActivities: unknown[];
      };
    }>("/api/reports/audit"),
};

