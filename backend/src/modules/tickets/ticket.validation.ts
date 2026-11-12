import { z } from "zod";

// Create Ticket Request Body Validation
export const createTicketSchema = z.object({
  subject: z
    .string()
    .trim()
    .min(3, "Subject must contain at least 3 characters")
    .max(255, "Subject cannot exceed 255 characters"),

  description: z
    .string()
    .trim()
    .min(5, "Description must contain at least 5 characters"),

  category: z
    .string()
    .trim()
    .min(2, "Category must contain at least 2 characters")
    .max(100, "Category cannot exceed 100 characters"),

  priority: z
    .enum(["low", "medium", "high"])
    .optional()
    .default("medium"),
});

export type CreateTicketInput = z.infer<typeof createTicketSchema>;

// Update Ticket Status Request Body Validation (Admin Only)
export const updateTicketStatusSchema = z.object({
  status: z.enum(["open", "in_progress", "resolved", "closed"], {
    message: "Status must be one of: open, in_progress, resolved, closed",
  }),

  adminResponse: z
    .string()
    .trim()
    .optional(),
});

export type UpdateTicketStatusInput = z.infer<typeof updateTicketStatusSchema>;

// Numeric Ticket ID Parameter Validation
export const ticketIdParamSchema = z.object({
  id: z
    .string()
    .regex(/^\d+$/, "Ticket ID must be a valid positive integer")
    .transform((val) => parseInt(val, 10)),
});

export type TicketIdParam = z.infer<typeof ticketIdParamSchema>;

// Get Tickets Query Parameters Validation
export const getTicketsQuerySchema = z.object({
  page: z
    .string()
    .optional()
    .default("1")
    .transform((val) => {
      const parsed = parseInt(val, 10);
      return isNaN(parsed) || parsed < 1 ? 1 : parsed;
    }),

  limit: z
    .string()
    .optional()
    .default("10")
    .transform((val) => {
      const parsed = parseInt(val, 10);
      return isNaN(parsed) || parsed < 1 ? 10 : Math.min(parsed, 100);
    }),

  status: z
    .enum(["open", "in_progress", "resolved", "closed", "all"])
    .optional()
    .default("all"),

  priority: z
    .enum(["low", "medium", "high", "all"])
    .optional()
    .default("all"),

  category: z
    .string()
    .trim()
    .optional(),

  search: z
    .string()
    .trim()
    .optional(),
});

export type GetTicketsQuery = z.infer<typeof getTicketsQuerySchema>;

