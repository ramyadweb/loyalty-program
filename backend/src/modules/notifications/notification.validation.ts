import { z } from "zod";

// 1. Notification ID Validation
export const notificationIdSchema = z.object({
  id: z.coerce
    .number()
    .int("Notification ID must be an integer")
    .positive("Notification ID must be greater than zero"),
});

// 2. Create Notification Validation (Supports Single User, Multiple Users, and All Users)
export const createNotificationSchema = z
  .object({
    recipientType: z.enum(["all", "individual", "multiple"]).optional(),

    userId: z.coerce
      .number()
      .int("User ID must be an integer")
      .positive("User ID must be greater than zero")
      .optional(),

    userIds: z
      .array(
        z.coerce
          .number()
          .int("User ID must be an integer")
          .positive("User ID must be greater than zero")
      )
      .optional(),

    title: z
      .string()
      .trim()
      .min(1, "Title is required")
      .max(255, "Title cannot exceed 255 characters"),

    message: z
      .string()
      .trim()
      .min(1, "Message is required"),

    type: z
      .string()
      .trim()
      .min(1, "Notification type is required")
      .max(100, "Notification type cannot exceed 100 characters")
      .default("general"),

    metadata: z.record(z.string(), z.any()).optional(),
  })
  .refine(
    (data) => {
      if (data.recipientType === "all") return true;
      if (data.recipientType === "multiple") {
        return Array.isArray(data.userIds) && data.userIds.length > 0;
      }
      if (data.recipientType === "individual") {
        return Boolean(data.userId);
      }
      return Boolean(data.userId || (data.userIds && data.userIds.length > 0));
    },
    {
      message: "Please specify a valid recipient (individual user, multiple users, or all users).",
      path: ["recipientType"],
    }
  );

// 3. TypeScript Types
export type CreateNotificationInput = z.infer<typeof createNotificationSchema>;
export type NotificationIdInput = z.infer<typeof notificationIdSchema>;
