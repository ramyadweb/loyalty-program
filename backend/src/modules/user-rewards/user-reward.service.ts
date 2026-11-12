
import { eq, desc, sql } from "drizzle-orm";
import { randomBytes } from "crypto";

import { db } from "../../config/db.js";

import {
    users,
    rewards,
    userRewards,
    notifications,
    pointsTransactions,
    rewardRedemptions,
} from "../../db/schema.js";

// 1. Redeem a reward for a user
export const createUserReward = async (
    userId: number,
    rewardId: number
) => {
    return await db.transaction(async (tx) => {

        // Check user and lock the row
        const [user] = await tx
            .select()
            .from(users)
            .where(eq(users.id, userId))
            .for("update");

        if (!user) {
            throw new Error("User not found.");
        }

        if (user.role === "admin") {
            throw new Error("Administrators cannot claim or redeem rewards.");
        }

        if (user.status !== "approved") {
            throw new Error("User is not approved.");
        }

        // Check reward and lock the row
        const [reward] = await tx
            .select()
            .from(rewards)
            .where(eq(rewards.id, rewardId))
            .for("update");

        if (!reward) {
            throw new Error("Reward not found.");
        }

        if (reward.status !== "active") {
            throw new Error("This reward is not active.");
        }

        if (reward.stock <= 0) {
            throw new Error("Reward is out of stock.");
        }

        // Check user points
        if (user.pointsBalance < reward.pointsRequired) {
            throw new Error("Insufficient points balance.");
        }

        // Deduct user points
        await tx
            .update(users)
            .set({
                pointsBalance: sql`${users.pointsBalance} - ${reward.pointsRequired}`,
            })
            .where(eq(users.id, userId));

        // Reduce reward stock
        await tx
            .update(rewards)
            .set({
                stock: sql`${rewards.stock} - 1`,
            })
            .where(eq(rewards.id, rewardId));

        // Create user reward record
        const [newUserReward] = await tx
            .insert(userRewards)
            .values({
                userId,
                rewardId,
                pointsSpent: reward.pointsRequired,
                status: "pending",
            })
            .returning();

        if (newUserReward) {
            // Record points redemption transaction
            await tx.insert(pointsTransactions).values({
                userId,
                points: reward.pointsRequired,
                activity: "REDEMPTION",
                description: `Redeemed reward: ${reward.name}`,
                referenceId: newUserReward.id,
            });

            // Send automatic Reward Claimed notification
            await tx.insert(notifications).values({
                userId,
                title: "Reward Claimed",
                message: `You have successfully claimed ${reward.name} for ${reward.pointsRequired} points. Awaiting approval.`,
                type: "reward",
                isRead: false,
                metadata: { userRewardId: newUserReward.id, rewardId },
            });
        }

        return newUserReward;
    });
};


// 2. Get all user rewards
export const getAllUserRewards = async () => {
    return await db
        .select({
            id: userRewards.id,
            userId: userRewards.userId,
            rewardId: userRewards.rewardId,
            pointsSpent: userRewards.pointsSpent,
            status: userRewards.status,
            redeemedAt: userRewards.redeemedAt,
            updatedAt: userRewards.updatedAt,

            userName: users.name,
            userEmail: users.email,

            rewardName: rewards.name,
            rewardPoints: rewards.pointsRequired,

            redemptionId: rewardRedemptions.id,
            redemptionCode: rewardRedemptions.redemptionCode,
            redemptionStatus: rewardRedemptions.status,
            completedAt: rewardRedemptions.completedAt,
            expiresAt: rewardRedemptions.expiresAt,
        })
        .from(userRewards)
        .innerJoin(users, eq(userRewards.userId, users.id))
        .innerJoin(rewards, eq(userRewards.rewardId, rewards.id))
        .leftJoin(
            rewardRedemptions,
            eq(userRewards.id, rewardRedemptions.userRewardId)
        )
        .orderBy(desc(userRewards.redeemedAt));
};


// 3. Get rewards belonging to a particular user
export const getUserRewardsByUserId = async (
    userId: number
) => {
    return await db
        .select({
            id: userRewards.id,
            userId: userRewards.userId,
            rewardId: userRewards.rewardId,
            pointsSpent: userRewards.pointsSpent,
            status: userRewards.status,
            redeemedAt: userRewards.redeemedAt,

            rewardName: rewards.name,
            rewardPoints: rewards.pointsRequired,

            redemptionId: rewardRedemptions.id,
            redemptionCode: rewardRedemptions.redemptionCode,
            redemptionStatus: rewardRedemptions.status,
            completedAt: rewardRedemptions.completedAt,
            expiresAt: rewardRedemptions.expiresAt,
        })
        .from(userRewards)
        .innerJoin(rewards, eq(userRewards.rewardId, rewards.id))
        .leftJoin(
            rewardRedemptions,
            eq(userRewards.id, rewardRedemptions.userRewardId)
        )
        .where(eq(userRewards.userId, userId))
        .orderBy(desc(userRewards.redeemedAt));
};


