
import type { Request, Response } from "express";

import {
    createRedemption,
    getAllRedemptions,
    getMyRedemptions,
    getRedemptionById,
    validateRedemption,
    completeRedemption,
} from "./reward-redemption.service.js";

// 1. Create Redemption
export const createRedemptionController = async (
    req: Request,
    res: Response
) => {
    try {
        if (req.user?.role === "admin") {
            return res.status(403).json({
                success: false,
                message: "Administrators cannot redeem rewards or generate voucher codes.",
            });
        }

        //Step 1: Check authentication
        const userId = Number(req.user?.id);

        if (!Number.isInteger(userId) || userId <= 0) {
            return res.status(401).json({
                success: false,
                message: "User authentication required.",
            });
        }

        // Step 2: Validate request body
        const userRewardId = Number(req.body?.userRewardId);

        if (
            !Number.isInteger(userRewardId) ||
            userRewardId <= 0
        ) {
            return res.status(400).json({
                success: false,
                message: "Valid user reward ID is required.",
            });
        }

        if (!Number.isInteger(userId) || userId <= 0) {
            return res.status(401).json({
                success: false,
                message: "User authentication required.",
            });
        }

        const result = await createRedemption(
            userId,
            userRewardId
        );

        return res.status(201).json({
            success: true,
            message: "Redemption code generated successfully.",
            data: result,
        });
    } catch (error) {
        return res.status(400).json({
            success: false,
            message:
                error instanceof Error
                    ? error.message
                    : "Failed to generate redemption code.",
        });
    }
};


// 2. Get All Redemptions (Admin)
export const getAllRedemptionsController = async (
    req: Request,
    res: Response
) => {
    try {
        const result = await getAllRedemptions();

        return res.status(200).json({
            success: true,
            message: "Redemptions retrieved successfully.",
            data: result,
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message:
                error instanceof Error
                    ? error.message
                    : "Failed to retrieve redemptions.",
        });
    }
};


// 3. Get My Redemptions
export const getMyRedemptionsController = async (
    req: Request,
    res: Response
) => {
    try {
        const userId = Number(req.user?.id);

        if (!Number.isInteger(userId) || userId <= 0) {
            return res.status(401).json({
                success: false,
                message: "User authentication required.",
            });
        }

        const result = await getMyRedemptions(userId);

        return res.status(200).json({
            success: true,
            message: "Your redemptions retrieved successfully.",
            data: result,
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message:
                error instanceof Error
                    ? error.message
                    : "Failed to retrieve your redemptions.",
        });
    }
};


// 4. Get Redemption By ID
export const getRedemptionByIdController = async (
    req: Request,
    res: Response
) => {
    try {
        const id = Number(req.params.id);

        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({
                success: false,
                message: "Invalid redemption ID.",
            });
        }

        const result = await getRedemptionById(id);

        if (!result) {
            return res.status(404).json({
                success: false,
                message: "Redemption not found.",
            });
        }

        // Users can only view their own redemptions
        if (
            req.user?.role !== "admin" &&
            Number(req.user?.id) !== result.userId
        ) {
            return res.status(403).json({
                success: false,
                message: "You are not authorized to view this redemption.",
            });
        }

        return res.status(200).json({
            success: true,
            message: "Redemption retrieved successfully.",
            data: result,
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message:
                error instanceof Error
                    ? error.message
                    : "Failed to retrieve redemption.",
        });
    }
};


// 5. Validate Redemption (Admin)
export const validateRedemptionController = async (
    req: Request,
    res: Response
) => {
    try {
        const id = Number(req.params.id);

        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({
                success: false,
                message: "Invalid redemption ID.",
            });
        }

        const result = await validateRedemption(id);

        return res.status(200).json({
            success: true,
            message: "Redemption code is valid.",
            data: result,
        });
    } catch (error) {
        return res.status(400).json({
            success: false,
            message:
                error instanceof Error
                    ? error.message
                    : "Failed to validate redemption.",
        });
    }
};


// 6. Complete Redemption (Admin)
export const completeRedemptionController = async (
    req: Request,
    res: Response
) => {
    try {
        const id = Number(req.params.id);

        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({
                success: false,
                message: "Invalid redemption ID.",
            });
        }

        const result = await completeRedemption(id);

        return res.status(200).json({
            success: true,
            message: "Redemption completed successfully.",
            data: result,
        });
    } catch (error) {
        return res.status(400).json({
            success: false,
            message:
                error instanceof Error
                    ? error.message
                    : "Failed to complete redemption.",
        });
    }
};
