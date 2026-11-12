
import { Router } from "express";

import {
    createRedemptionController,
    getAllRedemptionsController,
    getMyRedemptionsController,
    getRedemptionByIdController,
    validateRedemptionController,
    completeRedemptionController,
} from "./reward-redemption.controller.js";

import {
    createRedemptionSchema,
    redemptionIdSchema,
} from "./reward-redemption.validation.js";

import { validate } from "../../middleware/validate.middleware.js";
import { authenticateToken } from "../../middleware/auth.middleware.js";
import { authorizeRole } from "../../middleware/role.middleware.js";

const router = Router();

// All routes require authentication
router.use(authenticateToken);

// 1. User: Generate redemption code
router.post(
    "/",
    authorizeRole("user"),
    validate(createRedemptionSchema),
    createRedemptionController
);

// 2. Admin: Get all redemptions
router.get(
    "/",
    authorizeRole("admin"),
    getAllRedemptionsController
);

// 3. User: Get logged-in user's redemptions
router.get(
    "/my-redemptions",
    authorizeRole("user"),
    getMyRedemptionsController
);

// 4. User/Admin: Get redemption by ID
router.get(
    "/:id",
    validate(redemptionIdSchema),
    getRedemptionByIdController
);

// 5. Admin: Validate redemption
router.post(
    "/:id/validate",
    authorizeRole("admin"),
    validate(redemptionIdSchema),
    validateRedemptionController
);

// 6. Admin: Complete redemption
router.patch(
    "/:id/complete",
    authorizeRole("admin"),
    validate(redemptionIdSchema),
    completeRedemptionController
);

export default router;
