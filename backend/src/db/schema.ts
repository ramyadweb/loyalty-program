import { sql } from "drizzle-orm";
import {
  pgTable,
  serial,
  varchar,
  text,
  timestamp,
  boolean,
  integer,
  pgEnum,
  index,
  uniqueIndex,
  jsonb,
} from "drizzle-orm/pg-core";

// User roles
export const userRoleEnum = pgEnum("user_role", [
  "admin",
  "user",
]);

// Account statuses
export const userStatusEnum = pgEnum("user_status", [
  "pending",
  "approved",
  "rejected",
  "blocked",
]);

// Ticket priorities
export const ticketPriorityEnum = pgEnum("ticket_priority", [
  "low",
  "medium",
  "high",
]);

// Ticket statuses
export const ticketStatusEnum = pgEnum("ticket_status", [
  "open",
  "in_progress",
  "resolved",
  "closed",
]);

// Audit activity types
export const auditActivityTypeEnum = pgEnum("audit_activity_type", [
  "LOGIN",
  "LOGOUT",
  "USER_APPROVED",
  "USER_REJECTED",
  "POINTS_AWARDED",
  "FEEDBACK_APPROVED",
  "FEEDBACK_REJECTED",
]);

// Points Activity Types
export const pointsActivityEnum = pgEnum("points_activity", [
  "REGISTRATION",
  "FEEDBACK",
  "ADMIN_BONUS",
  "REDEMPTION",
  "REVERSAL",
  "TICKET_CREATED",
  "TICKET_OPENED",
  "TICKET_RESOLVED",
]);

// Feedback Statuses
export const feedbackStatusEnum = pgEnum("feedback_status", [
  "pending",
  "approved",
  "rejected",
]);

// Reward statuses
export const rewardStatusEnum = pgEnum(
  "reward_status",
  ["active", "inactive"]
);

// User Reward Redemption Status
export const redemptionStatusEnum = pgEnum(
  "redemption_status",
  ["pending", "approved", "rejected"]
);

// Reward Redemption Code Status
export const redemptionCodeStatusEnum = pgEnum(
  "redemption_code_status",
  ["generated", "completed", "expired"]
);


// User table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),

  name: varchar("name", { length: 100 }).notNull(),

  email: varchar("email", { length: 255 }).notNull().unique(),

  password: text("password").notNull(),

  role: userRoleEnum("role")
    .notNull()
    .default("user"),

  status: userStatusEnum("status")
    .notNull()
    .default("pending"),

  isActive: boolean("is_Active")
    .notNull()
    .default(true),

  approvedAt: timestamp("approved_at"),

  createdAt: timestamp("created_at")
    .defaultNow()
    .notNull(),

  updatedAt: timestamp("updated_at")
    .defaultNow()
    .notNull(),

  pointsBalance: integer("points_balance")
    .notNull()
    .default(0),
});

// Password Resets & OTP Table
export const passwordResets = pgTable("password_resets", {
  id: serial("id").primaryKey(),

  email: varchar("email", { length: 255 }).notNull(),

  otpHash: text("otp_hash").notNull(),

  resetToken: varchar("reset_token", { length: 255 }),

  isVerified: boolean("is_verified")
    .notNull()
    .default(false),

  attempts: integer("attempts")
    .notNull()
    .default(0),

  expiresAt: timestamp("expires_at").notNull(),

  createdAt: timestamp("created_at")
    .defaultNow()
    .notNull(),
});

// Support Tickets Table
export const tickets = pgTable("tickets", {
  id: serial("id").primaryKey(),

  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),

  subject: varchar("subject", { length: 255 }).notNull(),

  description: text("description").notNull(),

  category: varchar("category", { length: 100 }).notNull(),

  priority: ticketPriorityEnum("priority")
    .notNull()
    .default("medium"),

  status: ticketStatusEnum("status")
    .notNull()
    .default("open"),

  assignedTo: integer("assigned_to")
    .references(() => users.id, { onDelete: "set null" }),

  adminResponse: text("admin_response"),

  resolvedAt: timestamp("resolved_at"),

  openedAt: timestamp("opened_at"),

  openedBy: integer("opened_by").references(() => users.id, { onDelete: "set null" }),

  createdAt: timestamp("created_at")
    .defaultNow()
    .notNull(),

  updatedAt: timestamp("updated_at")
    .defaultNow()
    .notNull(),
});

