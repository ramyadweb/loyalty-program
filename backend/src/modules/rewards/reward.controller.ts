import type {
    Request,
    Response,
} from "express";

import {
    createReward,
    getAllRewards,
    getRewardById,
    updateReward,
    deleteReward,
} from "./reward.service.js";

import {
    createRewardSchema,
    updateRewardSchema,
    rewardIdSchema,
} from "./reward.validation.js";

// Create Reward
export const createRewardController = async (
    req: Request,
    res: Response
) => {
    try {
        const validation = createRewardSchema.safeParse(req.body);

        if (!validation.success) {
            return res.status(400).json({
                success: false,
                message: "Validation failed.",
                errors: validation.error.issues,
            });
        }

        const reward = await createReward(validation.data);

        return res.status(201).json({
            success: true,
            message: "Reward created successfully.",
            data: reward,
        });
    } catch (error) {
        console.error("Create Reward Error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to create reward.",
        });
    }
};

// Get All Rewards
export const getAllRewardsController = async (
    req: Request,
    res: Response
) => {
    try {
        const status = req.query.status;

        if (
            status !== undefined &&
            status !== "active" &&
            status !== "inactive"
        ) {
            return res.status(400).json({
                success: false,
                message: "Invalid reward status.",
            });
        }

        const rewards = await getAllRewards(
            status as "active" | "inactive" | undefined
        );

        return res.status(200).json({
            success: true,
            message: "Rewards retrieved successfully.",
            data: rewards,
        });
    } catch (error) {
        console.error("Get Rewards Error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to retrieve rewards.",
        });
    }
};

// Get Reward By ID
export const getRewardByIdController = async (
    req: Request,
    res: Response
) => {
    try {
        const validation = rewardIdSchema.safeParse(req.params);

        if (!validation.success) {
            return res.status(400).json({
                success: false,
                message: "Invalid reward ID.",
            });
        }

        const reward = await getRewardById(validation.data.id);

        if (!reward) {
            return res.status(404).json({
                success: false,
                message: "Reward not found.",
            });
        }

        return res.status(200).json({
            success: true,
            message: "Reward retrieved successfully.",
            data: reward,
        });
    } catch (error) {
        console.error("Get Reward Error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to retrieve reward.",
        });
    }
};

// Update Reward
export const updateRewardController = async (
    req: Request,
    res: Response
) => {
    try {
        const idValidation = rewardIdSchema.safeParse(req.params);

        if (!idValidation.success) {
            return res.status(400).json({
                success: false,
                message: "Invalid reward ID.",
            });
        }

        const bodyValidation = updateRewardSchema.safeParse(req.body);

        if (!bodyValidation.success) {
            return res.status(400).json({
                success: false,
                message: "Invalid update data.",
                errors: bodyValidation.error.issues,
            });
        }

        const reward = await updateReward(
            idValidation.data.id,
            bodyValidation.data
        );

        if (!reward) {
            return res.status(404).json({
                success: false,
                message: "Reward not found.",
            });
        }

        return res.status(200).json({
            success: true,
            message: "Reward updated successfully.",
            data: reward,
        });
    } catch (error) {
        console.error("Update Reward Error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to update reward.",
        });
    }
};

// Delete Reward
export const deleteRewardController = async (
    req: Request,
    res: Response
) => {
    try {
        const validation = rewardIdSchema.safeParse(req.params);

        if (!validation.success) {
            return res.status(400).json({
                success: false,
                message: "Invalid reward ID.",
            });
        }

        const reward = await deleteReward(validation.data.id);

        if (!reward) {
            return res.status(404).json({
                success: false,
                message: "Reward not found.",
            });
        }

        return res.status(200).json({
            success: true,
            message: "Reward deleted successfully.",
            data: reward,
        });
    } catch (error: any) {
        console.error("Delete Reward Error:", error);

        if (
            error?.code === "23503" ||
            error?.message?.includes("referenced by redemption records")
        ) {
            return res.status(400).json({
                success: false,
                message: "Cannot delete reward because it is already referenced by redemption records.",
            });
        }

        return res.status(500).json({
            success: false,
            message: "Failed to delete reward.",
        });
    }
};
