export interface AuthUser {
  id: number;
  loginId: string;
  fullName: string;
  churchName: string;
}

export interface LoginRequest {
  loginId: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  user: AuthUser;
}