// Audit Logs Table
export const auditLogs = pgTable(
  "audit_logs",
  {
    id: serial("id").primaryKey(),

    // User associated with the activity (e.g. who logged in or logged out)
    userId: integer("user_id").references(() => users.id, {
      onDelete: "set null",
    }),

    // Actor who initiated the activity (admin or user themselves)
    actorId: integer("actor_id").references(() => users.id, {
      onDelete: "set null",
    }),

    actorEmail: varchar("actor_email", { length: 255 }),

    // Target user affected by an admin action (e.g. approved or rejected user)
    targetUserId: integer("target_user_id").references(() => users.id, {
      onDelete: "set null",
    }),

    targetUserEmail: varchar("target_user_email", { length: 255 }),

    activityType: auditActivityTypeEnum("activity_type").notNull(),

    ipAddress: varchar("ip_address", { length: 100 }),

    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("audit_logs_user_id_idx").on(table.userId),
    index("audit_logs_actor_id_idx").on(table.actorId),
    index("audit_logs_activity_type_idx").on(table.activityType),
    index("audit_logs_created_at_idx").on(table.createdAt),
  ]
);

export type AuditLog = typeof auditLogs.$inferSelect;
export type NewAuditLog = typeof auditLogs.$inferInsert;


// JWT Token Blacklist Table
export const tokenBlacklist = pgTable("token_blacklist", {
  id: serial("id").primaryKey(),

  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),

  tokenHash: varchar("token_hash", { length: 64 })
    .notNull()
    .unique(),

  expiresAt: timestamp("expires_at", {
    withTimezone: true,
  }).notNull(),

  createdAt: timestamp("created_at", {
    withTimezone: true,
  })
    .defaultNow()
    .notNull(),
});


// Rewards Table
export const rewards = pgTable("rewards", {
  id: serial("id").primaryKey(),

  name: varchar("name", { length: 150 }).notNull(),

  description: text("description"),

  pointsRequired: integer("points_required").notNull(),

  stock: integer("stock").notNull().default(0),

  image: text("image"),

  status: rewardStatusEnum("status")
    .notNull()
    .default("active"),

  createdAt: timestamp("created_at")
    .defaultNow()
    .notNull(),

  updatedAt: timestamp("updated_at")
    .defaultNow()
    .notNull(),
});

export type Reward = typeof rewards.$inferSelect;
export type NewReward = typeof rewards.$inferInsert;

// User Rewards / Redemption Table
export const userRewards = pgTable(
  "user_rewards",
  {
    id: serial("id").primaryKey(),

    userId: integer("user_id")
      .notNull()
      .references(() => users.id, {
        onDelete: "cascade",
      }),

    rewardId: integer("reward_id")
      .notNull()
      .references(() => rewards.id, {
        onDelete: "restrict",
      }),

    // Points spent at the time of redemption
    pointsSpent: integer("points_spent").notNull(),

    status: redemptionStatusEnum("status")
      .notNull()
      .default("pending"),

    redeemedAt: timestamp("redeemed_at")
      .defaultNow()
      .notNull(),

    updatedAt: timestamp("updated_at")
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("user_rewards_user_id_idx").on(table.userId),
    index("user_rewards_reward_id_idx").on(table.rewardId),
    index("user_rewards_status_idx").on(table.status),
  ]
);

// User Rewards Types
export type UserReward = typeof userRewards.$inferSelect;
export type NewUserReward = typeof userRewards.$inferInsert;

