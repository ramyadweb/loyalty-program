import { count, desc, sum, eq } from "drizzle-orm";

import { db } from "../../config/db.js";

import {
    users,
    rewards,
    userRewards,
    rewardRedemptions,
    tickets,
    auditLogs,
} from "../../db/schema.js";

// 1. Dashboard Summary
export const getDashboardSummaryService = async () => {
    const [
        totalUsers,
        totalRewards,
        totalRedemptions,
        totalRedemptionCodes,
        totalTickets,
        totalPointsRedeemed,
    ] = await Promise.all([
        db.select({ total: count() }).from(users),

        db.select({ total: count() }).from(rewards),

        db.select({ total: count() }).from(userRewards),

        db.select({ total: count() }).from(rewardRedemptions),

        db.select({ total: count() }).from(tickets),

        db.select({ total: sum(userRewards.pointsSpent) })
            .from(userRewards),
    ]);

    return {
        totalUsers: totalUsers[0]?.total ?? 0,
        totalRewards: totalRewards[0]?.total ?? 0,
        totalRedemptions: totalRedemptions[0]?.total ?? 0,
        totalRedemptionCodes: totalRedemptionCodes[0]?.total ?? 0,
        totalTickets: totalTickets[0]?.total ?? 0,
        totalPointsRedeemed: Number(
            totalPointsRedeemed[0]?.total ?? 0
        ),
    };
};


// 2. User Statistics
export const getUserStatisticsService = async () => {
    const [totalUsers, usersByStatus, usersByRole] =
        await Promise.all([
            db.select({ total: count() }).from(users),

            db.select({
                status: users.status,
                total: count(),
            })
                .from(users)
                .groupBy(users.status),

            db.select({
                role: users.role,
                total: count(),
            })
                .from(users)
                .groupBy(users.role),
        ]);

    return {
        totalUsers: totalUsers[0]?.total ?? 0,
        usersByStatus,
        usersByRole,
    };
};


// 3. Reward Statistics
export const getRewardStatisticsService = async () => {
    const [totalRewards, rewardsByStatus, rewardPerformance] =
        await Promise.all([
            db.select({ total: count() }).from(rewards),

            db.select({
                status: rewards.status,
                total: count(),
            })
                .from(rewards)
                .groupBy(rewards.status),

            db.select({
                rewardId: rewards.id,
                rewardName: rewards.name,
                pointsRequired: rewards.pointsRequired,
                stock: rewards.stock,
                totalRedemptions: count(userRewards.id),
                totalPointsSpent: sum(userRewards.pointsSpent),
            })
                .from(rewards)
                .leftJoin(
                    userRewards,
                    eq(rewards.id, userRewards.rewardId)
                )
                .groupBy(
                    rewards.id,
                    rewards.name,
                    rewards.pointsRequired,
                    rewards.stock
                ),
        ]);

    return {
        totalRewards: totalRewards[0]?.total ?? 0,
        rewardsByStatus,
        rewardPerformance: rewardPerformance.map((reward) => ({
            ...reward,
            totalPointsSpent: Number(reward.totalPointsSpent ?? 0),
        })),
    };
};


// 4. Redemption Statistics
export const getRedemptionStatisticsService = async () => {
    const [totalRedemptions, redemptionsByStatus, codeStatistics] =
        await Promise.all([
            db.select({ total: count() }).from(userRewards),

            db.select({
                status: userRewards.status,
                total: count(),
            })
                .from(userRewards)
                .groupBy(userRewards.status),

            db.select({
                status: rewardRedemptions.status,
                total: count(),
            })
                .from(rewardRedemptions)
                .groupBy(rewardRedemptions.status),
        ]);

    return {
        totalRedemptions: totalRedemptions[0]?.total ?? 0,
        redemptionsByStatus,
        redemptionCodes: codeStatistics,
    };
};


// 5. Ticket Statistics
export const getTicketStatisticsService = async () => {
    const [totalTickets, ticketsByStatus, ticketsByPriority] =
        await Promise.all([
            db.select({ total: count() }).from(tickets),

            db.select({
                status: tickets.status,
                total: count(),
            })
                .from(tickets)
                .groupBy(tickets.status),

            db.select({
                priority: tickets.priority,
                total: count(),
            })
                .from(tickets)
                .groupBy(tickets.priority),
        ]);

    return {
        totalTickets: totalTickets[0]?.total ?? 0,
        ticketsByStatus,
        ticketsByPriority,
    };
};


// 6. Audit Activity Statistics
export const getAuditStatisticsService = async () => {
    const [totalActivities, activitiesByType, recentActivities] =
        await Promise.all([
            db.select({ total: count() }).from(auditLogs),

            db.select({
                activityType: auditLogs.activityType,
                total: count(),
            })
                .from(auditLogs)
                .groupBy(auditLogs.activityType),

            db.select()
                .from(auditLogs)
                .orderBy(desc(auditLogs.createdAt))
                .limit(50),
        ]);

    return {
        totalActivities: totalActivities[0]?.total ?? 0,
        activitiesByType,
        recentActivities,
    };
};
