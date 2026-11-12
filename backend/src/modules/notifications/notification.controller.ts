import type { Request, Response } from "express";

import {
  createNotification,
  getAdminNotifications,
  getAdminUnreadCount,
  getUserNotifications,
  getUnreadNotifications,
  getUserUnreadCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
} from "./notification.service.js";

// 1. Create Notification (Admin)
export const createNotificationController = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const result = await createNotification(req.body);

    res.status(201).json({
      success: true,
      message: (result as any)?.message || "Notification created successfully.",
      data: result,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to create notification.",
    });
  }
};

// 2. Get Admin System Notifications (Admin)
export const getAdminNotificationsController = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const limit = Number(req.query.limit) || 30;
    const notifications = await getAdminNotifications(limit);

    res.status(200).json({
      success: true,
      message: "Admin notifications retrieved successfully.",
      data: notifications,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to retrieve admin notifications.",
    });
  }
};

// 3. Get Admin Unread Activity Count (Admin)
export const getAdminUnreadCountController = async (
  _req: Request,
  res: Response
): Promise<void> => {
  try {
    const counts = await getAdminUnreadCount();

    res.status(200).json({
      success: true,
      message: "Admin unread count retrieved successfully.",
      data: counts,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to retrieve unread activity count.",
    });
  }
};

// 4. Get User Notifications (User)
export const getUserNotificationsController = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const userId = Number(req.user?.id);

    if (!userId) {
      res.status(401).json({
        success: false,
        message: "User authentication required.",
      });
      return;
    }

    const notifications = await getUserNotifications(userId);

    res.status(200).json({
      success: true,
      message: "Notifications retrieved successfully.",
      data: notifications,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to retrieve notifications.",
    });
  }
};

// 5. Get Unread Notifications (User)
export const getUnreadNotificationsController = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const userId = Number(req.user?.id);

    if (!userId) {
      res.status(401).json({
        success: false,
        message: "User authentication required.",
      });
      return;
    }

    const notifications = await getUnreadNotifications(userId);

    res.status(200).json({
      success: true,
      message: "Unread notifications retrieved successfully.",
      data: notifications,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to retrieve unread notifications.",
    });
  }
};

// 5b. Get Unread Count For Logged-in User
export const getUserUnreadCountController = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const userId = Number(req.user?.id);

    if (!userId) {
      res.status(401).json({
        success: false,
        message: "User authentication required.",
      });
      return;
    }

    const unreadCount = await getUserUnreadCount(userId);

    res.status(200).json({
      success: true,
      message: "Unread count retrieved successfully.",
      data: {
        unreadCount,
        count: unreadCount,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to retrieve unread notification count.",
    });
  }
};


// 6. Mark Notification As Read
export const markNotificationAsReadController = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const id = Number(req.params.id);
    const userId = req.user?.role === "admin" ? undefined : Number(req.user?.id);

    const notification = await markNotificationAsRead(id, userId);

    if (!notification) {
      res.status(404).json({
        success: false,
        message: "Notification not found.",
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: "Notification marked as read successfully.",
      data: notification,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to mark notification as read.",
    });
  }
};

// 7. Mark All Notifications As Read
export const markAllNotificationsAsReadController = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const userId = Number(req.user?.id);

    if (!userId) {
      res.status(401).json({
        success: false,
        message: "User authentication required.",
      });
      return;
    }

    const notifications = await markAllNotificationsAsRead(userId);

    res.status(200).json({
      success: true,
      message: "All notifications marked as read successfully.",
      data: notifications,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to mark all notifications as read.",
    });
  }
};

// 8. Delete Notification
export const deleteNotificationController = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const id = Number(req.params.id);
    const userId = Number(req.user?.id);

    if (!userId) {
      res.status(401).json({
        success: false,
        message: "User authentication required.",
      });
      return;
    }

    const notification = await deleteNotification(id, userId);

    if (!notification) {
      res.status(404).json({
        success: false,
        message: "Notification not found.",
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: "Notification deleted successfully.",
      data: notification,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to delete notification.",
    });
  }
};
