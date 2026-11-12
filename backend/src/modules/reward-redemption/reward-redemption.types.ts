
export type RedemptionStatus =
    | "generated"
    | "completed"
    | "expired";

export interface RewardRedemption {
    id: number;
    userRewardId: number;
    redemptionCode: string;
    status: RedemptionStatus;
    generatedAt: Date;
    completedAt: Date | null;
    expiresAt: Date;
    createdAt: Date;
    updatedAt: Date;
}

export interface CreateRedemptionInput {
    userRewardId: number;
}

export interface RedemptionResponse {
    success: boolean;
    message: string;
    data?: RewardRedemption | RewardRedemption[];
}
