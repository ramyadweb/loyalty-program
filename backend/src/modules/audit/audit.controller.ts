import type { Request, Response } from "express";
import {
  auditIdParamSchema,
  getAuditLogsQuerySchema,
} from "./audit.validation.js";
import {
  getAllAuditLogs,
  getAuditLogById,
} from "./audit.service.js";

// ─── 1. Get All Audit Logs Controller ─────────────────────────────────────────
/**
 * GET /api/audit
 * Retrieves audit logs with optional filters (activityType, userId, actorId, date range)
 * and pagination metadata (page, limit, total, totalPages).
 */
export const getAllAuditLogsController = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    // 1. Validate query parameters using Zod schema
    const validationResult = getAuditLogsQuerySchema.safeParse(req.query);

    if (!validationResult.success) {
      return res.status(400).json({
        success: false,
        message: "Invalid query parameters.",
        errors: validationResult.error.flatten().fieldErrors,
      });
    }

    // 2. Fetch paginated audit logs from the service layer
    const result = await getAllAuditLogs(validationResult.data);

    // 3. Return HTTP 200 with logs and pagination details
    return res.status(200).json({
      success: true,
      message: "Audit logs retrieved successfully",
      data: {
        logs: result.logs,
        pagination: result.pagination,
      },
    });
  } catch (error) {
    console.error("Get All Audit Logs Controller Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error.",
    });
  }
};

// ─── 2. Get Audit Log By ID Controller ───────────────────────────────────────
/**
 * GET /api/audit/:id
 * Retrieves a single audit log entry by its primary key ID.
 */
export const getAuditLogByIdController = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    // 1. Validate route parameter (:id) using Zod schema
    const paramValidation = auditIdParamSchema.safeParse(req.params);

    if (!paramValidation.success) {
      return res.status(400).json({
        success: false,
        message: "Invalid audit log ID parameter.",
        errors: paramValidation.error.flatten().fieldErrors,
      });
    }

    // 2. Retrieve the audit log record from the service layer
    const log = await getAuditLogById(paramValidation.data.id);

    // 3. If no record was found, return HTTP 404
    if (!log) {
      return res.status(404).json({
        success: false,
        message: "Audit log not found.",
      });
    }

    // 4. Return HTTP 200 with the matching audit log
    return res.status(200).json({
      success: true,
      message: "Audit log retrieved successfully",
      data: log,
    });
  } catch (error) {
    console.error("Get Audit Log By ID Controller Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error.",
    });
  }
};

