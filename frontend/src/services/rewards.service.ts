import { api } from "./api.js";

export interface RewardItem {
  id: number;
  name: string;
  description: string | null;
  pointsRequired: number;
  stock: number;
  image: string | null;
  status: "active" | "inactive";
  createdAt: string;
  updatedAt: string;
}

export interface CreateRewardPayload {
  name: string;
  description?: string;
  pointsRequired: number;
  stock?: number;
  image?: string;
  status?: "active" | "inactive";
}

export const rewardsService = {
  getRewards: (status?: "active" | "inactive") =>
    api.get<{ success: boolean; data: RewardItem[] }>("/api/rewards", {
      params: status ? { status } : undefined,
    }),

  getRewardById: (id: number) =>
    api.get<{ success: boolean; data: RewardItem }>(`/api/rewards/${id}`),

  createReward: (data: CreateRewardPayload) =>
    api.post<{ success: boolean; message: string; data: RewardItem }>("/api/rewards", data),

  updateReward: (id: number, data: Partial<CreateRewardPayload>) =>
    api.patch<{ success: boolean; message: string; data: RewardItem }>(`/api/rewards/${id}`, data),

  deleteReward: (id: number) =>
    api.delete<{ success: boolean; message: string }>(`/api/rewards/${id}`),
};

