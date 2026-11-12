
import { z } from "zod";

// 1. Create Redemption Validation
export const createRedemptionSchema = z.object({
    userRewardId: z.coerce
        .number()
        .int("User reward ID must be an integer")
        .positive("User reward ID must be greater than zero"),
});

// 2. Redemption ID Validation
export const redemptionIdSchema = z.object({
    id: z.coerce
        .number()
        .int("Redemption ID must be an integer")
        .positive("Redemption ID must be greater than zero"),
});

// 3. TypeScript Types
export type CreateRedemptionInput = z.infer<
    typeof createRedemptionSchema
>;

export type RedemptionIdInput = z.infer<
    typeof redemptionIdSchema
>;
