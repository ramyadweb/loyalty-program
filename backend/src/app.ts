import { sql } from "drizzle-orm";
import { db } from "./config/db.js";
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import authRoutes from "./routes/auth.routes.js";
import adminRoutes from "./modules/admin/admin.routes.js";
import ticketRoutes from "./modules/tickets/ticket.routes.js";
import auditRoutes from "./modules/audit/audit.routes.js";
import dashboardRoutes from "./modules/dashboard/dashboard.routes.js";
import rewardRoutes from "./modules/rewards/reward.routes.js";
import userRewardRoutes from "./modules/user-rewards/user-reward.routes.js";
import rewardRedemptionRoutes from "./modules/reward-redemption/reward-redemption.routes.js";
import notificationRoutes from "./modules/notifications/notification.routes.js";
import reportRoutes from "./modules/reports-analytics/report.routes.js";
import pointsRoutes from "./modules/points/points.routes.js";
import feedbackRoutes from "./modules/feedback/feedback.routes.js";

dotenv.config();

const app = express();

// Middleware
app.use(cors({
    origin: "http://localhost:5173"
}));

app.use(express.json());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/tickets", ticketRoutes);
app.use("/api/audit", auditRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/rewards", rewardRoutes);
app.use("/api/user-rewards", userRewardRoutes);
app.use("/api/reward-redemption", rewardRedemptionRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/points", pointsRoutes);
app.use("/api/feedback", feedbackRoutes);


// Database Connection Test
app.get("/api/db-test", async (req, res) => {
    try {
        const result = await db.execute(
            sql`SELECT
                NOW() AS current_time,
                current_database() AS database_name`
        );

        return res.status(200).json({
            success: true,
            message: "PostgreSQL connected successfully!",
            data: result.rows[0],
        });

    } catch (error) {
        console.error("Database Connection Error:", error);

        return res.status(500).json({
            success: false,
            message: "PostgreSQL connection failed.",
        });
    }
});



// Test API
app.get("/", (req, res) => {
    res.status(200).json({
        success: true,
        message: "Loyalty Program Backend is running!"
    });
});

export default app;
