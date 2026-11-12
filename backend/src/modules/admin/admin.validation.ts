import { z } from "zod";

// Numeric User ID in Route Parameter
export const userIdParamSchema = z.object({
  id: z
    .string()
    .regex(/^\d+$/, "User ID must be a valid positive integer")
    .transform((val) => parseInt(val, 10)),
});

export type UserIdParam = z.infer<typeof userIdParamSchema>;

// Query Parameters for Getting All Users
export const getUsersQuerySchema = z.object({
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
    .enum(["pending", "approved", "rejected", "blocked", "all"])
    .optional()
    .default("all"),

  search: z
    .string()
    .trim()
    .optional(),
});

export type GetUsersQuery = z.infer<typeof getUsersQuerySchema>;

// Query Parameters for Getting Pending Users
export const getPendingUsersQuerySchema = z.object({
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
});

export type GetPendingUsersQuery = z.infer<typeof getPendingUsersQuerySchema>;

