import { z } from "zod";

// 1. Create / Redeem User Reward Validation
export const createUserRewardSchema = z.object({
    userId: z.coerce
        .number()
        .int("User ID must be an integer")
        .positive("User ID must be greater than zero")
        .optional(),

    rewardId: z.coerce
        .number()
        .int("Reward ID must be an integer")
        .positive("Reward ID must be greater than zero"),
});

// 2. Update User Reward Status Validation
export const updateUserRewardStatusSchema = z.object({
    status: z.enum(["approved", "rejected"], {
        message: "Status must be approved or rejected",
    }),
});

// 3. User Reward ID Validation
export const userRewardIdSchema = z.object({
    id: z.coerce
        .number()
        .int("User reward ID must be an integer")
        .positive("User reward ID must be greater than zero"),
});

// 4. TypeScript Types
export type CreateUserRewardInput = z.infer<
    typeof createUserRewardSchema
>;

export type UpdateUserRewardStatusInput = z.infer<
    typeof updateUserRewardStatusSchema
>;

export type UserRewardIdParam = z.infer<
    typeof userRewardIdSchema
>;
