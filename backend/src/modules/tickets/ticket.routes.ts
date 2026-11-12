import { Router } from "express";
import {
  createTicket,
  getAllTickets,
  getTicketById,
  openTicket,
  updateTicketStatus,
  deleteTicket,
  getRecentTickets,
} from "./ticket.controller.js";
import { authenticateToken } from "../../middleware/auth.middleware.js";
import { authorizeRole } from "../../middleware/role.middleware.js";

const ticketRouter = Router();

// Global authentication: All ticket operations require a valid JWT token
ticketRouter.use(authenticateToken);

// ─── User & Admin Shared Endpoints (Scoping handled in service) ─────────────

// API 1: Create Ticket (Admin & Approved Users)
ticketRouter.post("/", createTicket);

// API 1b: Get Recent Tickets (Admin Only - MUST be placed before /:id)
ticketRouter.get("/recent", authorizeRole("admin"), getRecentTickets);

// API 2: Get All Tickets (Admin views all, User views own)
ticketRouter.get("/", getAllTickets);

// API 3: Get Ticket By ID (Admin views any, User views own)
ticketRouter.get("/:id", getTicketById);

// ─── Admin Only Endpoints ───────────────────────────────────────────────────

// API 3b: Open Ticket (Admin Only - Awards 20 points once to ticket owner)
ticketRouter.post("/:id/open", authorizeRole("admin"), openTicket);
ticketRouter.patch("/:id/open", authorizeRole("admin"), openTicket);

// API 4: Update Ticket Status (Admin Only)
ticketRouter.patch("/:id/status", authorizeRole("admin"), updateTicketStatus);

// API 5: Delete Ticket (Admin Only)
ticketRouter.delete("/:id", authorizeRole("admin"), deleteTicket);

export default ticketRouter;

