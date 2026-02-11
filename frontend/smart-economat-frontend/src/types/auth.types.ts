export interface LoginRequest {
  emailOrUsername: string;
  password: string;
}

export interface User {
  id: string;
  username: string;
  email?: string; 
  name?: string;
}

export interface LoginResponse {
  token: string;
}
