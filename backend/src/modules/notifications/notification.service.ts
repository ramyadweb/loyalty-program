import { eq, and, desc, sql } from "drizzle-orm";
import { db } from "../../config/db.js";
import { notifications, users, tickets } from "../../db/schema.js";
import type { CreateNotificationInput } from "./notification.validation.js";

// 1. Create Notification (Supports Single User, Multiple Users, and All Users)
export const createNotification = async (data: CreateNotificationInput) => {
  // A. Broadcast to All Users
  if (data.recipientType === "all") {
    const targetUsers = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.role, "user"));

    // If no users with role 'user' exist, fallback to all users
    const userList =
      targetUsers.length > 0
        ? targetUsers
        : await db.select({ id: users.id }).from(users);

    if (userList.length === 0) {
      throw new Error("No registered users found to receive this notification.");
    }

    const records = userList.map((u) => ({
      userId: u.id,
      title: data.title,
      message: data.message,
      type: data.type.toLowerCase(),
      isRead: false,
      metadata: data.metadata || null,
    }));

    // Efficient bulk insert via Drizzle ORM
    const inserted = await db.insert(notifications).values(records).returning();

    return {
      count: inserted.length,
      recipientType: "all",
      title: data.title,
      type: data.type,
      message: `Notification broadcast successfully to ${inserted.length} user(s).`,
    };
  }

  // B. Send to Multiple Selected Users
  if (data.userIds && data.userIds.length > 0) {
    const uniqueUserIds = [...new Set(data.userIds)];

    const records = uniqueUserIds.map((uid) => ({
      userId: uid,
      title: data.title,
      message: data.message,
      type: data.type.toLowerCase(),
      isRead: false,
      metadata: data.metadata || null,
    }));

    const inserted = await db.insert(notifications).values(records).returning();

    return {
      count: inserted.length,
      recipientType: "multiple",
      title: data.title,
      type: data.type,
      message: `Notification sent successfully to ${inserted.length} selected user(s).`,
    };
  }

  // C. Send to Individual User
  if (data.userId) {
    const [notification] = await db
      .insert(notifications)
      .values({
        userId: data.userId,
        title: data.title,
        message: data.message,
        type: data.type.toLowerCase(),
        isRead: false,
        metadata: data.metadata || null,
      })
      .returning();

    if (!notification) {
      throw new Error("Failed to create notification.");
    }

    return notification;
  }

  throw new Error("Invalid notification recipient specification.");
};

// 2. Get Admin System Notifications (recent notifications sent across system)
export const getAdminNotifications = async (limit = 30) => {
  return await db
    .select({
      id: notifications.id,
      userId: notifications.userId,
      title: notifications.title,
      message: notifications.message,
      type: notifications.type,
      isRead: notifications.isRead,
      metadata: notifications.metadata,
      createdAt: notifications.createdAt,
      user: {
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
      },
    })
    .from(notifications)
    .leftJoin(users, eq(notifications.userId, users.id))
    .orderBy(desc(notifications.createdAt))
    .limit(limit);
};

// 3. Get Admin Unread Activity Count (pending users + open tickets)
export const getAdminUnreadCount = async () => {
  // Count pending users
  const [pendingResult] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(users)
    .where(eq(users.status, "pending"));

  // Count open tickets
  const [ticketsResult] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(tickets)
    .where(eq(tickets.status, "open"));

  const pendingUsers = Number(pendingResult?.count ?? 0);
  const openTickets = Number(ticketsResult?.count ?? 0);
  const totalUnread = pendingUsers + openTickets;

  return {
    total: totalUnread,
    totalUnread,
    pendingUsers,
    openTickets,
  };
};

// 4. Get All Notifications For Logged-in User
export const getUserNotifications = async (userId: number) => {
  return await db
    .select()
    .from(notifications)
    .where(eq(notifications.userId, userId))
    .orderBy(desc(notifications.createdAt));
};

// 5. Get Unread Notifications For Logged-in User
export const getUnreadNotifications = async (userId: number) => {
  return await db
    .select()
    .from(notifications)
    .where(
      and(
        eq(notifications.userId, userId),
        eq(notifications.isRead, false)
      )
    )
    .orderBy(desc(notifications.createdAt));
};

// 5b. Get Unread Count For Logged-in User
export const getUserUnreadCount = async (userId: number): Promise<number> => {
  const [result] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(notifications)
    .where(
      and(
        eq(notifications.userId, userId),
        eq(notifications.isRead, false)
      )
    );
  return Number(result?.count ?? 0);
};

// Helper: Safely insert a single user notification from backend services
export const createSystemNotification = async ({
  userId,
  title,
  message,
  type,
  metadata,
}: {
  userId: number;
  title: string;
  message: string;
  type: string;
  metadata?: Record<string, unknown> | null;
}) => {
  try {
    const [inserted] = await db
      .insert(notifications)
      .values({
        userId,
        title,
        message,
        type: type.toLowerCase(),
        isRead: false,
        metadata: metadata || null,
      })
      .returning();
    return inserted;
  } catch (err) {
    console.error(`Failed to create system notification for user #${userId}:`, err);
    return null;
  }
};

// 6. Mark Notification As Read
export const markNotificationAsRead = async (
  id: number,
  userId?: number
) => {
  const whereClause = userId
    ? and(eq(notifications.id, id), eq(notifications.userId, userId))
    : eq(notifications.id, id);

  const [notification] = await db
    .update(notifications)
    .set({
      isRead: true,
    })
    .where(whereClause)
    .returning();

  return notification || null;
};

// 7. Mark All Notifications As Read
export const markAllNotificationsAsRead = async (userId: number) => {
  return await db
    .update(notifications)
    .set({
      isRead: true,
    })
    .where(
      and(
        eq(notifications.userId, userId),
        eq(notifications.isRead, false)
      )
    )
    .returning();
};

// 8. Delete Notification
export const deleteNotification = async (
  id: number,
  userId: number
) => {
  const [notification] = await db
    .delete(notifications)
    .where(
      and(
        eq(notifications.id, id),
        eq(notifications.userId, userId)
      )
    )
    .returning();

  return notification || null;
};
