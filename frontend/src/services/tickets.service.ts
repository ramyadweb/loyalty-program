import { api } from "./api.js";

export type TicketPriority = "low" | "medium" | "high";
export type TicketStatus = "open" | "in_progress" | "resolved" | "closed";

export interface TicketItem {
  id: number;
  userId: number;
  subject: string;
  description: string;
  category: string;
  priority: TicketPriority;
  status: TicketStatus;
  assignedTo?: number | null;
  adminResponse?: string | null;
  resolvedAt?: string | null;
  openedAt?: string | null;
  openedBy?: number | null;
  createdAt: string;
  updatedAt: string;
  user?: {
    id: number;
    name: string;
    email: string;
  };
}

export interface CreateTicketPayload {
  subject: string;
  category: string;
  priority: TicketPriority | "Low" | "Medium" | "High";
  description: string;
}

export const ticketsService = {
  createTicket: (data: CreateTicketPayload) =>
    api.post<{
      success: boolean;
      message: string;
      data: TicketItem & { pointsAwarded?: number };
    }>("/api/tickets", {
      ...data,
      priority: data.priority.toLowerCase(),
    }),

  getTickets: () =>
    api.get<{ success: boolean; message: string; data: TicketItem[] }>("/api/tickets"),

  getTicketById: (id: number) =>
    api.get<{ success: boolean; message: string; data: TicketItem }>(`/api/tickets/${id}`),

  openTicket: (id: number) =>
    api.post<{
      success: boolean;
      message: string;
      data: { ticket: TicketItem; pointsAwarded: number };
    }>(`/api/tickets/${id}/open`),

  updateTicketStatus: (
    id: number,
    data: { status: TicketStatus; adminResponse?: string }
  ) =>
    api.patch<{
      success: boolean;
      message: string;
      data: TicketItem & { pointsAwarded?: number };
    }>(`/api/tickets/${id}/status`, data),

  deleteTicket: (id: number) =>
    api.delete<{ success: boolean; message: string }>(`/api/tickets/${id}`),

  getRecentTickets: (limit = 10) =>
    api.get<{ success: boolean; message?: string; data: TicketItem[] }>("/api/tickets/recent", {
      params: { limit },
    }),
};

