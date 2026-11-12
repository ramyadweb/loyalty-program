import { api } from "./api.js";

export interface RewardRedemptionItem {
  id: number;
  userRewardId: number;
  redemptionCode: string;
  status: "generated" | "completed" | "expired";
  generatedAt: string;
  completedAt: string | null;
  expiresAt: string;
  createdAt?: string;
  updatedAt?: string;
  userId?: number;
  userName?: string;
  userEmail?: string;
  rewardId?: number;
  rewardName?: string;
}

export const redemptionService = {
  createRedemption: (userRewardId: number) =>
    api.post<{ success: boolean; message: string; data: RewardRedemptionItem }>(
      "/api/reward-redemption",
      { userRewardId }
    ),

  getMyRedemptions: () =>
    api.get<{ success: boolean; message: string; data: RewardRedemptionItem[] }>(
      "/api/reward-redemption/my-redemptions"
    ),

  getAllRedemptions: () =>
    api.get<{ success: boolean; message: string; data: RewardRedemptionItem[] }>(
      "/api/reward-redemption"
    ),

  getRedemptionById: (id: number) =>
    api.get<{ success: boolean; message: string; data: RewardRedemptionItem }>(
      `/api/reward-redemption/${id}`
    ),

  validateRedemption: (id: number) =>
    api.post<{
      valid: boolean;
      message: string;
      data: RewardRedemptionItem;
    }>(`/api/reward-redemption/${id}/validate`),

  completeRedemption: (id: number) =>
    api.patch<{ success: boolean; message: string; data: RewardRedemptionItem }>(
      `/api/reward-redemption/${id}/complete`
    ),
};

