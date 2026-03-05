import { useMutation } from "@tanstack/react-query";
import { login, type LoginRequest, type LoginResponse } from "@/features/auth/api/auth.api";
import { useAppStore } from "@/app/stores/app.store";

export function useLoginMutation() {
  const setAuth = useAppStore((s) => s.setAuth);

  return useMutation<LoginResponse, Error, LoginRequest>({
    mutationFn: (data) => login(data),
    onSuccess: (data) => {
      setAuth({ token: data.accessToken, user: data.user });
    },
  });
}