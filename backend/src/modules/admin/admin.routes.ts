import { Router } from "express";
import {
  getPendingUsers,
  getAllUsers,
  getUserById,
  approveUser,
  rejectUser,
  getRecentUsers,
} from "./admin.controller.js";
import { authenticateToken } from "../../middleware/auth.middleware.js";
import { authorizeRole } from "../../middleware/role.middleware.js";

const adminRouter = Router();

// Global protection for all admin routes:
// 1. Must have a valid Bearer JWT token (authenticateToken)
// 2. Authenticated user must have role === "admin" (authorizeRole("admin"))
adminRouter.use(authenticateToken);
adminRouter.use(authorizeRole("admin"));

// ─── Admin User Management Endpoints ────────────────────────────────────────

// API 1: Get Pending Users
adminRouter.get("/users/pending", getPendingUsers);

// API 1b: Get Recent Users (MUST be before /users/:id)
adminRouter.get("/users/recent", getRecentUsers);

// API 2: Get All Users (with pagination, status filter & search)
adminRouter.get("/users", getAllUsers);

// API 3: Get User By ID
adminRouter.get("/users/:id", getUserById);

// API 4: Approve User (transition from pending to approved)
adminRouter.patch("/users/:id/approve", approveUser);

// API 5: Reject User (transition from pending to rejected)
adminRouter.patch("/users/:id/reject", rejectUser);

export default adminRouter;

