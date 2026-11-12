
import type {
    CreateNotificationInput,
    NotificationIdInput,
} from "./notification.validation.js";

// Create Notification Type
export type CreateNotificationData = CreateNotificationInput;

// Notification ID Type
export type NotificationParams = NotificationIdInput;

// Notification Response Type
export interface NotificationResponse {
    id: number;
    userId: number;
    title: string;
    message: string;
    type: string;
    isRead: boolean;
    metadata: Record<string, unknown> | null;
    createdAt: Date;
}
