import { useMutation } from "@tanstack/react-query";
import { register, type RegisterRequest, type AuthResponse } from "@/features/auth/api/auth.api";
import { useAppStore } from "@/app/stores/app.store";

export function useRegisterMutation() {
  const setAuth = useAppStore((s) => s.setAuth);

  return useMutation<AuthResponse, Error, RegisterRequest>({
    mutationFn: (data) => register(data),
    onSuccess: (data) => {
      setAuth({ token: data.accessToken, user: data.user });
    },
  });
}
