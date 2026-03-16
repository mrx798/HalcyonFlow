export interface User {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'USER';
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'USER';
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  timestamp: string;
}
