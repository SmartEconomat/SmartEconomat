export interface LoginRequest {
  usernameOrEmail: string;
  password: string;
}

export interface User {
  id: string;
  username: string;
  email?: string; 
  name: string;
}

export interface LoginResponse {
  user: User;
  token: string;
}
