import type { Request, Response } from "express";
import {
  awardAdminBonusService,
  getUserPointsBalanceService,
  getUserPointsHistoryService,
  getAllPointsTransactionsService,
  getUserPointsTransactionsForAdminService,
} from "./points.service.js";
import {
  awardPointsSchema,
  userIdParamSchema,
  getTransactionsQuerySchema,
} from "./points.validation.js";

// ─── 1. Admin: Award Bonus Points (POST /api/points/award) ────────────────────

export const awardPointsController = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    const admin = req.user;

    if (!admin) {
      return res.status(401).json({
        success: false,
        message: "Authentication required.",
      });
    }

    const validationResult = awardPointsSchema.safeParse(req.body);

    if (!validationResult.success) {
      return res.status(400).json({
        success: false,
        message: "Validation failed.",
        errors: validationResult.error.flatten().fieldErrors,
      });
    }

    const result = await awardAdminBonusService(
      admin.id,
      admin.email,
      validationResult.data,
      req.ip || undefined
    );

    return res.status(result.statusCode).json({
      success: result.success,
      message: result.message,
      data: result.data,
    });
  } catch (error) {
    console.error("Award Points Controller Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error while awarding points.",
    });
  }
};

// ─── 2. User: Get My Points Balance (GET /api/points/my-balance) ──────────────

export const getMyBalanceController = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    if (req.user?.role === "admin") {
      return res.status(403).json({
        success: false,
        message: "Administrator accounts do not participate in loyalty points.",
      });
    }

    const userId = Number(req.user?.id);

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required.",
      });
    }

    const result = await getUserPointsBalanceService(userId);

    return res.status(result.statusCode).json({
      success: result.success,
      message: result.message,
      data: result.data,
    });
  } catch (error) {
    console.error("Get My Balance Controller Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error while retrieving points balance.",
    });
  }
};

// ─── 3. User: Get My Points History (GET /api/points/my-history) ──────────────

export const getMyHistoryController = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    if (req.user?.role === "admin") {
      return res.status(403).json({
        success: false,
        message: "Administrator accounts do not participate in loyalty points.",
      });
    }

    const userId = Number(req.user?.id);

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required.",
      });
    }

    const page = Math.max(1, parseInt(req.query.page as string, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string, 10) || 10));

    const result = await getUserPointsHistoryService(userId, page, limit);

    return res.status(result.statusCode).json({
      success: result.success,
      message: result.message,
      data: result.data,
      pagination: result.pagination,
    });
  } catch (error) {
    console.error("Get My History Controller Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error while retrieving points history.",
    });
  }
};

// ─── 4. Admin: Get All Points Transactions (GET /api/points/all-transactions) ─

export const getAllTransactionsController = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    const queryValidation = getTransactionsQuerySchema.safeParse(req.query);

    if (!queryValidation.success) {
      return res.status(400).json({
        success: false,
        message: "Invalid query parameters.",
        errors: queryValidation.error.flatten().fieldErrors,
      });
    }

    const result = await getAllPointsTransactionsService(queryValidation.data);

    return res.status(result.statusCode).json({
      success: result.success,
      message: result.message,
      data: result.data,
      pagination: result.pagination,
    });
  } catch (error) {
    console.error("Get All Transactions Controller Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error while retrieving transactions.",
    });
  }
};

// ─── 5. Admin: Get User Points Details (GET /api/points/user/:userId) ─────────

export const getUserTransactionsForAdminController = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    const paramValidation = userIdParamSchema.safeParse(req.params);

    if (!paramValidation.success) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID parameter.",
        errors: paramValidation.error.flatten().fieldErrors,
      });
    }

    const queryValidation = getTransactionsQuerySchema.safeParse(req.query);
    const queryData = queryValidation.success
      ? queryValidation.data
      : { page: 1, limit: 10 };

    const result = await getUserPointsTransactionsForAdminService(
      paramValidation.data.userId,
      queryData
    );

    return res.status(result.statusCode).json({
      success: result.success,
      message: result.message,
      data: result.data,
      pagination: result.pagination,
    });
  } catch (error) {
    console.error("Get User Transactions For Admin Controller Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error while retrieving user points.",
    });
  }
};

