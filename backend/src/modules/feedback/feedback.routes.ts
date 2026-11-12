import { Router } from "express";
import {
  createFeedbackController,
  getMyFeedbackController,
  getAllFeedbackController,
  approveFeedbackController,
  rejectFeedbackController,
} from "./feedback.controller.js";
import {
  createFeedbackSchema,
  feedbackIdParamSchema,
} from "./feedback.validation.js";
import { authenticateToken } from "../../middleware/auth.middleware.js";
import { authorizeRole } from "../../middleware/role.middleware.js";
import { validate } from "../../middleware/validate.middleware.js";

const feedbackRouter = Router();

// All feedback routes require a valid JWT token
feedbackRouter.use(authenticateToken);

// ─── User-Facing Endpoints ────────────────────────────────────────────────────

// API 1: User Submits Feedback
feedbackRouter.post(
  "/",
  authorizeRole("user"),
  validate(createFeedbackSchema),
  createFeedbackController
);

// API 2: User Views Own Feedback
feedbackRouter.get(
  "/my-feedback",
  authorizeRole("user"),
  getMyFeedbackController
);

// ─── Admin Endpoints ──────────────────────────────────────────────────────────

// API 3: Admin Views All Feedback (with pagination & status filter)
feedbackRouter.get(
  "/",
  authorizeRole("admin"),
  getAllFeedbackController
);

// API 4: Admin Approves Feedback (Awards 20 points)
feedbackRouter.patch(
  "/:id/approve",
  authorizeRole("admin"),
  validate(feedbackIdParamSchema),
  approveFeedbackController
);

// API 5: Admin Rejects Feedback
feedbackRouter.patch(
  "/:id/reject",
  authorizeRole("admin"),
  validate(feedbackIdParamSchema),
  rejectFeedbackController
);

export default feedbackRouter;

