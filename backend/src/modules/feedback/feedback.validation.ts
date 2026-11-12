import { z } from "zod";

export const createFeedbackSchema = z.object({
  rating: z
    .number({ message: "Rating must be a number" })
    .int("Rating must be an integer")
    .min(1, "Rating must be between 1 and 5")
    .max(5, "Rating must be between 1 and 5"),

  comment: z
    .string({ message: "Comment is required" })
    .trim()
    .min(5, "Comment must be at least 5 characters")
    .max(1000, "Comment cannot exceed 1000 characters"),
});

export const feedbackIdParamSchema = z.object({
  id: z
    .string()
    .regex(/^\d+$/, "Feedback ID must be a valid positive integer")
    .transform((val) => parseInt(val, 10)),
});

export const getFeedbackQuerySchema = z.object({
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
    .enum(["pending", "approved", "rejected"])
    .or(z.literal(""))
    .optional()
    .transform((val) => (val === "" ? undefined : val)),

  search: z.string().trim().optional(),
});
