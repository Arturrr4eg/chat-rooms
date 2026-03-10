import { http } from "@/shared/api/http.ts";

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  username: string;
}

export interface AuthUser {
  id: string;
  email: string;
  username: string;
}

export interface AuthResponse {
  accessToken: string;
  user: AuthUser;
}

export function login(data: LoginRequest) {
  return http<AuthResponse>("/auth/login", {
    method: "POST",
    body: data,
    auth: false,
  });
}

export function register(data: RegisterRequest) {
  return http<AuthResponse>("/auth/register", {
    method: "POST",
    body: data,
    auth: false,
  });
}
