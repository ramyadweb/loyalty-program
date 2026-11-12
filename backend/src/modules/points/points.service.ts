import { eq, and, desc, sql, ilike, or } from "drizzle-orm";
import { db } from "../../config/db.js";
import {
  users,
  pointsTransactions,
  notifications,
  type PointsTransaction,
} from "../../db/schema.js";
import { createAuditLog } from "../audit/audit.service.js";
import type {
  AwardPointsInput,
  UserPointsBalance,
  GetTransactionsQuery,
  PaginatedPointsTransactions,
} from "./points.types.js";

export interface ServiceResult<T = unknown> {
  success: boolean;
  statusCode: number;
  message: string;
  data?: T | undefined;
  pagination?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  } | undefined;
}

// ─── 1. Award Registration Bonus (Integrated with Admin Approval) ─────────────

export const awardRegistrationBonus = async (
  userId: number,
  clientDb: typeof db = db
): Promise<{ awarded: boolean; points: number }> => {
  // Verify user role: Admins must NOT receive points
  const [targetUser] = await clientDb
    .select({ id: users.id, role: users.role })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!targetUser || targetUser.role === "admin") {
    return { awarded: false, points: 0 };
  }

  // Check if user already received registration bonus (Idempotency)
  const [existingBonus] = await clientDb
    .select({ id: pointsTransactions.id })
    .from(pointsTransactions)
    .where(
      and(
        eq(pointsTransactions.userId, userId),
        eq(pointsTransactions.activity, "REGISTRATION")
      )
    )
    .limit(1);

  if (existingBonus) {
    return { awarded: false, points: 0 };
  }

  const bonusPoints = 100;

  // 1. Update user points balance in users table
  await clientDb
    .update(users)
    .set({
      pointsBalance: sql`${users.pointsBalance} + ${bonusPoints}`,
      updatedAt: new Date(),
    })
    .where(eq(users.id, userId));

  // 2. Record points transaction
  await clientDb.insert(pointsTransactions).values({
    userId,
    points: bonusPoints,
    activity: "REGISTRATION",
    description: "Registration welcome bonus points upon account approval",
    referenceId: null,
    createdBy: null,
  });

  // 3. Create notification for the user
  await clientDb.insert(notifications).values({
    userId,
    title: "Registration Bonus!",
    message: "Congratulations! You received 100 registration bonus points.",
    type: "reward",
    isRead: false,
    metadata: { activity: "REGISTRATION", points: bonusPoints },
  });

  return { awarded: true, points: bonusPoints };
};

// ─── 2. Admin Manually Awards Points ─────────────────────────────────────────

