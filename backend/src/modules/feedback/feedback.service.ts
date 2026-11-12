import { eq, and, desc, sql, ilike, or } from "drizzle-orm";
import { db } from "../../config/db.js";
import {
  users,
  feedbacks,
  pointsTransactions,
  notifications,
  type Feedback,
} from "../../db/schema.js";
import { createAuditLog } from "../audit/audit.service.js";
import type {
  CreateFeedbackInput,
  GetFeedbackQuery,
  PaginatedFeedbackResult,
} from "./feedback.types.js";

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

// ─── 1. User Submits Feedback (POST /api/feedback) ────────────────────────────

export const createFeedbackService = async (
  userId: number,
  data: CreateFeedbackInput
): Promise<ServiceResult<Feedback>> => {
  // 1. Verify user exists and is approved
  const [user] = await db
    .select({
      id: users.id,
      status: users.status,
      isActive: users.isActive,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!user) {
    return {
      success: false,
      statusCode: 404,
      message: "User account not found.",
    };
  }

  if (user.status !== "approved") {
    return {
      success: false,
      statusCode: 403,
      message: "Only approved users can submit feedback.",
    };
  }

  // 2. Insert feedback with 'pending' status (DO NOT award points yet)
  const [newFeedback] = await db
    .insert(feedbacks)
    .values({
      userId,
      rating: data.rating,
      comment: data.comment,
      status: "pending",
    })
    .returning();

  if (!newFeedback) {
    return {
      success: false,
      statusCode: 500,
      message: "Failed to submit feedback.",
    };
  }

  return {
    success: true,
    statusCode: 201,
    message: "Feedback submitted successfully. It will be reviewed by an administrator.",
    data: newFeedback,
  };
};

// ─── 2. User Views Own Feedback (GET /api/feedback/my-feedback) ───────────────

export const getMyFeedbackService = async (
  userId: number
): Promise<ServiceResult<Feedback[]>> => {
  const userFeedbackList = await db
    .select()
    .from(feedbacks)
    .where(eq(feedbacks.userId, userId))
    .orderBy(desc(feedbacks.createdAt));

  return {
    success: true,
    statusCode: 200,
    message: "Your feedback history retrieved successfully.",
    data: userFeedbackList,
  };
};

// ─── 3. Admin Views All Feedback (GET /api/feedback) ──────────────────────────

export const getAllFeedbackService = async (
  query: GetFeedbackQuery
): Promise<ServiceResult<PaginatedFeedbackResult["feedbacks"]>> => {
  const { page = 1, limit = 10, status, search } = query;
  const offset = (page - 1) * limit;

  const conditions = [];

  if (status) {
    conditions.push(eq(feedbacks.status, status));
  }

  if (search && search.length > 0) {
    conditions.push(
      or(
        ilike(feedbacks.comment, `%${search}%`),
        ilike(users.name, `%${search}%`),
        ilike(users.email, `%${search}%`)
      )
    );
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  // Count total matching feedback
  const [countResult] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(feedbacks)
    .leftJoin(users, eq(feedbacks.userId, users.id))
    .where(whereClause);

  const total = Number(countResult?.count ?? 0);
  const totalPages = Math.ceil(total / limit) || 1;

  const feedbackList = await db
    .select({
      id: feedbacks.id,
      userId: feedbacks.userId,
      rating: feedbacks.rating,
      comment: feedbacks.comment,
      status: feedbacks.status,
      createdAt: feedbacks.createdAt,
      user: {
        id: users.id,
        name: users.name,
        email: users.email,
      },
    })
    .from(feedbacks)
    .leftJoin(users, eq(feedbacks.userId, users.id))
    .where(whereClause)
    .orderBy(desc(feedbacks.createdAt))
    .limit(limit)
    .offset(offset);

  return {
    success: true,
    statusCode: 200,
    message: "Feedback records retrieved successfully.",
    data: feedbackList,
    pagination: {
      total,
      page,
      limit,
      totalPages,
    },
  };
};

// ─── 4. Admin Approves Feedback (PATCH /api/feedback/:id/approve) ─────────────

export const approveFeedbackService = async (
  feedbackId: number,
  adminId: number,
  adminEmail: string,
  ipAddress?: string
): Promise<ServiceResult<{ feedback: Feedback; pointsAwarded: number }>> => {
  const feedbackBonusPoints = 20;

  // Execute in database transaction to ensure atomicity
  const transactionResult = await db.transaction(async (tx) => {
    // 1. Fetch and lock feedback
    const [existingFeedback] = await tx
      .select()
      .from(feedbacks)
      .where(eq(feedbacks.id, feedbackId))
      .for("update");

    if (!existingFeedback) {
      return {
        error: true as const,
        statusCode: 404,
        message: "Feedback not found.",
      };
    }

    // 2. Validate current status is pending (prevent duplicate approval)
    if (existingFeedback.status !== "pending") {
      return {
        error: true as const,
        statusCode: 400,
        message: `Only pending feedback can be approved. Current status: ${existingFeedback.status}.`,
      };
    }

    // 3. Update feedback status to approved
    const [updatedFeedback] = await tx
      .update(feedbacks)
      .set({
        status: "approved",
      })
      .where(eq(feedbacks.id, feedbackId))
      .returning();

    if (!updatedFeedback) {
      throw new Error("Failed to update feedback status.");
    }

    // Admins do not receive loyalty points; only award points to regular users
    const [targetUser] = await tx
      .select({ id: users.id, role: users.role })
      .from(users)
      .where(eq(users.id, existingFeedback.userId))
      .limit(1);

    const isRegularUser = targetUser?.role === "user";
    const pointsAwarded = isRegularUser ? feedbackBonusPoints : 0;

    if (isRegularUser) {
      // 4. Update user points balance in users table
      await tx
        .update(users)
        .set({
          pointsBalance: sql`${users.pointsBalance} + ${feedbackBonusPoints}`,
          updatedAt: new Date(),
        })
        .where(eq(users.id, existingFeedback.userId));

      // 5. Create points transaction record
      await tx.insert(pointsTransactions).values({
        userId: existingFeedback.userId,
        points: feedbackBonusPoints,
        activity: "FEEDBACK",
        description: `Reward points for approved feedback #${feedbackId}`,
        referenceId: feedbackId,
        createdBy: adminId,
      });

      // 6. Create notification for the user
      await tx.insert(notifications).values({
        userId: existingFeedback.userId,
        title: "Feedback Approved!",
        message: "Your feedback was approved. You earned 20 loyalty points.",
        type: "reward",
        isRead: false,
        metadata: {
          feedbackId,
          points: feedbackBonusPoints,
          activity: "FEEDBACK",
        },
      });
    }

    return {
      error: false as const,
      feedback: updatedFeedback,
      targetUserId: existingFeedback.userId,
      pointsAwarded,
    };
  });

  if (transactionResult.error) {
    return {
      success: false,
      statusCode: transactionResult.statusCode,
      message: transactionResult.message,
    };
  }

  // 7. Record audit log
  try {
    const [targetUser] = await db
      .select({ email: users.email })
      .from(users)
      .where(eq(users.id, transactionResult.targetUserId))
      .limit(1);

    await createAuditLog({
      userId: transactionResult.targetUserId,
      actorId: adminId,
      actorEmail: adminEmail,
      targetUserId: transactionResult.targetUserId,
      targetUserEmail: targetUser?.email || null,
      activityType: "FEEDBACK_APPROVED",
      ipAddress: ipAddress || null,
    });
  } catch (auditErr) {
    console.error("Failed to record audit log for feedback approval:", auditErr);
  }

  return {
    success: true,
    statusCode: 200,
    message: "Feedback approved successfully and 20 loyalty points awarded.",
    data: {
      feedback: transactionResult.feedback,
      pointsAwarded: feedbackBonusPoints,
    },
  };
};

// ─── 5. Admin Rejects Feedback (PATCH /api/feedback/:id/reject) ───────────────

export const rejectFeedbackService = async (
  feedbackId: number,
  adminId: number,
  adminEmail: string,
  ipAddress?: string
): Promise<ServiceResult<{ feedback: Feedback }>> => {
  const transactionResult = await db.transaction(async (tx) => {
    // 1. Fetch and lock feedback
    const [existingFeedback] = await tx
      .select()
      .from(feedbacks)
      .where(eq(feedbacks.id, feedbackId))
      .for("update");

    if (!existingFeedback) {
      return {
        error: true as const,
        statusCode: 404,
        message: "Feedback not found.",
      };
    }

    if (existingFeedback.status !== "pending") {
      return {
        error: true as const,
        statusCode: 400,
        message: `Only pending feedback can be rejected. Current status: ${existingFeedback.status}.`,
      };
    }

    // 2. Update status to rejected (DO NOT award points)
    const [updatedFeedback] = await tx
      .update(feedbacks)
      .set({
        status: "rejected",
      })
      .where(eq(feedbacks.id, feedbackId))
      .returning();

    if (!updatedFeedback) {
      throw new Error("Failed to update feedback status.");
    }

    // 3. Create notification for the user
    await tx.insert(notifications).values({
      userId: existingFeedback.userId,
      title: "Feedback Status Update",
      message: "Your feedback submission has been reviewed and rejected.",
      type: "feedback",
      isRead: false,
      metadata: { feedbackId },
    });

    return {
      error: false as const,
      feedback: updatedFeedback,
      targetUserId: existingFeedback.userId,
    };
  });

  if (transactionResult.error) {
    return {
      success: false,
      statusCode: transactionResult.statusCode,
      message: transactionResult.message,
    };
  }

  // 4. Record audit log
  try {
    const [targetUser] = await db
      .select({ email: users.email })
      .from(users)
      .where(eq(users.id, transactionResult.targetUserId))
      .limit(1);

    await createAuditLog({
      userId: transactionResult.targetUserId,
      actorId: adminId,
      actorEmail: adminEmail,
      targetUserId: transactionResult.targetUserId,
      targetUserEmail: targetUser?.email || null,
      activityType: "FEEDBACK_REJECTED",
      ipAddress: ipAddress || null,
    });
  } catch (auditErr) {
    console.error("Failed to record audit log for feedback rejection:", auditErr);
  }

  return {
    success: true,
    statusCode: 200,
    message: "Feedback rejected successfully.",
    data: {
      feedback: transactionResult.feedback,
    },
  };
};
