export type FeedbackStatus = "pending" | "approved" | "rejected";

export interface FeedbackItem {
  id: number;
  userId: number;
  rating: number;
  comment: string;
  status: FeedbackStatus;
  createdAt: Date | string;
  user?: {
    id: number;
    name: string;
    email: string;
  } | null | undefined;
}

export interface CreateFeedbackInput {
  rating: number;
  comment: string;
}

export interface GetFeedbackQuery {
  page?: number | undefined;
  limit?: number | undefined;
  status?: FeedbackStatus | undefined;
  search?: string | undefined;
}

export interface PaginatedFeedbackResult {
  feedbacks: FeedbackItem[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}
