import { Router } from "express";

import {
  createNotificationController,
  getAdminNotificationsController,
  getAdminUnreadCountController,
  getUserNotificationsController,
  getUnreadNotificationsController,
  getUserUnreadCountController,
  markNotificationAsReadController,
  markAllNotificationsAsReadController,
  deleteNotificationController,
} from "./notification.controller.js";

import {
  createNotificationSchema,
  notificationIdSchema,
} from "./notification.validation.js";

import { validate } from "../../middleware/validate.middleware.js";
import { authenticateToken } from "../../middleware/auth.middleware.js";
import { authorizeRole } from "../../middleware/role.middleware.js";

const router = Router();

// All notification routes require authentication
router.use(authenticateToken);

// ─── Admin Dedicated Endpoints ──────────────────────────────────────────────

// 1. Admin: Create Notification (Single, Multiple, or All Users)
router.post(
  "/",
  authorizeRole("admin"),
  validate(createNotificationSchema),
  createNotificationController
);

// 2. Admin: Get System Notifications
router.get(
  "/admin",
  authorizeRole("admin"),
  getAdminNotificationsController
);

// 3. Admin: Get Unread Activity Count (Pending Users + Open Tickets)
router.get(
  "/admin/unread-count",
  authorizeRole("admin"),
  getAdminUnreadCountController
);

// ─── Mark All As Read (Defined before parameterized :id route) ──────────────
router.patch("/mark-all-read", markAllNotificationsAsReadController);
router.patch("/read-all", markAllNotificationsAsReadController);

// ─── User Notifications ─────────────────────────────────────────────────────

// 4. User: Get logged-in user's notifications
router.get("/", getUserNotificationsController);

// 5. User: Get unread notifications
router.get("/unread", getUnreadNotificationsController);

// 5b. User: Get unread count
router.get("/unread-count", getUserUnreadCountController);

// 6. User/Admin: Mark notification as read
router.patch(
  "/:id/read",
  validate(notificationIdSchema),
  markNotificationAsReadController
);

// 7. User: Delete notification
router.delete(
  "/:id",
  validate(notificationIdSchema),
  deleteNotificationController
);

export default router;
