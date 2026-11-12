import { api } from "./api.js";

export interface AuditLogItem {
  id: number;
  userId?: number | null;
  actorId?: number | null;
  actorEmail?: string | null;
  targetUserId?: number | null;
  targetUserEmail?: string | null;
  activityType: string;
  ipAddress?: string | null;
  createdAt: string;
}

export interface PaginatedAuditResponse {
  success: boolean;
  message?: string;
  data: {
    logs: AuditLogItem[];
    pagination: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    };
  };
}

export const auditService = {
  getAllAuditLogs: (params?: {
    page?: number;
    limit?: number;
    activityType?: string;
    userId?: number;
    actorId?: number;
    startDate?: string;
    endDate?: string;
  }) => api.get<PaginatedAuditResponse>("/api/audit", { params }),

  getAuditLogById: (id: number) =>
    api.get<{ success: boolean; data: AuditLogItem }>(`/api/audit/${id}`),
};
