import type { Request, Response } from "express";

import {
    getAdminDashboardStats,
    getRecentUserActivities,
} from "./dashboard.service.js";

// Get Admin Dashboard Statistics
export const adminDashboardStats = async (
    req: Request,
    res: Response
) => {
    try {
        const stats = await getAdminDashboardStats();

        return res.status(200).json({
            success: true,
            message: "Admin dashboard statistics retrieved successfully.",
            data: stats,
        });
    } catch (error) {
        console.error("Admin Dashboard Stats Error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to retrieve admin dashboard statistics.",
        });
    }
};

// Get Recent User Activities
export const recentUserActivities = async (
    req: Request,
    res: Response
) => {
    try {
        const activities = await getRecentUserActivities();

        return res.status(200).json({
            success: true,
            message: "Recent user activities retrieved successfully.",
            data: activities,
        });
    } catch (error) {
        console.error("Recent User Activities Error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to retrieve recent user activities.",
        });
    }
};
