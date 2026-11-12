import { eq, and, or, ilike, desc, sql } from "drizzle-orm";
import { db } from "../../config/db.js";
import { users, notifications, pointsTransactions } from "../../db/schema.js";
import { awardRegistrationBonus } from "../points/points.service.js";
import type { GetUsersQuery, GetPendingUsersQuery } from "./admin.validation.js";

// Helper subquery: aggregated points transactions grouped by user_id
// Uses a clean LEFT JOIN with 1:1 user-to-aggregated-summary to prevent duplicate rows
const getPointsSubquery = () =>
  db
    .select({
      userId: pointsTransactions.userId,
      totalEarned: sql<number>`coalesce(sum(case when ${pointsTransactions.activity} in ('REGISTRATION', 'FEEDBACK', 'ADMIN_BONUS', 'TICKET_CREATED', 'TICKET_OPENED', 'TICKET_RESOLVED') or (${pointsTransactions.points} > 0 and ${pointsTransactions.activity} != 'REDEMPTION') then abs(${pointsTransactions.points}) else 0 end), 0)::int`.as("total_earned"),
      totalRedeemed: sql<number>`coalesce(sum(case when ${pointsTransactions.activity} = 'REDEMPTION' or ${pointsTransactions.points} < 0 then abs(${pointsTransactions.points}) else 0 end), 0)::int`.as("total_redeemed"),
      availablePoints: sql<number>`coalesce(sum(case when ${pointsTransactions.activity} = 'REDEMPTION' or ${pointsTransactions.points} < 0 then -abs(${pointsTransactions.points}) else abs(${pointsTransactions.points}) end), 0)::int`.as("available_points"),
    })
    .from(pointsTransactions)
    .groupBy(pointsTransactions.userId)
    .as("pt_agg");

// Common safe selection fields with dynamic points calculation from points_transactions
// Admin accounts do not participate in loyalty points and return null for points fields
const getSafeUserSelectFields = (ptAgg: ReturnType<typeof getPointsSubquery>) => ({
  id: users.id,
  name: users.name,
  email: users.email,
  role: users.role,
  status: users.status,
  isActive: users.isActive,
  pointsBalance: sql<number | null>`case when ${users.role} = 'admin' then null else coalesce(${ptAgg.availablePoints}, ${users.pointsBalance}, 0)::int end`,
  availablePoints: sql<number | null>`case when ${users.role} = 'admin' then null else coalesce(${ptAgg.availablePoints}, ${users.pointsBalance}, 0)::int end`,
  totalEarned: sql<number | null>`case when ${users.role} = 'admin' then null else coalesce(${ptAgg.totalEarned}, 0)::int end`,
  totalRedeemed: sql<number | null>`case when ${users.role} = 'admin' then null else coalesce(${ptAgg.totalRedeemed}, 0)::int end`,
  approvedAt: users.approvedAt,
  createdAt: users.createdAt,
  updatedAt: users.updatedAt,
});

// ─── 1. Get Pending Users Service ───────────────────────────────────────────

export const getPendingUsersService = async (query: GetPendingUsersQuery) => {
  const { page, limit } = query;
  const offset = (page - 1) * limit;

  // Count total pending users
  const [totalCountResult] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(users)
    .where(eq(users.status, "pending"));

  const total = Number(totalCountResult?.count ?? 0);
  const totalPages = Math.ceil(total / limit) || 1;

  // Fetch pending users with aggregated points
  const ptAgg = getPointsSubquery();
  const pendingUsers = await db
    .select(getSafeUserSelectFields(ptAgg))
    .from(users)
    .leftJoin(ptAgg, eq(users.id, ptAgg.userId))
    .where(eq(users.status, "pending"))
    .orderBy(desc(users.createdAt))
    .limit(limit)
    .offset(offset);

  return {
    users: pendingUsers,
    pagination: {
      total,
      page,
      limit,
      totalPages,
    },
  };
};

// ─── 2. Get All Users Service (with filtering & search) ─────────────────────

