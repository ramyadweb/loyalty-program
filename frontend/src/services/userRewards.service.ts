import { api } from "./api.js";

export interface UserRewardItem {
  id: number;
  userId: number;
  rewardId: number;
  pointsSpent: number;
  status: "pending" | "approved" | "rejected";
  redeemedAt: string;
  updatedAt?: string;
  userName?: string;
  userEmail?: string;
  rewardName: string;
  rewardPoints?: number;
  redemptionId?: number | null;
  redemptionCode?: string | null;
  redemptionStatus?: "generated" | "completed" | "expired" | null;
  completedAt?: string | null;
  expiresAt?: string | null;
}

export const userRewardsService = {
  claimReward: (rewardId: number) =>
    api.post<{ success: boolean; message: string; data: UserRewardItem }>(
      "/api/user-rewards",
      { rewardId }
    ),

  getMyRewards: () =>
    api.get<{ success: boolean; message: string; data: UserRewardItem[] }>(
      "/api/user-rewards/my-rewards"
    ),

  getAllUserRewards: () =>
    api.get<{ success: boolean; message: string; data: UserRewardItem[] }>(
      "/api/user-rewards"
    ),

  getUserRewardById: (id: number) =>
    api.get<{ success: boolean; message: string; data: UserRewardItem }>(
      `/api/user-rewards/${id}`
    ),

  updateUserRewardStatus: (id: number, status: "approved" | "rejected") =>
    api.patch<{ success: boolean; message: string; data: UserRewardItem }>(
      `/api/user-rewards/${id}/status`,
      { status }
    ),

  deleteUserReward: (id: number) =>
    api.delete<{ success: boolean; message: string; data: UserRewardItem }>(
      `/api/user-rewards/${id}`
    ),
};

