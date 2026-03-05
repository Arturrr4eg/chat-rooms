import { http } from "@/shared/api/http.ts";

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthUser {
  id: string;
  email: string;
}

export interface LoginResponse {
  accessToken: string;
  user: AuthUser;
}

export function login(data: LoginRequest) {
  return http<LoginResponse>("/auth/login", {
    method: "POST",
    body: data,
    auth: false,
  });
}