import type { Request, Response } from "express";
import {
  userIdParamSchema,
  getUsersQuerySchema,
  getPendingUsersQuerySchema,
} from "./admin.validation.js";
import {
  getPendingUsersService,
  getAllUsersService,
  getUserByIdService,
  approveUserService,
  rejectUserService,
  getRecentUsersService,
} from "./admin.service.js";
import { createAuditLog } from "../audit/audit.service.js";

// ─── API 1: Get Pending Users ───────────────────────────────────────────────

export const getPendingUsers = async (req: Request, res: Response) => {
  try {
    const validationResult = getPendingUsersQuerySchema.safeParse(req.query);

    if (!validationResult.success) {
      return res.status(400).json({
        success: false,
        message: "Invalid query parameters.",
        errors: validationResult.error.flatten().fieldErrors,
      });
    }

    const result = await getPendingUsersService(validationResult.data);

    return res.status(200).json({
      success: true,
      message: "Pending users retrieved successfully.",
      data: result.users,
      pagination: result.pagination,
    });
  } catch (error) {
    console.error("Get Pending Users Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error.",
    });
  }
};

// ─── API 2: Get All Users (with pagination, filter & search) ────────────────

export const getAllUsers = async (req: Request, res: Response) => {
  try {
    const validationResult = getUsersQuerySchema.safeParse(req.query);

    if (!validationResult.success) {
      return res.status(400).json({
        success: false,
        message: "Invalid query parameters.",
        errors: validationResult.error.flatten().fieldErrors,
      });
    }

    const result = await getAllUsersService(validationResult.data);

    return res.status(200).json({
      success: true,
      message: "Users retrieved successfully.",
      data: result.users,
      pagination: result.pagination,
    });
  } catch (error) {
    console.error("Get All Users Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error.",
    });
  }
};

// ─── API 3: Get User By ID ──────────────────────────────────────────────────

export const getUserById = async (req: Request, res: Response) => {
  try {
    const paramValidation = userIdParamSchema.safeParse(req.params);

    if (!paramValidation.success) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID parameter. Must be a positive integer.",
        errors: paramValidation.error.flatten().fieldErrors,
      });
    }

    const user = await getUserByIdService(paramValidation.data.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "User retrieved successfully.",
      data: user,
    });
  } catch (error) {
    console.error("Get User By ID Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error.",
    });
  }
};

// ─── API 4: Approve User ────────────────────────────────────────────────────

export const approveUser = async (req: Request, res: Response) => {
  try {
    const paramValidation = userIdParamSchema.safeParse(req.params);

    if (!paramValidation.success) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID parameter.",
        errors: paramValidation.error.flatten().fieldErrors,
      });
    }

    const admin = req.user;
    if (!admin) {
      return res.status(401).json({
        success: false,
        message: "Authentication required before approving user accounts.",
      });
    }

    const result = await approveUserService(paramValidation.data.id, admin.id);

    if (!result.success || !result.data) {
      return res.status(result.statusCode).json({
        success: false,
        message: result.message,
      });
    }

    // Record USER_APPROVED audit log in PostgreSQL
    await createAuditLog({
      userId: result.data.id,
      actorId: admin.id,
      actorEmail: admin.email,
      targetUserId: result.data.id,
      targetUserEmail: result.data.email,
      activityType: "USER_APPROVED",
      ipAddress: req.ip || null,
    });

    return res.status(result.statusCode).json({
      success: true,
      message: result.message,
      data: result.data,
    });
  } catch (error) {
    console.error("Approve User Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error.",
    });
  }
};

// ─── API 5: Reject User ─────────────────────────────────────────────────────

export const rejectUser = async (req: Request, res: Response) => {
  try {
    const paramValidation = userIdParamSchema.safeParse(req.params);

    if (!paramValidation.success) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID parameter.",
        errors: paramValidation.error.flatten().fieldErrors,
      });
    }

    const admin = req.user;
    if (!admin) {
      return res.status(401).json({
        success: false,
        message: "Authentication required before rejecting user accounts.",
      });
    }

    const result = await rejectUserService(paramValidation.data.id, admin.id);

    if (!result.success || !result.data) {
      return res.status(result.statusCode).json({
        success: false,
        message: result.message,
      });
    }

    // Record USER_REJECTED audit log in PostgreSQL
    await createAuditLog({
      userId: result.data.id,
      actorId: admin.id,
      actorEmail: admin.email,
      targetUserId: result.data.id,
      targetUserEmail: result.data.email,
      activityType: "USER_REJECTED",
      ipAddress: req.ip || null,
    });

    return res.status(result.statusCode).json({
      success: true,
      message: result.message,
      data: result.data,
    });
  } catch (error) {
    console.error("Reject User Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error.",
    });
  }
};

// ─── API 6: Get Recent Registered Users ─────────────────────────────────────

export const getRecentUsers = async (req: Request, res: Response) => {
  try {
    const limit = Number(req.query.limit) || 10;
    const recentUsers = await getRecentUsersService(limit);

    return res.status(200).json({
      success: true,
      message: "Recent users retrieved successfully.",
      data: recentUsers,
    });
  } catch (error) {
    console.error("Get Recent Users Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error.",
    });
  }
};


