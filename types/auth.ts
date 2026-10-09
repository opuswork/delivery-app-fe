/** This device's anonymous account. */
export interface AuthUser {
  id: number;
  /** Empty for device accounts. */
  fullName: string;
  createdAt: string;
}

export interface TokenResponse {
  accessToken: string;
}

export interface AdminLoginRequest {
  loginId: string;
  password: string;
}