export const getAllUsersService = async (query: GetUsersQuery) => {
  const { page, limit, status, search } = query;
  const offset = (page - 1) * limit;

  const conditions = [];

  // Filter by status if specified and not 'all'
  if (status && status !== "all") {
    conditions.push(eq(users.status, status));
  }

  // Filter by search string across name or email
  if (search && search.length > 0) {
    const searchPattern = `%${search}%`;
    conditions.push(
      or(
        ilike(users.name, searchPattern),
        ilike(users.email, searchPattern)
      )
    );
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  // Count total matching users
  const [totalCountResult] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(users)
    .where(whereClause);

  const total = Number(totalCountResult?.count ?? 0);
  const totalPages = Math.ceil(total / limit) || 1;

  // Fetch users with aggregated points
  const ptAgg = getPointsSubquery();
  const allUsers = await db
    .select(getSafeUserSelectFields(ptAgg))
    .from(users)
    .leftJoin(ptAgg, eq(users.id, ptAgg.userId))
    .where(whereClause)
    .orderBy(desc(users.createdAt))
    .limit(limit)
    .offset(offset);

  return {
    users: allUsers,
    pagination: {
      total,
      page,
      limit,
      totalPages,
    },
  };
};

// ─── 3. Get User By ID Service ──────────────────────────────────────────────

export const getUserByIdService = async (userId: number) => {
  const ptAgg = getPointsSubquery();
  const [user] = await db
    .select(getSafeUserSelectFields(ptAgg))
    .from(users)
    .leftJoin(ptAgg, eq(users.id, ptAgg.userId))
    .where(eq(users.id, userId))
    .limit(1);

  return user || null;
};

// ─── 4. Approve User Service ────────────────────────────────────────────────

export type SafeUser = {
  id: number;
  name: string;
  email: string;
  role: "admin" | "user";
  status: "pending" | "approved" | "rejected" | "blocked";
  isActive: boolean;
  pointsBalance: number | null;
  availablePoints: number | null;
  totalEarned: number | null;
  totalRedeemed: number | null;
  approvedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

export interface ServiceResult<T> {
  success: boolean;
  statusCode: number;
  message: string;
  data?: T;
}

export const approveUserService = async (
  userId: number,
  adminId?: number
): Promise<ServiceResult<SafeUser>> => {
  // 1. Fetch user to verify existence and current status
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!user) {
    return {
      success: false,
      statusCode: 404,
      message: "User not found.",
    };
  }

  // 2. Prevent self-approval if an admin tries to approve themselves
  if (adminId && user.id === adminId) {
    return {
      success: false,
      statusCode: 400,
      message: "Administrators cannot approve their own account.",
    };
  }

  // 3. Verify status transitions
  if (user.status === "approved") {
    return {
      success: false,
      statusCode: 400,
      message: "User is already approved.",
    };
  }

  if (user.status === "rejected") {
    return {
      success: false,
      statusCode: 400,
      message: "User has already been rejected. Only pending accounts can be approved.",
    };
  }

  if (user.status === "blocked") {
    return {
      success: false,
      statusCode: 400,
      message: "User account is blocked. Only pending accounts can be approved.",
    };
  }

  if (user.status !== "pending") {
    return {
      success: false,
      statusCode: 400,
      message: `Only users with pending status can be approved. Current status: ${user.status}.`,
    };
  }

  // 4. Update status and automatically award registration bonus inside a transaction
  await db.transaction(async (tx) => {
    await tx
      .update(users)
      .set({
        status: "approved",
        approvedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));

    // Send automatic Account Approved notification to user
    await tx.insert(notifications).values({
      userId,
      title: "Account Approved",
      message:
        "Congratulations! Your Loyalty Program account has been approved. You can now access all available features.",
      type: "account",
      isRead: false,
    });

    // Automatically award 100 registration bonus points ONLY to regular users (idempotent - no duplicate award)
    if (user.role === "user") {
      await awardRegistrationBonus(userId, tx as any);
    }
  });

  const fullUser = await getUserByIdService(userId);
  if (!fullUser) {
    return {
      success: false,
      statusCode: 500,
      message: "User approved, but failed to retrieve updated record.",
    };
  }

  return {
    success: true,
    statusCode: 200,
    message: "User approved successfully and registration bonus awarded.",
    data: fullUser as SafeUser,
  };
};

// ─── 5. Reject User Service ─────────────────────────────────────────────────

export const rejectUserService = async (
  userId: number,
  adminId?: number
): Promise<ServiceResult<SafeUser>> => {
  // 1. Fetch user to verify existence and current status
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!user) {
    return {
      success: false,
      statusCode: 404,
      message: "User not found.",
    };
  }

  // 2. Prevent self-rejection if an admin tries to reject themselves
  if (adminId && user.id === adminId) {
    return {
      success: false,
      statusCode: 400,
      message: "Administrators cannot reject their own account.",
    };
  }

  // 3. Verify status transitions
  if (user.status === "rejected") {
    return {
      success: false,
      statusCode: 400,
      message: "User is already rejected.",
    };
  }

  if (user.status === "approved") {
    return {
      success: false,
      statusCode: 400,
      message: "User is already approved. Only pending accounts can be rejected.",
    };
  }

  if (user.status === "blocked") {
    return {
      success: false,
      statusCode: 400,
      message: "User account is blocked. Only pending accounts can be rejected.",
    };
  }

  if (user.status !== "pending") {
    return {
      success: false,
      statusCode: 400,
      message: `Only users with pending status can be rejected. Current status: ${user.status}.`,
    };
  }

  // 4. Update status to rejected
  await db
    .update(users)
    .set({
      status: "rejected",
      updatedAt: new Date(),
    })
    .where(eq(users.id, userId));

  // Send automatic Account Rejected notification to user
  await db.insert(notifications).values({
    userId,
    title: "Account Rejected",
    message:
      "Your account registration has been rejected. Please contact our support team for more information.",
    type: "account",
    isRead: false,
  });

  const fullUser = await getUserByIdService(userId);
  if (!fullUser) {
    return {
      success: false,
      statusCode: 500,
      message: "User rejected, but failed to retrieve updated record.",
    };
  }

  return {
    success: true,
    statusCode: 200,
    message: "User rejected successfully.",
    data: fullUser as SafeUser,
  };
};

// ─── 6. Get Recent Registered Users Service ─────────────────────────────────

export const getRecentUsersService = async (limitCount = 10) => {
  const ptAgg = getPointsSubquery();
  return await db
    .select(getSafeUserSelectFields(ptAgg))
    .from(users)
    .leftJoin(ptAgg, eq(users.id, ptAgg.userId))
    .orderBy(desc(users.createdAt))
    .limit(limitCount);
};


