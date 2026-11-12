export type PointsActivity =
  | "REGISTRATION"
  | "FEEDBACK"
  | "ADMIN_BONUS"
  | "REDEMPTION"
  | "REVERSAL"
  | "TICKET_CREATED"
  | "TICKET_OPENED"
  | "TICKET_RESOLVED";

export interface PointsTransactionItem {
  id: number;
  userId: number;
  points: number;
  activity: PointsActivity;
  description: string;
  referenceId?: number | null | undefined;
  createdBy?: number | null | undefined;
  createdAt: Date | string;
  user?: {
    id: number;
    name: string;
    email: string;
  } | null | undefined;
}

export interface UserPointsBalance {
  userId: number;
  totalEarned: number;
  totalRedeemed: number;
  availablePoints: number;
}

export interface AwardPointsInput {
  userId: number;
  points: number;
  description: string;
}

export interface GetTransactionsQuery {
  page?: number | undefined;
  limit?: number | undefined;
  activity?: PointsActivity | undefined;
  search?: string | undefined;
}

export interface PaginatedPointsTransactions {
  transactions: PointsTransactionItem[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}
