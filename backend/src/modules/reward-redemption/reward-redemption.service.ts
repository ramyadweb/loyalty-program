
import { eq, desc } from "drizzle-orm";
import { randomBytes } from "crypto";

import { db } from "../../config/db.js";

import {
    users,
    userRewards,
    rewards,
    rewardRedemptions,
    notifications,
} from "../../db/schema.js";

// Generate a unique redemption code
const generateRedemptionCode = (): string => {
    return `REWARD-${randomBytes(16).toString("hex").toUpperCase()}`;
};


// 1. Generate Redemption Code
export const createRedemption = async (
    userId: number,
    userRewardId: number
) => {
    return await db.transaction(async (tx) => {
        // Verify user role
        const [user] = await tx
            .select()
            .from(users)
            .where(eq(users.id, userId))
            .limit(1);

        if (!user || user.role === "admin") {
            throw new Error("Administrators cannot redeem rewards.");
        }

        // Find and lock the user reward
        const [userReward] = await tx
            .select()
            .from(userRewards)
            .where(eq(userRewards.id, userRewardId))
            .for("update");

        if (!userReward) {
            throw new Error("User reward not found.");
        }

        // Check ownership
        if (userReward.userId !== userId) {
            throw new Error("You are not authorized to redeem this reward.");
        }

        // Only approved rewards can be redeemed
        if (userReward.status !== "approved") {
            throw new Error("Only approved rewards can be redeemed.");
        }

        // Check whether redemption already exists
        const [existingRedemption] = await tx
            .select()
            .from(rewardRedemptions)
            .where(
                eq(rewardRedemptions.userRewardId, userRewardId)
            );

        if (existingRedemption) {
            throw new Error("Redemption already exists for this reward.");
        }

        // Generate code
        const redemptionCode = generateRedemptionCode();

        // Set expiry date to 30 days
        const generatedAt = new Date();
        const expiresAt = new Date(generatedAt);
        expiresAt.setDate(expiresAt.getDate() + 30);

        // Insert redemption record
        const [redemption] = await tx
            .insert(rewardRedemptions)
            .values({
                userRewardId,
                redemptionCode,
                status: "generated",
                generatedAt,
                expiresAt,
                createdAt: generatedAt,
                updatedAt: generatedAt,
            })
            .returning();

        // Send automatic notification for voucher code generation
        await tx.insert(notifications).values({
            userId,
            title: "Voucher Generated",
            message: `Your redemption voucher code ${redemptionCode} has been generated. Redeem it within 30 days!`,
            type: "reward",
            isRead: false,
            metadata: { userRewardId, redemptionCode },
        });

        return redemption;
    });
};


// 2. Get All Redemptions (Admin)
export const getAllRedemptions = async () => {
    return await db
        .select({
            id: rewardRedemptions.id,
            userRewardId: rewardRedemptions.userRewardId,
            redemptionCode: rewardRedemptions.redemptionCode,
            status: rewardRedemptions.status,
            generatedAt: rewardRedemptions.generatedAt,
            completedAt: rewardRedemptions.completedAt,
            expiresAt: rewardRedemptions.expiresAt,

            userId: userRewards.userId,
            userName: users.name,
            userEmail: users.email,

            rewardId: userRewards.rewardId,
            rewardName: rewards.name,
        })
        .from(rewardRedemptions)
        .innerJoin(
            userRewards,
            eq(rewardRedemptions.userRewardId, userRewards.id)
        )
        .innerJoin(users, eq(userRewards.userId, users.id))
        .innerJoin(rewards, eq(userRewards.rewardId, rewards.id))
        .orderBy(desc(rewardRedemptions.createdAt));
};


// 3. Get My Redemptions
export const getMyRedemptions = async (
    userId: number
) => {
    return await db
        .select({
            id: rewardRedemptions.id,
            userRewardId: rewardRedemptions.userRewardId,
            redemptionCode: rewardRedemptions.redemptionCode,
            status: rewardRedemptions.status,
            generatedAt: rewardRedemptions.generatedAt,
            completedAt: rewardRedemptions.completedAt,
            expiresAt: rewardRedemptions.expiresAt,

            rewardId: userRewards.rewardId,
            rewardName: rewards.name,
        })
        .from(rewardRedemptions)
        .innerJoin(
            userRewards,
            eq(rewardRedemptions.userRewardId, userRewards.id)
        )
        .innerJoin(rewards, eq(userRewards.rewardId, rewards.id))
        .where(eq(userRewards.userId, userId))
        .orderBy(desc(rewardRedemptions.createdAt));
};