export const awardAdminBonusService = async (
  adminId: number,
  adminEmail: string,
  data: AwardPointsInput,
  ipAddress?: string
): Promise<ServiceResult<{ transaction: PointsTransaction; newBalance: number }>> => {
  // 1. Verify target user exists and is approved & active
  const [targetUser] = await db
    .select()
    .from(users)
    .where(eq(users.id, data.userId))
    .limit(1);

  if (!targetUser) {
    return {
      success: false,
      statusCode: 404,
      message: "Target user not found.",
    };
  }

  // Admins must not receive or hold loyalty points
  if (targetUser.role === "admin") {
    return {
      success: false,
      statusCode: 400,
      message: "Administrator accounts cannot receive or hold loyalty points.",
    };
  }

  if (targetUser.status !== "approved") {
    return {
      success: false,
      statusCode: 400,
      message: `Points can only be awarded to approved users. Current status: ${targetUser.status}.`,
    };
  }

  if (!targetUser.isActive) {
    return {
      success: false,
      statusCode: 400,
      message: "Target user account is inactive.",
    };
  }

  // 2. Execute atomic balance update and transaction record
  const result = await db.transaction(async (tx) => {
    // Update user balance
    const [updatedUser] = await tx
      .update(users)
      .set({
        pointsBalance: sql`${users.pointsBalance} + ${data.points}`,
        updatedAt: new Date(),
      })
      .where(eq(users.id, data.userId))
      .returning({ pointsBalance: users.pointsBalance });

    // Insert points transaction record
    const [txRecord] = await tx
      .insert(pointsTransactions)
      .values({
        userId: data.userId,
        points: data.points,
        activity: "ADMIN_BONUS",
        description: data.description,
        referenceId: null,
        createdBy: adminId,
      })
      .returning();

    if (!updatedUser || !txRecord) {
      throw new Error("Failed to record points transaction or update balance.");
    }

    // Create notification for the user
    await tx.insert(notifications).values({
      userId: data.userId,
      title: "Bonus Points Received!",
      message: `You received ${data.points} bonus loyalty points.`,
      type: "reward",
      isRead: false,
      metadata: {
        activity: "ADMIN_BONUS",
        points: data.points,
        description: data.description,
        transactionId: txRecord.id,
      },
    });

    return {
      transaction: txRecord,
      newBalance: updatedUser.pointsBalance,
    };
  });

  // 3. Record audit log
  try {
    await createAuditLog({
      userId: data.userId,
      actorId: adminId,
      actorEmail: adminEmail,
      targetUserId: data.userId,
      targetUserEmail: targetUser.email,
      activityType: "POINTS_AWARDED",
      ipAddress: ipAddress || null,
    });
  } catch (auditErr) {
    console.error("Failed to record audit log for points award:", auditErr);
  }

  return {
    success: true,
    statusCode: 201,
    message: `${data.points} bonus points awarded successfully.`,
    data: result,
  };
};

// ─── 3. Get User Points Balance ───────────────────────────────────────────────

export const getUserPointsBalanceService = async (
  userId: number
): Promise<ServiceResult<UserPointsBalance>> => {
  const [user] = await db
    .select({
      id: users.id,
      role: users.role,
      pointsBalance: users.pointsBalance,
    })
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

  if (user.role === "admin") {
    return {
      success: false,
      statusCode: 403,
      message: "Administrator accounts do not participate in loyalty points.",
    };
  }

  // Calculate totalEarned: sum of REGISTRATION, FEEDBACK, ADMIN_BONUS, TICKET_CREATED, TICKET_OPENED, TICKET_RESOLVED
  const [earnedResult] = await db
    .select({
      total: sql<number>`coalesce(sum(${pointsTransactions.points}), 0)::int`,
    })
    .from(pointsTransactions)
    .where(
      and(
        eq(pointsTransactions.userId, userId),
        sql`${pointsTransactions.activity} IN ('REGISTRATION', 'FEEDBACK', 'ADMIN_BONUS', 'TICKET_CREATED', 'TICKET_OPENED', 'TICKET_RESOLVED')`
      )
    );

  // Calculate totalRedeemed: sum of REDEMPTION
  const [redeemedResult] = await db
    .select({
      total: sql<number>`coalesce(sum(${pointsTransactions.points}), 0)::int`,
    })
    .from(pointsTransactions)
    .where(
      and(
        eq(pointsTransactions.userId, userId),
        eq(pointsTransactions.activity, "REDEMPTION")
      )
    );

  const totalEarned = Number(earnedResult?.total ?? 0);
  const totalRedeemed = Number(redeemedResult?.total ?? 0);
  const availablePoints = user.pointsBalance;

  return {
    success: true,
    statusCode: 200,
    message: "Points balance retrieved successfully.",
    data: {
      userId,
      totalEarned,
      totalRedeemed,
      availablePoints,
    },
  };
};

// ─── 4. Get User Points History (User-Facing) ────────────────────────────────

