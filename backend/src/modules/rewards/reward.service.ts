import { eq, desc, sql } from "drizzle-orm";

import { db } from "../../config/db.js";
import { rewards, type Reward } from "../../db/schema.js";

import type {
    CreateRewardInput,
    UpdateRewardInput,
} from "./reward.validation.js";

// Create Reward
export const createReward = async (
    data: CreateRewardInput
): Promise<Reward> => {
    // Filter out undefined keys so column defaults apply cleanly
    const insertData = Object.fromEntries(
        Object.entries(data).filter(([_, value]) => value !== undefined)
    ) as typeof rewards.$inferInsert;

    const [reward] = await db
        .insert(rewards)
        .values(insertData)
        .returning();

    if (!reward) {
        throw new Error("Failed to create reward.");
    }

    return reward;
};

// Get All Rewards
export const getAllRewards = async (
    status?: "active" | "inactive"
): Promise<Reward[]> => {
    if (status) {
        return await db
            .select()
            .from(rewards)
            .where(eq(rewards.status, status))
            .orderBy(desc(rewards.createdAt));
    }

    return await db
        .select()
        .from(rewards)
        .orderBy(desc(rewards.createdAt));
};

// Get Reward By ID
export const getRewardById = async (
    id: number
): Promise<Reward | null> => {
    const [reward] = await db
        .select()
        .from(rewards)
        .where(eq(rewards.id, id))
        .limit(1);

    return reward || null;
};

// Update Reward
export const updateReward = async (
    id: number,
    data: UpdateRewardInput
): Promise<Reward | null> => {
    // Filter out undefined keys so partial PATCH requests only update provided fields
    const updateData = Object.fromEntries(
        Object.entries(data).filter(([_, value]) => value !== undefined)
    );

    const [reward] = await db
        .update(rewards)
        .set({
            ...updateData,
            updatedAt: new Date(),
        })
        .where(eq(rewards.id, id))
        .returning();

    return reward || null;
};

// Delete Reward
export const deleteReward = async (
    id: number
): Promise<Reward | null> => {
    // Check if the reward is referenced by any existing redemption records
    const checkTable = await db.execute(sql`
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'user_rewards'
    `);

    if (checkTable.rows.length > 0) {
        const referenced = await db.execute(sql`
            SELECT 1 FROM "user_rewards" WHERE "reward_id" = ${id} LIMIT 1
        `);

        if (referenced.rows.length > 0) {
            throw new Error("Cannot delete reward because it is already referenced by redemption records.");
        }
    }

    const [reward] = await db
        .delete(rewards)
        .where(eq(rewards.id, id))
        .returning();

    return reward || null;
};
