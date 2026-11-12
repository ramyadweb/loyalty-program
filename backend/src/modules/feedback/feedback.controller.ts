import type { Request, Response } from "express";
import {
  createFeedbackService,
  getMyFeedbackService,
  getAllFeedbackService,
  approveFeedbackService,
  rejectFeedbackService,
} from "./feedback.service.js";
import {
  createFeedbackSchema,
  feedbackIdParamSchema,
  getFeedbackQuerySchema,
} from "./feedback.validation.js";

// ─── 1. User: Submit Feedback (POST /api/feedback) ────────────────────────────

export const createFeedbackController = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    if (req.user?.role === "admin") {
      return res.status(403).json({
        success: false,
        message: "Administrators cannot submit feedback for loyalty points.",
      });
    }

    const userId = Number(req.user?.id);

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required.",
      });
    }

    const validationResult = createFeedbackSchema.safeParse(req.body);

    if (!validationResult.success) {
      return res.status(400).json({
        success: false,
        message: "Validation failed.",
        errors: validationResult.error.flatten().fieldErrors,
      });
    }

    const result = await createFeedbackService(userId, validationResult.data);

    return res.status(result.statusCode).json({
      success: result.success,
      message: result.message,
      data: result.data,
    });
  } catch (error) {
    console.error("Create Feedback Controller Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error while submitting feedback.",
    });
  }
};

// ─── 2. User: View Own Feedback (GET /api/feedback/my-feedback) ───────────────

export const getMyFeedbackController = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    const userId = Number(req.user?.id);

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required.",
      });
    }

    const result = await getMyFeedbackService(userId);

    return res.status(result.statusCode).json({
      success: result.success,
      message: result.message,
      data: result.data,
    });
  } catch (error) {
    console.error("Get My Feedback Controller Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error while retrieving your feedback.",
    });
  }
};

// ─── 3. Admin: View All Feedback (GET /api/feedback) ──────────────────────────

export const getAllFeedbackController = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    const queryValidation = getFeedbackQuerySchema.safeParse(req.query);

    if (!queryValidation.success) {
      return res.status(400).json({
        success: false,
        message: "Invalid query parameters.",
        errors: queryValidation.error.flatten().fieldErrors,
      });
    }

    const result = await getAllFeedbackService(queryValidation.data);

    return res.status(result.statusCode).json({
      success: result.success,
      message: result.message,
      data: result.data,
      pagination: result.pagination,
    });
  } catch (error) {
    console.error("Get All Feedback Controller Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error while retrieving feedback records.",
    });
  }
};

// ─── 4. Admin: Approve Feedback (PATCH /api/feedback/:id/approve) ─────────────

export const approveFeedbackController = async (
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

    const paramValidation = feedbackIdParamSchema.safeParse(req.params);

    if (!paramValidation.success) {
      return res.status(400).json({
        success: false,
        message: "Invalid feedback ID parameter.",
        errors: paramValidation.error.flatten().fieldErrors,
      });
    }

    const result = await approveFeedbackService(
      paramValidation.data.id,
      admin.id,
      admin.email,
      req.ip || undefined
    );

    return res.status(result.statusCode).json({
      success: result.success,
      message: result.message,
      data: result.data,
    });
  } catch (error) {
    console.error("Approve Feedback Controller Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error while approving feedback.",
    });
  }
};

// ─── 5. Admin: Reject Feedback (PATCH /api/feedback/:id/reject) ───────────────

export const rejectFeedbackController = async (
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

    const paramValidation = feedbackIdParamSchema.safeParse(req.params);

    if (!paramValidation.success) {
      return res.status(400).json({
        success: false,
        message: "Invalid feedback ID parameter.",
        errors: paramValidation.error.flatten().fieldErrors,
      });
    }

    const result = await rejectFeedbackService(
      paramValidation.data.id,
      admin.id,
      admin.email,
      req.ip || undefined
    );

    return res.status(result.statusCode).json({
      success: result.success,
      message: result.message,
      data: result.data,
    });
  } catch (error) {
    console.error("Reject Feedback Controller Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error while rejecting feedback.",
    });
  }
};

