import type { Request, Response } from "express";
import {
  createTicketSchema,
  updateTicketStatusSchema,
  ticketIdParamSchema,
  getTicketsQuerySchema,
} from "./ticket.validation.js";
import {
  createTicketService,
  getAllTicketsService,
  getTicketByIdService,
  openTicketService,
  updateTicketStatusService,
  deleteTicketService,
  getRecentTicketsService,
} from "./ticket.service.js";

// ─── API 1: Create Ticket ───────────────────────────────────────────────────

export const createTicket = async (req: Request, res: Response) => {
  try {
    const validationResult = createTicketSchema.safeParse(req.body);

    if (!validationResult.success) {
      return res.status(400).json({
        success: false,
        message: "Validation failed.",
        errors: validationResult.error.flatten().fieldErrors,
      });
    }

    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required.",
      });
    }

    const result = await createTicketService(req.user.id, validationResult.data);

    if (!result.success) {
      return res.status(result.statusCode).json({
        success: false,
        message: result.message,
      });
    }

    return res.status(result.statusCode).json({
      success: true,
      message: result.message,
      data: result.data,
    });
  } catch (error) {
    console.error("Create Ticket Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error.",
    });
  }
};

// ─── API 2: Get All Tickets (Role Scoped + Filter + Search + Paginate) ──────

export const getAllTickets = async (req: Request, res: Response) => {
  try {
    const validationResult = getTicketsQuerySchema.safeParse(req.query);

    if (!validationResult.success) {
      return res.status(400).json({
        success: false,
        message: "Invalid query parameters.",
        errors: validationResult.error.flatten().fieldErrors,
      });
    }

    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required.",
      });
    }

    const result = await getAllTicketsService(req.user, validationResult.data);

    if (!result.success) {
      return res.status(result.statusCode).json({
        success: false,
        message: result.message,
      });
    }

    return res.status(result.statusCode).json({
      success: true,
      message: result.message,
      data: result.data,
      pagination: result.pagination,
    });
  } catch (error) {
    console.error("Get All Tickets Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error.",
    });
  }
};

// ─── API 3: Get Ticket By ID ────────────────────────────────────────────────

export const getTicketById = async (req: Request, res: Response) => {
  try {
    const paramValidation = ticketIdParamSchema.safeParse(req.params);

    if (!paramValidation.success) {
      return res.status(400).json({
        success: false,
        message: "Invalid ticket ID parameter. Must be a positive integer.",
        errors: paramValidation.error.flatten().fieldErrors,
      });
    }

    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required.",
      });
    }

    const result = await getTicketByIdService(paramValidation.data.id, req.user);

    if (!result.success) {
      return res.status(result.statusCode).json({
        success: false,
        message: result.message,
      });
    }

    return res.status(result.statusCode).json({
      success: true,
      message: result.message,
      data: result.data,
    });
  } catch (error) {
    console.error("Get Ticket By ID Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error.",
    });
  }
};

// ─── API 3b: Open Ticket (Admin Only - Awards 20 points once to ticket owner) ─

export const openTicket = async (req: Request, res: Response) => {
  try {
    const paramValidation = ticketIdParamSchema.safeParse(req.params);

    if (!paramValidation.success) {
      return res.status(400).json({
        success: false,
        message: "Invalid ticket ID parameter. Must be a positive integer.",
        errors: paramValidation.error.flatten().fieldErrors,
      });
    }

    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required.",
      });
    }

    if (req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Access denied. Only administrators can open tickets.",
      });
    }

    const result = await openTicketService(paramValidation.data.id, req.user.id);

    return res.status(result.statusCode).json({
      success: result.success,
      message: result.message,
      data: result.data,
    });
  } catch (error) {
    console.error("Open Ticket Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error.",
    });
  }
};

// ─── API 4: Update Ticket Status (Admin Only) ───────────────────────────────

export const updateTicketStatus = async (req: Request, res: Response) => {
  try {
    const paramValidation = ticketIdParamSchema.safeParse(req.params);

    if (!paramValidation.success) {
      return res.status(400).json({
        success: false,
        message: "Invalid ticket ID parameter.",
        errors: paramValidation.error.flatten().fieldErrors,
      });
    }

    const bodyValidation = updateTicketStatusSchema.safeParse(req.body);

    if (!bodyValidation.success) {
      return res.status(400).json({
        success: false,
        message: "Validation failed.",
        errors: bodyValidation.error.flatten().fieldErrors,
      });
    }

    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required.",
      });
    }

    const result = await updateTicketStatusService(
      paramValidation.data.id,
      req.user.id,
      bodyValidation.data
    );

    if (!result.success) {
      return res.status(result.statusCode).json({
        success: false,
        message: result.message,
      });
    }

    return res.status(result.statusCode).json({
      success: true,
      message: result.message,
      data: result.data,
    });
  } catch (error) {
    console.error("Update Ticket Status Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error.",
    });
  }
};

// ─── API 5: Delete Ticket (Admin Only) ──────────────────────────────────────

export const deleteTicket = async (req: Request, res: Response) => {
  try {
    const paramValidation = ticketIdParamSchema.safeParse(req.params);

    if (!paramValidation.success) {
      return res.status(400).json({
        success: false,
        message: "Invalid ticket ID parameter.",
        errors: paramValidation.error.flatten().fieldErrors,
      });
    }

    const result = await deleteTicketService(paramValidation.data.id);

    if (!result.success) {
      return res.status(result.statusCode).json({
        success: false,
        message: result.message,
      });
    }

    return res.status(result.statusCode).json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    console.error("Delete Ticket Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error.",
    });
  }
};

// ─── API 6: Get Recent Tickets (Admin Only) ─────────────────────────────────

export const getRecentTickets = async (req: Request, res: Response) => {
  try {
    const limit = Number(req.query.limit) || 10;
    const recentTickets = await getRecentTicketsService(limit);

    return res.status(200).json({
      success: true,
      message: "Recent tickets retrieved successfully.",
      data: recentTickets,
    });
  } catch (error) {
    console.error("Get Recent Tickets Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error.",
    });
  }
};


