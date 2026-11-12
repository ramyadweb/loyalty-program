import { eq, and, gte, lte, desc, sql, type SQL } from "drizzle-orm";
import { db } from "../../config/db.js";
import { auditLogs, type AuditLog, type NewAuditLog } from "../../db/schema.js";
import type { GetAuditLogsQuery } from "./audit.validation.js";

/**
 * Return type interface for getAllAuditLogs with pagination metadata
 */
export interface PaginatedAuditLogsResult {
  logs: AuditLog[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

// ─── 1. Create Audit Log ──────────────────────────────────────────────────────
/**
 * Inserts a new audit log entry into PostgreSQL.
 * Called internally across authentication, admin, and other modules.
 *
 * @param data - The audit log entry to record (actor, target, activity type, IP)
 * @returns The newly created audit log row from the database
 */
export const createAuditLog = async (data: NewAuditLog): Promise<AuditLog> => {
  try {
    const [newLog] = await db
      .insert(auditLogs)
      .values(data)
      .returning();

    if (!newLog) {
      throw new Error("Failed to create audit log entry in database.");
    }

    return newLog;
  } catch (error) {
    console.error("Error creating audit log in database:", error);
    throw error;
  }
};

// ─── 2. Get All Audit Logs (with Filtering & Pagination) ──────────────────────
/**
 * Retrieves audit logs sorted from newest to oldest.
 * Supports dynamic filtering by activityType, userId, actorId, and date range,
 * as well as page-based pagination.
 *
 * @param query - Validated query parameters from GET /api/audit
 * @returns The matching audit logs and pagination metadata (total, totalPages, etc.)
 */
export const getAllAuditLogs = async (
  query: GetAuditLogsQuery
): Promise<PaginatedAuditLogsResult> => {
  const { page, limit, activityType, userId, actorId, startDate, endDate } = query;

  // 1. Calculate offset: skip records from previous pages
  const offset = (page - 1) * limit;

  // 2. Build dynamic filter conditions
  const conditions: SQL[] = [];

  // Filter by activity type (LOGIN, LOGOUT, USER_APPROVED, USER_REJECTED)
  if (activityType) {
    conditions.push(eq(auditLogs.activityType, activityType));
  }

  // Filter by affected user's ID
  if (userId !== undefined) {
    conditions.push(eq(auditLogs.userId, userId));
  }

  // Filter by actor's ID (the user or admin who performed the action)
  if (actorId !== undefined) {
    conditions.push(eq(auditLogs.actorId, actorId));
  }

  // Filter by start date (createdAt >= startDate)
  if (startDate) {
    conditions.push(gte(auditLogs.createdAt, startDate));
  }

  // Filter by end date (createdAt <= endDate)
  if (endDate) {
    // If endDate is provided without specific time (midnight),
    // extend it to the end of that day (23:59:59.999) to include all logs on that day
    const adjustedEndDate = new Date(endDate);
    if (
      adjustedEndDate.getUTCHours() === 0 &&
      adjustedEndDate.getUTCMinutes() === 0 &&
      adjustedEndDate.getUTCSeconds() === 0 &&
      adjustedEndDate.getUTCMilliseconds() === 0
    ) {
      adjustedEndDate.setUTCHours(23, 59, 59, 999);
    }
    conditions.push(lte(auditLogs.createdAt, adjustedEndDate));
  }

  // Combine conditions with SQL AND if any exist
  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  // 3. Count total matching records for pagination
  const [countResult] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(auditLogs)
    .where(whereClause);

  const total = Number(countResult?.count ?? 0);
  const totalPages = Math.ceil(total / limit) || 1;

  // 4. Retrieve paginated audit logs, ordered by newest first
  const logs = await db
    .select()
    .from(auditLogs)
    .where(whereClause)
    .orderBy(desc(auditLogs.createdAt))
    .limit(limit)
    .offset(offset);

  return {
    logs,
    pagination: {
      total,
      page,
      limit,
      totalPages,
    },
  };
};

// ─── 3. Get Audit Log By ID ───────────────────────────────────────────────────
/**
 * Retrieves a single audit log by its unique primary key ID.
 *
 * @param id - The positive integer ID of the audit log
 * @returns The matching AuditLog record, or null if not found
 */
export const getAuditLogById = async (id: number): Promise<AuditLog | null> => {
  const [log] = await db
    .select()
    .from(auditLogs)
    .where(eq(auditLogs.id, id))
    .limit(1);

  return log || null;
};
