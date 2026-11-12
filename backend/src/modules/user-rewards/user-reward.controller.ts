import type { Request, Response } from "express";

import {
    createUserReward,
    getAllUserRewards,
    getUserRewardsByUserId,
    getUserRewardById,
    updateUserRewardStatus,
    deleteUserReward,
} from "./user-reward.service.js";

import {
    createUserRewardSchema,
    updateUserRewardStatusSchema,
    userRewardIdSchema,
} from "./user-reward.validation.js";

// 1. Create / Redeem User Reward
export const createUserRewardController = async (
    req: Request,
    res: Response
) => {
    try {
        if (req.user?.role === "admin") {
            return res.status(403).json({
                success: false,
                message: "Administrators cannot claim or redeem rewards.",
            });
        }

        const payload = {
            ...req.body,
            rewardId: req.body?.rewardId ?? req.params?.rewardId,
        };

        const validation = createUserRewardSchema.safeParse(payload);

        if (!validation.success) {
            return res.status(400).json({
                success: false,
                message: "Validation failed.",
                errors: validation.error.flatten().fieldErrors,
            });
        }

        // Regular users redeem for themselves
        const targetUserId = req.user?.id;

        if (!targetUserId) {
            return res.status(401).json({
                success: false,
                message: "User authentication required.",
            });
        }

        const result = await createUserReward(
            Number(targetUserId),
            Number(validation.data.rewardId)
        );

        return res.status(201).json({
            success: true,
            message: "Reward redeemed successfully. Awaiting approval.",
            data: result,
        });
    } catch (error) {
        return res.status(400).json({
            success: false,
            message:
                error instanceof Error
                    ? error.message
                    : "Failed to redeem reward.",
        });
    }
};

// 2. Get All User Rewards (Admin)
export const getAllUserRewardsController = async (
    req: Request,
    res: Response
) => {
    try {
        const result = await getAllUserRewards();

        return res.status(200).json({
            success: true,
            message: "User rewards retrieved successfully.",
            data: result,
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message:
                error instanceof Error
                    ? error.message
                    : "Failed to retrieve user rewards.",
        });
    }
};

// 3. Get Logged-in User's Rewards
export const getMyRewardsController = async (
    req: Request,
    res: Response
) => {
    try {
        if (req.user?.role === "admin") {
            return res.status(403).json({
                success: false,
                message: "Administrator accounts do not have reward redemptions.",
            });
        }

        const userId = Number(req.user?.id);

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: "User authentication required.",
            });
        }

        const result = await getUserRewardsByUserId(userId);

        return res.status(200).json({
            success: true,
            message: "Your rewards retrieved successfully.",
            data: result,
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message:
                error instanceof Error
                    ? error.message
                    : "Failed to retrieve your rewards.",
        });
    }
};

// 4. Get User Reward By ID
export const getUserRewardByIdController = async (
    req: Request,
    res: Response
) => {
    try {
        const idValidation = userRewardIdSchema.safeParse(req.params);

        if (!idValidation.success) {
            return res.status(400).json({
                success: false,
                message: "Invalid user reward ID.",
                errors: idValidation.error.flatten().fieldErrors,
            });
        }

        const result = await getUserRewardById(idValidation.data.id);

        if (!result) {
            return res.status(404).json({
                success: false,
                message: "User reward not found.",
            });
        }

        // Non-admin users can only access their own records
        if (
            req.user?.role !== "admin" &&
            Number(req.user?.id) !== result.userId
        ) {
            return res.status(403).json({
                success: false,
                message: "You are not authorized to access this reward.",
            });
        }

        return res.status(200).json({
            success: true,
            message: "User reward retrieved successfully.",
            data: result,
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message:
                error instanceof Error
                    ? error.message
                    : "Failed to retrieve user reward.",
        });
    }
};

// 5. Approve or Reject User Reward (Admin)
export const updateUserRewardStatusController = async (
    req: Request,
    res: Response
) => {
    try {
        const idValidation = userRewardIdSchema.safeParse(req.params);

        if (!idValidation.success) {
            return res.status(400).json({
                success: false,
                message: "Invalid user reward ID.",
                errors: idValidation.error.flatten().fieldErrors,
            });
        }

        const bodyValidation = updateUserRewardStatusSchema.safeParse(req.body);

        if (!bodyValidation.success) {
            return res.status(400).json({
                success: false,
                message: "Status must be approved or rejected.",
                errors: bodyValidation.error.flatten().fieldErrors,
            });
        }

        const result = await updateUserRewardStatus(
            idValidation.data.id,
            bodyValidation.data.status
        );

        return res.status(200).json({
            success: true,
            message: `User reward ${bodyValidation.data.status} successfully.`,
            data: result,
        });
    } catch (error) {
        return res.status(400).json({
            success: false,
            message:
                error instanceof Error
                    ? error.message
                    : "Failed to update user reward status.",
        });
    }
};

// 6. Delete User Reward (Admin)
export const deleteUserRewardController = async (
    req: Request,
    res: Response
) => {
    try {
        const idValidation = userRewardIdSchema.safeParse(req.params);

        if (!idValidation.success) {
            return res.status(400).json({
                success: false,
                message: "Invalid user reward ID.",
                errors: idValidation.error.flatten().fieldErrors,
            });
        }

        const result = await deleteUserReward(idValidation.data.id);

        return res.status(200).json({
            success: true,
            message: "User reward deleted successfully.",
            data: result,
        });
    } catch (error) {
        return res.status(400).json({
            success: false,
            message:
                error instanceof Error
                    ? error.message
                    : "Failed to delete user reward.",
        });
    }
};
