import { Router } from "express";
import {
  getAllAuditLogsController,
  getAuditLogByIdController,
} from "./audit.controller.js";
import { authenticateToken } from "../../middleware/auth.middleware.js";
import { authorizeRole } from "../../middleware/role.middleware.js";

const auditRouter = Router();

// ─── Middleware Protection ───────────────────────────────────────────────────
// 1. authenticateToken: Verifies the JWT Bearer token in the Authorization header.
//    - Returns HTTP 401 if missing, expired, or invalid.
// 2. authorizeRole("admin"): Verifies that the authenticated user has role === "admin".
//    - Returns HTTP 403 if the user is a normal user ("user").
auditRouter.use(authenticateToken);
auditRouter.use(authorizeRole("admin"));

// ─── Audit Log Routes ────────────────────────────────────────────────────────

// API 1: Get All Audit Logs (with pagination, filters, and sorting)
// Mounted at: GET /api/audit
auditRouter.get("/", getAllAuditLogsController);

// API 2: Get Audit Log By ID
// Mounted at: GET /api/audit/:id
auditRouter.get("/:id", getAuditLogByIdController);

export default auditRouter;

