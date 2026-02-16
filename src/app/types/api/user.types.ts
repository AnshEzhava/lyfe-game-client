export interface UserResponse {
  id: string;
  clerkId: string;
  displayName: string;
  balance: number;
  stats?: {
    intelligence: number;
  };
}

export interface BalanceResponse {
  balance: number;
}

export interface CreateUserRequest {
  displayName: string;
}

export interface ApiResponse<T> {
  responseCode: number;
  responseMessage: string;
  response: T;
}
