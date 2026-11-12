
import type { Request, Response } from "express";

import {
    getDashboardSummaryService,
    getUserStatisticsService,
    getRewardStatisticsService,
    getRedemptionStatisticsService,
    getTicketStatisticsService,
    getAuditStatisticsService,
} from "./report.service.js";

// 1. Dashboard Summary
export const getDashboardSummaryController = async (
    req: Request,
    res: Response
) => {
    try {
        const data = await getDashboardSummaryService();

        return res.status(200).json({
            success: true,
            message: "Dashboard summary retrieved successfully.",
            data,
        });
    } catch (error) {
        console.error("Dashboard Summary Error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to retrieve dashboard summary.",
        });
    }
};


// 2. User Statistics
export const getUserStatisticsController = async (
    req: Request,
    res: Response
) => {
    try {
        const data = await getUserStatisticsService();

        return res.status(200).json({
            success: true,
            message: "User statistics retrieved successfully.",
            data,
        });
    } catch (error) {
        console.error("User Statistics Error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to retrieve user statistics.",
        });
    }
};


// 3. Reward Statistics
export const getRewardStatisticsController = async (
    req: Request,
    res: Response
) => {
    try {
        const data = await getRewardStatisticsService();

        return res.status(200).json({
            success: true,
            message: "Reward statistics retrieved successfully.",
            data,
        });
    } catch (error) {
        console.error("Reward Statistics Error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to retrieve reward statistics.",
        });
    }
};


// 4. Redemption Statistics
export const getRedemptionStatisticsController = async (
    req: Request,
    res: Response
) => {
    try {
        const data = await getRedemptionStatisticsService();

        return res.status(200).json({
            success: true,
            message: "Redemption statistics retrieved successfully.",
            data,
        });
    } catch (error) {
        console.error("Redemption Statistics Error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to retrieve redemption statistics.",
        });
    }
};


// 5. Ticket Statistics
export const getTicketStatisticsController = async (
    req: Request,
    res: Response
) => {
    try {
        const data = await getTicketStatisticsService();

        return res.status(200).json({
            success: true,
            message: "Ticket statistics retrieved successfully.",
            data,
        });
    } catch (error) {
        console.error("Ticket Statistics Error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to retrieve ticket statistics.",
        });
    }
};


// 6. Audit Statistics
export const getAuditStatisticsController = async (
    req: Request,
    res: Response
) => {
    try {
        const data = await getAuditStatisticsService();

        return res.status(200).json({
            success: true,
            message: "Audit statistics retrieved successfully.",
            data,
        });
    } catch (error) {
        console.error("Audit Statistics Error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to retrieve audit statistics.",
        });
    }
};
