export interface UserResponse {
  id: string;
  clerkId: string;
  displayName: string;
  balance: number;
}

export interface BalanceResponse {
  balance: number;
}

export interface CreateUserRequest {
  displayName: string;
}
