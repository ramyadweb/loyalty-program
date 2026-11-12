import { db } from "../../config/db.js";
import { users, tickets, auditLogs } from "../../db/schema.js";
import { eq, and, count, desc } from "drizzle-orm";

// Get Admin Dashboard Statistics
export const getAdminDashboardStats = async () => {
    // Run count queries in parallel for performance and resilience
    const [
        [totalUsers],
        [approvedUsers],
        [pendingUsers],
        [rejectedUsers],
        [activeUsers],
        [totalTickets],
        [openTickets],
        [resolvedTickets],
    ] = await Promise.all([
        // Total registered users (excluding admins)
        db.select({ total: count() }).from(users).where(eq(users.role, "user")),

        // Total approved users
        db.select({ total: count() }).from(users).where(
            and(
                eq(users.role, "user"),
                eq(users.status, "approved")
            )
        ),

        // Total pending users
        db.select({ total: count() }).from(users).where(
            and(
                eq(users.role, "user"),
                eq(users.status, "pending")
            )
        ),

        // Total rejected users
        db.select({ total: count() }).from(users).where(
            and(
                eq(users.role, "user"),
                eq(users.status, "rejected")
            )
        ),

        // Total active users
        db.select({ total: count() }).from(users).where(
            and(
                eq(users.role, "user"),
                eq(users.isActive, true)
            )
        ),

        // Total tickets
        db.select({ total: count() }).from(tickets),

        // Open tickets
        db.select({ total: count() }).from(tickets).where(eq(tickets.status, "open")),

        // Resolved tickets
        db.select({ total: count() }).from(tickets).where(eq(tickets.status, "resolved")),
    ]);

    return {
        totalUsers: Number(totalUsers?.total ?? 0),
        approvedUsers: Number(approvedUsers?.total ?? 0),
        pendingUsers: Number(pendingUsers?.total ?? 0),
        rejectedUsers: Number(rejectedUsers?.total ?? 0),
        activeUsers: Number(activeUsers?.total ?? 0),
        totalTickets: Number(totalTickets?.total ?? 0),
        openTickets: Number(openTickets?.total ?? 0),
        resolvedTickets: Number(resolvedTickets?.total ?? 0),
    };
};

// Get Recent User Activities
export const getRecentUserActivities = async () => {
    const activities = await db
        .select()
        .from(auditLogs)
        .orderBy(desc(auditLogs.createdAt))
        .limit(10);

    return activities;
};
