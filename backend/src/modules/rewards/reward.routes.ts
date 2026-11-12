import { Router } from "express";

import {
    createRewardController,
    getAllRewardsController,
    getRewardByIdController,
    updateRewardController,
    deleteRewardController,
} from "./reward.controller.js";

import { authenticateToken } from "../../middleware/auth.middleware.js";
import { authorizeRole } from "../../middleware/role.middleware.js";

const router = Router();

// Create Reward - Admin Only
router.post(
    "/",
    authenticateToken,
    authorizeRole("admin"),
    createRewardController
);

// Get All Rewards - Authenticated Users
router.get(
    "/",
    authenticateToken,
    getAllRewardsController
);

// Get Reward By ID - Authenticated Users
router.get(
    "/:id",
    authenticateToken,
    getRewardByIdController
);

// Update Reward - Admin Only
router.patch(
    "/:id",
    authenticateToken,
    authorizeRole("admin"),
    updateRewardController
);

// Delete Reward - Admin Only
router.delete(
    "/:id",
    authenticateToken,
    authorizeRole("admin"),
    deleteRewardController
);

export default router;
