import { z } from "zod";

// ─── 1. Route Parameter Validation for GET /api/audit/:id ────────────────────
export const auditIdParamSchema = z.object({
  id: z
    .string()
    .regex(/^\d+$/, "Audit log ID must be a valid positive integer")
    .transform((val) => parseInt(val, 10)),
});

export type AuditIdParam = z.infer<typeof auditIdParamSchema>;

// ─── 2. Query Parameters Validation for GET /api/audit ───────────────────────
export const getAuditLogsQuerySchema = z
  .object({
    // Page number: defaults to 1, minimum is 1
    page: z
      .string()
      .optional()
      .default("1")
      .transform((val) => {
        const parsed = parseInt(val, 10);
        return isNaN(parsed) || parsed < 1 ? 1 : parsed;
      }),

    // Page size: defaults to 10, minimum is 1, maximum is 100
    limit: z
      .string()
      .optional()
      .default("10")
      .transform((val) => {
        const parsed = parseInt(val, 10);
        return isNaN(parsed) || parsed < 1 ? 10 : Math.min(parsed, 100);
      }),

    // Filter by activity type
    activityType: z
      .enum([
        "LOGIN",
        "LOGOUT",
        "USER_APPROVED",
        "USER_REJECTED",
        "POINTS_AWARDED",
        "FEEDBACK_APPROVED",
        "FEEDBACK_REJECTED",
      ])
      .or(z.literal(""))
      .optional()
      .transform((val) => (val === "" ? undefined : val)),

    // Filter by affected user's ID (positive integer)
    userId: z
      .string()
      .trim()
      .optional()
      .refine((val) => !val || /^\d+$/.test(val), {
        message: "userId must be a positive integer",
      })
      .transform((val) => (val ? parseInt(val, 10) : undefined)),

    // Filter by actor's ID (admin or user who performed the action)
    actorId: z
      .string()
      .trim()
      .optional()
      .refine((val) => !val || /^\d+$/.test(val), {
        message: "actorId must be a positive integer",
      })
      .transform((val) => (val ? parseInt(val, 10) : undefined)),

    // Filter by start date range (valid date string parsed to Date)
    startDate: z
      .string()
      .trim()
      .optional()
      .refine((val) => !val || !isNaN(Date.parse(val)), {
        message: "startDate must be a valid date format (e.g. 2026-11-01)",
      })
      .transform((val) => (val ? new Date(val) : undefined)),

    // Filter by end date range (valid date string parsed to Date)
    endDate: z
      .string()
      .trim()
      .optional()
      .refine((val) => !val || !isNaN(Date.parse(val)), {
        message: "endDate must be a valid date format (e.g. 2026-11-30)",
      })
      .transform((val) => (val ? new Date(val) : undefined)),
  })
  // Validate that startDate is not later than endDate when both are provided
  .refine(
    (data) => {
      if (data.startDate && data.endDate) {
        return data.startDate <= data.endDate;
      }
      return true;
    },
    {
      message: "startDate cannot be later than endDate",
      path: ["startDate"],
    }
  );

export type GetAuditLogsQuery = z.infer<typeof getAuditLogsQuerySchema>;

