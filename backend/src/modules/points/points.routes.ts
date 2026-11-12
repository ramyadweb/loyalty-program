import { Router } from "express";
import {
  awardPointsController,
  getMyBalanceController,
  getMyHistoryController,
  getAllTransactionsController,
  getUserTransactionsForAdminController,
} from "./points.controller.js";
import { awardPointsSchema } from "./points.validation.js";
import { authenticateToken } from "../../middleware/auth.middleware.js";
import { authorizeRole } from "../../middleware/role.middleware.js";
import { validate } from "../../middleware/validate.middleware.js";

const pointsRouter = Router();

// All points routes require a valid JWT token
pointsRouter.use(authenticateToken);

// ─── User-Facing Endpoints ────────────────────────────────────────────────────

// API 1: Get Logged-in User's Points Balance (Users only, admins blocked)
pointsRouter.get("/my-balance", authorizeRole("user"), getMyBalanceController);

// API 2: Get Logged-in User's Points History (Users only, admins blocked)
pointsRouter.get("/my-history", authorizeRole("user"), getMyHistoryController);

// ─── Admin Endpoints ──────────────────────────────────────────────────────────

// API 3: Admin Manually Awards Points
pointsRouter.post(
  "/award",
  authorizeRole("admin"),
  validate(awardPointsSchema),
  awardPointsController
);

// API 4: Admin Views All Points Transactions (with pagination & search)
pointsRouter.get(
  "/all-transactions",
  authorizeRole("admin"),
  getAllTransactionsController
);

// API 5: Admin Views Specific User's Points History & Balance
pointsRouter.get(
  "/user/:userId",
  authorizeRole("admin"),
  getUserTransactionsForAdminController
);

export default pointsRouter;