// 4. Get Redemption By ID
export const getRedemptionById = async (
    id: number
) => {
    const [redemption] = await db
        .select({
            id: rewardRedemptions.id,
            userRewardId: rewardRedemptions.userRewardId,
            redemptionCode: rewardRedemptions.redemptionCode,
            status: rewardRedemptions.status,
            generatedAt: rewardRedemptions.generatedAt,
            completedAt: rewardRedemptions.completedAt,
            expiresAt: rewardRedemptions.expiresAt,

            userId: userRewards.userId,
            userName: users.name,
            userEmail: users.email,

            rewardId: userRewards.rewardId,
            rewardName: rewards.name,
        })
        .from(rewardRedemptions)
        .innerJoin(
            userRewards,
            eq(rewardRedemptions.userRewardId, userRewards.id)
        )
        .innerJoin(users, eq(userRewards.userId, users.id))
        .innerJoin(rewards, eq(userRewards.rewardId, rewards.id))
        .where(eq(rewardRedemptions.id, id));

    return redemption ?? null;
};



// 5. Validate Redemption
export const validateRedemption = async (id: number) => {
    const [redemption] = await db
        .select()
        .from(rewardRedemptions)
        .where(eq(rewardRedemptions.id, id));

    if (!redemption) {
        throw new Error("Redemption not found.");
    }

    if (redemption.status !== "generated") {
        throw new Error(
            "Redemption is not available for validation."
        );
    }

    if (new Date() >= redemption.expiresAt) {
        await db
            .update(rewardRedemptions)
            .set({
                status: "expired",
                updatedAt: new Date(),
            })
            .where(eq(rewardRedemptions.id, id));

        throw new Error("Redemption code has expired.");
    }

    return {
        valid: true,
        message: "Redemption code is valid.",
        data: redemption,
    };
};


//Complete Redemption
export const completeRedemption = async (id: number) => {
    const result = await db.transaction(async (tx) => {

        // Find and lock redemption
        const [redemption] = await tx
            .select()
            .from(rewardRedemptions)
            .where(eq(rewardRedemptions.id, id))
            .for("update");

        if (!redemption) {
            throw new Error("Redemption not found.");
        }

        if (redemption.status === "completed") {
            throw new Error("Redemption is already completed.");
        }

        if (redemption.status === "expired") {
            throw new Error("Redemption has expired.");
        }

        const now = new Date();

        // Check expiration
        if (now >= redemption.expiresAt) {

            await tx
                .update(rewardRedemptions)
                .set({
                    status: "expired",
                    updatedAt: now,
                })
                .where(eq(rewardRedemptions.id, id));

            // Return instead of throwing inside transaction
            return {
                expired: true as const,
                redemption: null,
            };
        }

        // Complete redemption
        const [updatedRedemption] = await tx
            .update(rewardRedemptions)
            .set({
                status: "completed",
                completedAt: now,
                updatedAt: now,
            })
            .where(eq(rewardRedemptions.id, id))
            .returning();

        // Notify user about completed redemption
        const [claimInfo] = await tx
            .select({ userId: userRewards.userId })
            .from(userRewards)
            .where(eq(userRewards.id, redemption.userRewardId))
            .limit(1);

        if (claimInfo) {
            await tx.insert(notifications).values({
                userId: claimInfo.userId,
                title: "Reward Completed",
                message: `Congratulations! Your redemption voucher ${redemption.redemptionCode} has been verified and completed.`,
                type: "reward",
                isRead: false,
                metadata: { redemptionId: id, redemptionCode: redemption.redemptionCode },
            });
        }

        return {
            expired: false as const,
            redemption: updatedRedemption,
        };
    });

    // Throw error only after transaction commits
    if (result.expired) {
        throw new Error("Redemption code has expired.");
    }

    return result.redemption;
};
