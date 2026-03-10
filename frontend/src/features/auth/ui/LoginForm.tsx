import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/shared/ui/button.tsx";
import { Input } from "@/shared/ui/input.tsx";
import { Card } from "@/shared/ui/card.tsx";
import { useLoginMutation } from "@/features/auth/model/useLoginMutation.ts";
import { useRegisterMutation } from "@/features/auth/model/useRegisterMutation.ts";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

const registerSchema = z
  .object({
    email: z.string().email(),
    password: z.string().min(8, "Password must be at least 8 characters"),
    username: z
      .string()
      .min(3, "Username must be at least 3 characters")
      .max(20, "Username must be at most 20 characters")
      .regex(/^[a-zA-Z0-9_]+$/, "Only letters, numbers and underscore are allowed"),
    confirmPassword: z.string().min(8, "Password must be at least 8 characters"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type LoginFormValues = z.infer<typeof loginSchema>;
type RegisterFormValues = z.infer<typeof registerSchema>;

interface LoginFormProps {
  onSuccess?: () => void;
}

export function LoginForm(props: LoginFormProps) {
  const { onSuccess } = props;

  const [mode, setMode] = useState<"login" | "register">("login");

  const loginMutation = useLoginMutation();
  const registerMutation = useRegisterMutation();

  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const registerForm = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: "",
      password: "",
      username: "",
      confirmPassword: "",
    },
  });

  const switchMode = (nextMode: "login" | "register") => {
    setMode(nextMode);
    loginMutation.reset();
    registerMutation.reset();
  };

  const submitLogin = (values: LoginFormValues) => {
    loginMutation.mutate(values, {
      onSuccess: () => {
        onSuccess?.();
      },
    });
  };

  const submitRegister = (values: RegisterFormValues) => {
    registerMutation.mutate(
      { email: values.email, password: values.password, username: values.username },
      {
        onSuccess: () => {
          onSuccess?.();
        },
      }
    );
  };

  return (
    <Card className="w-full max-w-md p-6 space-y-6 border-border/70 shadow-xl backdrop-blur animate-soft-pop">
      <div className="space-y-3">
        <div className="flex rounded-md border border-border bg-background/70 p-1">
          <Button
            type="button"
            variant={mode === "login" ? "default" : "ghost"}
            className="flex-1"
            onClick={() => switchMode("login")}
          >
            Login
          </Button>
          <Button
            type="button"
            variant={mode === "register" ? "default" : "ghost"}
            className="flex-1"
            onClick={() => switchMode("register")}
          >
            Register
          </Button>
        </div>

        <div className="space-y-1">
          <h2 className="text-2xl font-semibold tracking-tight">
            {mode === "login" ? "Welcome back" : "Create account"}
          </h2>
          <p className="text-sm text-muted-foreground">
            {mode === "login"
              ? "Enter your credentials to continue"
              : "Register with email and password"}
          </p>
        </div>
      </div>

      {mode === "login" ? (
        <form onSubmit={loginForm.handleSubmit(submitLogin)} className="space-y-4 animate-fade-up">
          <div className="space-y-2">
            <label className="text-sm font-medium">Email</label>
            <Input type="email" {...loginForm.register("email")} />
            {loginForm.formState.errors.email && (
              <p className="text-sm text-destructive">{loginForm.formState.errors.email.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Password</label>
            <Input type="password" {...loginForm.register("password")} />
            {loginForm.formState.errors.password && (
              <p className="text-sm text-destructive">{loginForm.formState.errors.password.message}</p>
            )}
          </div>

          {loginMutation.isError && <p className="text-sm text-destructive">{loginMutation.error.message}</p>}

          <Button type="submit" disabled={loginMutation.isPending} className="w-full">
            {loginMutation.isPending ? "Logging in..." : "Login"}
          </Button>
        </form>
      ) : (
        <form onSubmit={registerForm.handleSubmit(submitRegister)} className="space-y-4 animate-fade-up">
          <div className="space-y-2">
            <label className="text-sm font-medium">Email</label>
            <Input type="email" {...registerForm.register("email")} />
            {registerForm.formState.errors.email && (
              <p className="text-sm text-destructive">{registerForm.formState.errors.email.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Username</label>
            <Input type="text" {...registerForm.register("username")} />
            {registerForm.formState.errors.username && (
              <p className="text-sm text-destructive">{registerForm.formState.errors.username.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Password</label>
            <Input type="password" {...registerForm.register("password")} />
            {registerForm.formState.errors.password && (
              <p className="text-sm text-destructive">{registerForm.formState.errors.password.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Confirm password</label>
            <Input type="password" {...registerForm.register("confirmPassword")} />
            {registerForm.formState.errors.confirmPassword && (
              <p className="text-sm text-destructive">{registerForm.formState.errors.confirmPassword.message}</p>
            )}
          </div>

          {registerMutation.isError && (
            <p className="text-sm text-destructive">{registerMutation.error.message}</p>
          )}

          <Button type="submit" disabled={registerMutation.isPending} className="w-full">
            {registerMutation.isPending ? "Creating account..." : "Register"}
          </Button>
        </form>
      )}
    </Card>
  );
}
