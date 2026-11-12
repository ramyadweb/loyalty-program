import { api } from "./api.js";

export interface NotificationItem {
  id: number;
  userId: number;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  metadata?: Record<string, unknown> | null;
  createdAt: string;
  user?: {
    id: number;
    name: string;
    email: string;
    role: string;
  } | null;
}

export interface CreateNotificationPayload {
  recipientType?: "all" | "individual" | "multiple";
  userId?: number;
  userIds?: number[];
  title: string;
  message: string;
  type: "general" | "reward" | "points" | "announcement" | "important" | string;
  metadata?: Record<string, unknown>;
}

export interface AdminUnreadCountResponse {
  total: number;
  totalUnread?: number;
  pendingUsers: number;
  openTickets: number;
}

export const notificationsService = {
  getNotifications: () =>
    api.get<{ success: boolean; data: NotificationItem[] }>("/api/notifications"),

  getUnreadNotifications: () =>
    api.get<{ success: boolean; data: NotificationItem[] }>("/api/notifications/unread"),

  getUserUnreadCount: () =>
    api.get<{ success: boolean; data: { unreadCount: number; count: number } }>(
      "/api/notifications/unread-count"
    ),

  getAdminNotifications: (limit = 30) =>
    api.get<{ success: boolean; data: NotificationItem[] }>("/api/notifications/admin", {
      params: { limit },
    }),

  getAdminUnreadCount: () =>
    api.get<{ success: boolean; data: AdminUnreadCountResponse }>("/api/notifications/admin/unread-count"),

  markNotificationAsRead: (id: number) =>
    api.patch<{ success: boolean; data: NotificationItem }>(`/api/notifications/${id}/read`),

  markAllAsRead: () =>
    api.patch<{ success: boolean; message: string }>("/api/notifications/mark-all-read"),

  deleteNotification: (id: number) =>
    api.delete<{ success: boolean; data: NotificationItem }>(`/api/notifications/${id}`),

  createNotification: (data: CreateNotificationPayload) =>
    api.post<{ success: boolean; message: string; count?: number; data?: NotificationItem | NotificationItem[] }>(
      "/api/notifications",
      data
    ),
};


