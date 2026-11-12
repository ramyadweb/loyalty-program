import { Router } from "express";
import {
    register,
    adminLogin,
    userLogin,
    forgotPassword,
    verifyOtp,
    resetPassword,
    getMe,
    logout,
} from "./auth.controller.js";
import { authenticateToken } from "../../middleware/auth.middleware.js";
import { authorizeRole } from "../../middleware/role.middleware.js";

const authRouter = Router();

// Public Authentication Endpoints
authRouter.post("/register", register);
authRouter.post("/admin/login", adminLogin);
authRouter.post("/user/login", userLogin);

// Fallback general login: handles either role based on account check
authRouter.post("/login", async (req, res, next) => {
    // Try adminLogin or userLogin based on role
    try {
        return await userLogin(req, res);
    } catch (err) {
        return next(err);
    }
});

// Password Reset Flow Endpoints
authRouter.post("/forgot-password", forgotPassword);
authRouter.post("/verify-otp", verifyOtp);
authRouter.post("/reset-password", resetPassword);

// Protected Routes (JWT Required)
authRouter.get("/me", authenticateToken, getMe);
authRouter.post("/logout", authenticateToken, logout);

// Role Authorization Test Route (Admin Only)
authRouter.get(
    "/admin/protected-data",
    authenticateToken,
    authorizeRole("admin"),
    (req, res) => {
        res.status(200).json({
            success: true,
            message: "Welcome to the Admin Protected Area!",
            data: {
                adminUser: req.user,
                serverTime: new Date().toISOString(),
            },
        });
    }
);
export default authRouter;
