
import { Router } from "express";

import {
    getDashboardSummaryController,
    getUserStatisticsController,
    getRewardStatisticsController,
    getRedemptionStatisticsController,
    getTicketStatisticsController,
    getAuditStatisticsController,
} from "./report.controller.js";

import { authenticateToken } from "../../middleware/auth.middleware.js";
import { authorizeRole } from "../../middleware/role.middleware.js";

const router = Router();

// All Reports APIs require authentication and admin role
router.use(authenticateToken);
router.use(authorizeRole("admin"));

// 1. Dashboard Summary
router.get("/dashboard", getDashboardSummaryController);

// 2. User Statistics
router.get("/users", getUserStatisticsController);

// 3. Reward Statistics
router.get("/rewards", getRewardStatisticsController);

// 4. Redemption Statistics
router.get("/redemptions", getRedemptionStatisticsController);

// 5. Ticket Statistics
router.get("/tickets", getTicketStatisticsController);

// 6. Audit Statistics
router.get("/audit", getAuditStatisticsController);

export default router;
