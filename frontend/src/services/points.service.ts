import { api } from "./api.js";

export type PointsActivity =
  | "REGISTRATION"
  | "FEEDBACK"
  | "ADMIN_BONUS"
  | "REDEMPTION"
  | "REVERSAL"
  | "TICKET_CREATED"
  | "TICKET_OPENED"
  | "TICKET_RESOLVED";

export interface UserPointsBalance {
  userId: number;
  totalEarned: number;
  totalRedeemed: number;
  availablePoints: number;
}

export interface PointsTransactionItem {
  id: number;
  userId: number;
  points: number;
  activity: PointsActivity;
  description: string;
  referenceId?: number | null;
  createdBy?: number | null;
  createdAt: string;
}

export interface PointsPagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PointsBalanceResponse {
  success: boolean;
  message: string;
  data: UserPointsBalance;
}

export interface PointsHistoryResponse {
  success: boolean;
  message: string;
  data: PointsTransactionItem[];
  pagination?: PointsPagination;
}

export const pointsService = {
  getMyPointsBalance: () =>
    api.get<PointsBalanceResponse>("/api/points/my-balance"),

  getMyPointsHistory: (page: number = 1, limit: number = 10) =>
    api.get<PointsHistoryResponse>("/api/points/my-history", {
      params: { page, limit },
    }),
};

export const getMyPointsBalance = pointsService.getMyPointsBalance;
export const getMyPointsHistory = pointsService.getMyPointsHistory;

