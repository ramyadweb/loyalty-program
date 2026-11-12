
import { Router } from "express";

import {
    adminDashboardStats,
    recentUserActivities,
} from "./dashboard.controller.js";

import { authenticateToken } from "../../middleware/auth.middleware.js";
import { authorizeRole } from "../../middleware/role.middleware.js";

const router = Router();

// Admin Dashboard Statistics
router.get(
    "/admin/stats",
    authenticateToken,
    authorizeRole("admin"),
    adminDashboardStats
);

// Recent User Activities
router.get(
    "/admin/recent-activities",
    authenticateToken,
    authorizeRole("admin"),
    recentUserActivities
);

export default router;