export const getUserPointsHistoryService = async (
  userId: number,
  page: number = 1,
  limit: number = 10
): Promise<ServiceResult<PointsTransaction[]>> => {
  const [user] = await db
    .select({
      id: users.id,
      role: users.role,
    })
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

  if (user.role === "admin") {
    return {
      success: false,
      statusCode: 403,
      message: "Administrator accounts do not participate in loyalty points.",
    };
  }

  const offset = (page - 1) * limit;

  // Count total transactions
  const [countResult] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(pointsTransactions)
    .where(eq(pointsTransactions.userId, userId));

  const total = Number(countResult?.count ?? 0);
  const totalPages = Math.ceil(total / limit) || 1;

  // Fetch transactions ordered newest first
  const transactions = await db
    .select({
      id: pointsTransactions.id,
      userId: pointsTransactions.userId,
      activity: pointsTransactions.activity,
      points: pointsTransactions.points,
      description: pointsTransactions.description,
      referenceId: pointsTransactions.referenceId,
      createdBy: pointsTransactions.createdBy,
      createdAt: pointsTransactions.createdAt,
    })
    .from(pointsTransactions)
    .where(eq(pointsTransactions.userId, userId))
    .orderBy(desc(pointsTransactions.createdAt))
    .limit(limit)
    .offset(offset);

  return {
    success: true,
    statusCode: 200,
    message: "Points history retrieved successfully.",
    data: transactions,
    pagination: {
      total,
      page,
      limit,
      totalPages,
    },
  };
};

// ─── 5. Admin: Get All Points Transactions ───────────────────────────────────

export const getAllPointsTransactionsService = async (
  query: GetTransactionsQuery
): Promise<ServiceResult<PaginatedPointsTransactions["transactions"]>> => {
  const { page = 1, limit = 10, activity, search } = query;
  const offset = (page - 1) * limit;

  const conditions = [];

  if (activity) {
    conditions.push(eq(pointsTransactions.activity, activity));
  }

  if (search && search.length > 0) {
    conditions.push(
      or(
        ilike(pointsTransactions.description, `%${search}%`),
        ilike(users.name, `%${search}%`),
        ilike(users.email, `%${search}%`)
      )
    );
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  // Count total matching transactions
  const [countResult] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(pointsTransactions)
    .leftJoin(users, eq(pointsTransactions.userId, users.id))
    .where(whereClause);

  const total = Number(countResult?.count ?? 0);
  const totalPages = Math.ceil(total / limit) || 1;

  const transactions = await db
    .select({
      id: pointsTransactions.id,
      userId: pointsTransactions.userId,
      points: pointsTransactions.points,
      activity: pointsTransactions.activity,
      description: pointsTransactions.description,
      referenceId: pointsTransactions.referenceId,
      createdBy: pointsTransactions.createdBy,
      createdAt: pointsTransactions.createdAt,
      user: {
        id: users.id,
        name: users.name,
        email: users.email,
      },
    })
    .from(pointsTransactions)
    .leftJoin(users, eq(pointsTransactions.userId, users.id))
    .where(whereClause)
    .orderBy(desc(pointsTransactions.createdAt))
    .limit(limit)
    .offset(offset);

  return {
    success: true,
    statusCode: 200,
    message: "All points transactions retrieved successfully.",
    data: transactions,
    pagination: {
      total,
      page,
      limit,
      totalPages,
    },
  };
};

// ─── 6. Admin: Get User Points Transactions & Balance ────────────────────────

export const getUserPointsTransactionsForAdminService = async (
  targetUserId: number,
  query: GetTransactionsQuery
): Promise<
  ServiceResult<{
    balance: UserPointsBalance;
    transactions: PointsTransaction[];
  }>
> => {
  // 1. Get user balance
  const balanceResult = await getUserPointsBalanceService(targetUserId);

  if (!balanceResult.success || !balanceResult.data) {
    return {
      success: false,
      statusCode: balanceResult.statusCode,
      message: balanceResult.message,
    };
  }

  // 2. Get user transactions with pagination
  const { page = 1, limit = 10 } = query;
  const historyResult = await getUserPointsHistoryService(targetUserId, page, limit);

  return {
    success: true,
    statusCode: 200,
    message: "User points details retrieved successfully.",
    data: {
      balance: balanceResult.data,
      transactions: historyResult.data || [],
    },
    pagination: historyResult.pagination,
  };
};
