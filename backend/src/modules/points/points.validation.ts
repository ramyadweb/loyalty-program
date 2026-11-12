import { z } from "zod";

export const awardPointsSchema = z.object({
  userId: z
    .number({ message: "User ID must be a number" })
    .int("User ID must be an integer")
    .positive("User ID must be a positive integer"),

  points: z
    .number({ message: "Points must be a number" })
    .int("Points must be an integer")
    .positive("Points must be a positive integer")
    .min(1, "Points must be at least 1"),

  description: z
    .string({ message: "Description is required" })
    .trim()
    .min(3, "Description must be at least 3 characters")
    .max(500, "Description cannot exceed 500 characters"),
});

export const userIdParamSchema = z.object({
  userId: z
    .string()
    .regex(/^\d+$/, "User ID must be a valid positive integer")
    .transform((val) => parseInt(val, 10)),
});

export const getTransactionsQuerySchema = z.object({
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

  activity: z
    .enum([
      "REGISTRATION",
      "FEEDBACK",
      "ADMIN_BONUS",
      "REDEMPTION",
      "REVERSAL",
      "TICKET_CREATED",
      "TICKET_OPENED",
      "TICKET_RESOLVED",
    ])
    .or(z.literal(""))
    .optional()
    .transform((val) => (val === "" ? undefined : val)),

  search: z.string().trim().optional(),
});