// 4. Get user reward by ID
export const getUserRewardById = async (
    id: number
) => {
    const [userReward] = await db
        .select({
            id: userRewards.id,
            userId: userRewards.userId,
            rewardId: userRewards.rewardId,
            pointsSpent: userRewards.pointsSpent,
            status: userRewards.status,
            redeemedAt: userRewards.redeemedAt,
            updatedAt: userRewards.updatedAt,

            userName: users.name,
            userEmail: users.email,

            rewardName: rewards.name,
            rewardPoints: rewards.pointsRequired,

            redemptionId: rewardRedemptions.id,
            redemptionCode: rewardRedemptions.redemptionCode,
            redemptionStatus: rewardRedemptions.status,
            completedAt: rewardRedemptions.completedAt,
            expiresAt: rewardRedemptions.expiresAt,
        })
        .from(userRewards)
        .innerJoin(users, eq(userRewards.userId, users.id))
        .innerJoin(rewards, eq(userRewards.rewardId, rewards.id))
        .leftJoin(
            rewardRedemptions,
            eq(userRewards.id, rewardRedemptions.userRewardId)
        )
        .where(eq(userRewards.id, id));

    return userReward ?? null;
};


// 5. Approve or reject a user reward
export const updateUserRewardStatus = async (
    id: number,
    status: "approved" | "rejected"
) => {
    return await db.transaction(async (tx) => {

        // Find and lock the user reward
        const [userReward] = await tx
            .select()
            .from(userRewards)
            .where(eq(userRewards.id, id))
            .for("update");

        if (!userReward) {
            throw new Error("User reward not found.");
        }

        if (userReward.status !== "pending") {
            throw new Error(
                "This redemption has already been processed."
            );
        }

        // If rejected, refund points and restore stock
        if (status === "rejected") {

            await tx
                .update(users)
                .set({
                    pointsBalance: sql`${users.pointsBalance} + ${userReward.pointsSpent}`,
                })
                .where(eq(users.id, userReward.userId));

            await tx
                .update(rewards)
                .set({
                    stock: sql`${rewards.stock} + 1`,
                })
                .where(eq(rewards.id, userReward.rewardId));

            // Record points reversal transaction
            await tx.insert(pointsTransactions).values({
                userId: userReward.userId,
                points: userReward.pointsSpent,
                activity: "REVERSAL",
                description: `Points refund for rejected claim #${userReward.id}`,
                referenceId: userReward.id,
            });
        }

        // Update redemption status
        const [updatedUserReward] = await tx
            .update(userRewards)
            .set({
                status,
                updatedAt: new Date(),
            })
            .where(eq(userRewards.id, id))
            .returning();

        // Send automatic status update notification and create redemption voucher
        if (status === "approved") {
            const [existingRedemption] = await tx
                .select()
                .from(rewardRedemptions)
                .where(eq(rewardRedemptions.userRewardId, id));

            let voucherCode = existingRedemption?.redemptionCode;

            if (!existingRedemption) {
                voucherCode = `REWARD-${randomBytes(16).toString("hex").toUpperCase()}`;
                const generatedAt = new Date();
                const expiresAt = new Date(generatedAt);
                expiresAt.setDate(expiresAt.getDate() + 30);

                await tx.insert(rewardRedemptions).values({
                    userRewardId: id,
                    redemptionCode: voucherCode,
                    status: "generated",
                    generatedAt,
                    expiresAt,
                    createdAt: generatedAt,
                    updatedAt: generatedAt,
                });
            }

            await tx.insert(notifications).values({
                userId: userReward.userId,
                title: "Reward Approved",
                message: `Congratulations! Your reward claim #${userReward.id} has been approved. Voucher code: ${voucherCode}.`,
                type: "reward",
                isRead: false,
                metadata: { userRewardId: userReward.id, rewardId: userReward.rewardId, voucherCode },
            });
        } else if (status === "rejected") {
            await tx.insert(notifications).values({
                userId: userReward.userId,
                title: "Points Credited",
                message: `Your reward claim #${userReward.id} was rejected. ${userReward.pointsSpent} loyalty points have been refunded to your account.`,
                type: "reward",
                isRead: false,
                metadata: { userRewardId: userReward.id, refundedPoints: userReward.pointsSpent },
            });
        }

        return updatedUserReward;
    });
};


// 6. Delete a user reward
export const deleteUserReward = async (
    id: number
) => {
    return await db.transaction(async (tx) => {

        const [userReward] = await tx
            .select()
            .from(userRewards)
            .where(eq(userRewards.id, id))
            .for("update");

        if (!userReward) {
            throw new Error("User reward not found.");
        }

        // Only pending redemptions can be deleted
        if (userReward.status !== "pending") {
            throw new Error(
                "Only pending user rewards can be deleted."
            );
        }

        // Refund points
        await tx
            .update(users)
            .set({
                pointsBalance: sql`${users.pointsBalance} + ${userReward.pointsSpent}`,
            })
            .where(eq(users.id, userReward.userId));

        // Restore reward stock
        await tx
            .update(rewards)
            .set({
                stock: sql`${rewards.stock} + 1`,
            })
            .where(eq(rewards.id, userReward.rewardId));

        // Record points reversal transaction
        await tx.insert(pointsTransactions).values({
            userId: userReward.userId,
            points: userReward.pointsSpent,
            activity: "REVERSAL",
            description: `Points refund for deleted claim #${userReward.id}`,
            referenceId: userReward.id,
        });

        // Delete user reward
        const [deletedUserReward] = await tx
            .delete(userRewards)
            .where(eq(userRewards.id, id))
            .returning();

        // Send automatic Points Credited notification for cancellation refund
        await tx.insert(notifications).values({
            userId: userReward.userId,
            title: "Points Credited",
            message: `${userReward.pointsSpent} loyalty points have been refunded to your account balance.`,
            type: "reward",
            isRead: false,
            metadata: { userRewardId: id, refundedPoints: userReward.pointsSpent },
        });

        return deletedUserReward;
    });
};
