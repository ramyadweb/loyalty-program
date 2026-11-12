export type UserRole = "admin" | "user";
export type UserStatus = "pending" | "approved" | "rejected" | "blocked";

export interface AuthUser {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface JwtUserPayload {
  id: number;
  email: string;
  role: UserRole;
  status: UserStatus;
}

export interface AuthSuccessResponse {
  success: boolean;
  message: string;
  data: {
    user: {
      id: number;
      name: string;
      email: string;
      role: UserRole;
      status: UserStatus;
    };
    token: string;
  };
}

