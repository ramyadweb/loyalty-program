import { z } from "zod";

// Create reward validation
export const createRewardSchema = z.object({
    name: z.string().min(1, "Reward name is required"),

    description: z.string().optional(),

    pointsRequired: z.number()
        .int()
        .positive("Points must be greater than zero"),

    stock: z.number()
        .int()
        .min(0, "Stock cannot be negative"),

    image: z.string().optional(),

    status: z.enum(["active", "inactive"]).optional(),
});

// Update reward validation
export const updateRewardSchema = z.object({
    name: z.string().min(1).optional(),

    description: z.string().optional(),

    pointsRequired: z.number()
        .int()
        .positive()
        .optional(),

    stock: z.number()
        .int()
        .min(0)
        .optional(),

    image: z.string().optional(),

    status: z.enum(["active", "inactive"]).optional(),
}).refine(
    (data) => Object.keys(data).length > 0,
    {
        message: "At least one field is required to update reward",
    }
);

// Reward ID validation
export const rewardIdSchema = z.object({
    id: z.coerce.number().int().positive(),
});

export type CreateRewardInput = z.infer<typeof createRewardSchema>;
export type UpdateRewardInput = z.infer<typeof updateRewardSchema>;
export type RewardIdParam = z.infer<typeof rewardIdSchema>;


