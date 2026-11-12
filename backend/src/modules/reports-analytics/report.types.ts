
import type {
    ReportDateRangeInput,
    ReportPaginationInput,
    MonthlyReportInput,
} from "./report.validation.js";

// Report Date Range Type
export type ReportDateRange = ReportDateRangeInput;

// Report Pagination Type
export type ReportPagination = ReportPaginationInput;

// Monthly Report Type
export type MonthlyReportParams = MonthlyReportInput;

// Dashboard Summary Response
export interface DashboardSummary {
    totalUsers: number;
    approvedUsers: number;
    rejectedUsers: number;
    totalRewards: number;
    activeRewards: number;
    inactiveRewards: number;
    totalRedemptions: number;
    pendingRedemptions: number;
    completedRedemptions: number;
    expiredRedemptions: number;
}

// User Report Response
export interface UserReport {
    totalUsers: number;
    approvedUsers: number;
    rejectedUsers: number;
    pendingUsers: number;
}

// Reward Report Response
export interface RewardReport {
    totalRewards: number;
    activeRewards: number;
    inactiveRewards: number;
}

// Points Report Response
export interface PointsReport {
    totalPointsEarned: number;
    totalPointsRedeemed: number;
    availablePoints: number;
}

// Redemption Report Response
export interface RedemptionReport {
    totalRedemptions: number;
    pendingRedemptions: number;
    completedRedemptions: number;
    expiredRedemptions: number;
}

// Monthly Report Response
export interface MonthlyReport {
    year: number;
    month: number;
    totalUsers: number;
    totalRedemptions: number;
    totalPointsEarned: number;
    totalPointsRedeemed: number;
}

// Top User Response
export interface TopUserReport {
    userId: number;
    name: string;
    email: string;
    totalPoints: number;
}

// Top Reward Response
export interface TopRewardReport {
    rewardId: number;
    title: string;
    totalRedemptions: number;
}