// Reward Redemptions Table
export const rewardRedemptions = pgTable(
  "reward_redemptions",
  {
    id: serial("id").primaryKey(),

    userRewardId: integer("user_reward_id")
      .notNull()
      .references(() => userRewards.id, {
        onDelete: "cascade",
      }),

    redemptionCode: varchar("redemption_code", { length: 100 })
      .notNull()
      .unique(),

    status: redemptionCodeStatusEnum("status")
      .notNull()
      .default("generated"),

    generatedAt: timestamp("generated_at")
      .defaultNow()
      .notNull(),

    completedAt: timestamp("completed_at"),

    expiresAt: timestamp("expires_at").notNull(),

    createdAt: timestamp("created_at")
      .defaultNow()
      .notNull(),

    updatedAt: timestamp("updated_at")
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("reward_redemptions_user_reward_id_idx").on(table.userRewardId),
    index("reward_redemptions_redemption_code_idx").on(table.redemptionCode),
    index("reward_redemptions_status_idx").on(table.status),
  ]
);

// Reward Redemptions Types
export type RewardRedemption = typeof rewardRedemptions.$inferSelect;
export type NewRewardRedemption = typeof rewardRedemptions.$inferInsert;

// Notifications Table
export const notifications = pgTable(
  "notifications",
  {
    id: serial("id").primaryKey(),

    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),

    title: varchar("title", { length: 255 }).notNull(),

    message: text("message").notNull(),

    type: varchar("type", { length: 100 }).notNull(),

    isRead: boolean("is_read").default(false).notNull(),

    metadata: jsonb("metadata"),

    createdAt: timestamp("created_at")
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("notifications_user_id_idx").on(table.userId),
    index("notifications_is_read_idx").on(table.isRead),
  ]
);

export type Notification = typeof notifications.$inferSelect;
export type NewNotification = typeof notifications.$inferInsert;

// Points Transactions Table
export const pointsTransactions = pgTable(
  "points_transactions",
  {
    id: serial("id").primaryKey(),

    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),

    points: integer("points").notNull(),

    activity: pointsActivityEnum("activity").notNull(),

    description: text("description").notNull(),

    referenceId: integer("reference_id"),

    createdBy: integer("created_by").references(() => users.id, {
      onDelete: "set null",
    }),

    createdAt: timestamp("created_at")
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("points_transactions_user_id_idx").on(table.userId),
    index("points_transactions_activity_idx").on(table.activity),
    index("points_transactions_created_at_idx").on(table.createdAt),
    // Partial unique indexes to safely prevent duplicate automatic bonuses
    uniqueIndex("points_tx_registration_unique")
      .on(table.userId, table.activity)
      .where(sql`${table.activity} = 'REGISTRATION'`),
    uniqueIndex("points_tx_feedback_unique")
      .on(table.activity, table.referenceId)
      .where(sql`${table.activity} = 'FEEDBACK' AND ${table.referenceId} IS NOT NULL`),
    uniqueIndex("points_tx_ticket_created_unique")
      .on(table.activity, table.referenceId)
      .where(sql`${table.activity} = 'TICKET_CREATED' AND ${table.referenceId} IS NOT NULL`),
    uniqueIndex("points_tx_ticket_opened_unique")
      .on(table.activity, table.referenceId)
      .where(sql`${table.activity} = 'TICKET_OPENED' AND ${table.referenceId} IS NOT NULL`),
    uniqueIndex("points_tx_ticket_resolved_unique")
      .on(table.activity, table.referenceId)
      .where(sql`${table.activity} = 'TICKET_RESOLVED' AND ${table.referenceId} IS NOT NULL`),
  ]
);

export type PointsTransaction = typeof pointsTransactions.$inferSelect;
export type NewPointsTransaction = typeof pointsTransactions.$inferInsert;

// Feedbacks Table
export const feedbacks = pgTable(
  "feedbacks",
  {
    id: serial("id").primaryKey(),

    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),

    rating: integer("rating").notNull(),

    comment: text("comment").notNull(),

    status: feedbackStatusEnum("status")
      .default("pending")
      .notNull(),

    createdAt: timestamp("created_at")
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("feedbacks_user_id_idx").on(table.userId),
    index("feedbacks_status_idx").on(table.status),
    index("feedbacks_created_at_idx").on(table.createdAt),
  ]
);

export type Feedback = typeof feedbacks.$inferSelect;
export type NewFeedback = typeof feedbacks.$inferInsert;





