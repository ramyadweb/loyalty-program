import { Router } from "express";

import {
    createUserRewardController,
    getAllUserRewardsController,
    getMyRewardsController,
    getUserRewardByIdController,
    updateUserRewardStatusController,
    deleteUserRewardController,
} from "./user-reward.controller.js";

import { authenticateToken } from "../../middleware/auth.middleware.js";
import { authorizeRole } from "../../middleware/role.middleware.js";

const router = Router();

// All user reward routes require authentication
router.use(authenticateToken);

// 1. Redeem a reward (POST /api/user-rewards or POST /api/user-rewards/redeem/:rewardId)
router.post(
    "/",
    authorizeRole("user"),
    createUserRewardController
);
router.post(
    "/redeem/:rewardId",
    authorizeRole("user"),
    createUserRewardController
);

// 2. Get all user rewards (GET /api/user-rewards - Admin only)
router.get(
    "/",
    authorizeRole("admin"),
    getAllUserRewardsController
);

// 3. Get logged-in user's rewards (GET /api/user-rewards/my-rewards)
router.get(
    "/my-rewards",
    authorizeRole("user"),
    getMyRewardsController
);

// 4. Get user reward by ID (GET /api/user-rewards/:id)
router.get(
    "/:id",
    getUserRewardByIdController
);

// 5. Approve or reject a user reward (PATCH /api/user-rewards/:id/status or PATCH /api/user-rewards/:id - Admin only)
router.patch(
    "/:id/status",
    authorizeRole("admin"),
    updateUserRewardStatusController
);
router.patch(
    "/:id",
    authorizeRole("admin"),
    updateUserRewardStatusController
);

// 6. Delete user reward (DELETE /api/user-rewards/:id - Admin only)
router.delete(
    "/:id",
    authorizeRole("admin"),
    deleteUserRewardController
);

export default router;
