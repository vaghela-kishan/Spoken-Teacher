import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { MailCheck } from "lucide-react";
import * as React from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { FieldError } from "@/components/ui/field-error";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/ui/password-input";
import { toast } from "@/components/ui/sonner";
import { authApi } from "@/features/auth/api";
import { useAuth } from "@/features/auth/auth-context";
import { type RegisterValues, registerSchema } from "@/features/auth/schemas";
import { ApiError } from "@/lib/api";
import { AuthShell } from "@/pages/auth/auth-shell";

export default function RegisterPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [registered, setRegistered] = React.useState(false);

  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<RegisterValues>({ resolver: zodResolver(registerSchema) });

  const mutation = useMutation({
    mutationFn: (values: RegisterValues) =>
      authApi.register({ email: values.email, password: values.password, full_name: values.full_name }),
    onSuccess: async (_data, values) => {
      setRegistered(true);
      toast.success("Account created! Check your inbox to verify your email.");
      // Auto-login so the user can start immediately (verification is soft).
      try {
        await login(values.email, values.password);
        setTimeout(() => navigate("/app", { replace: true }), 1200);
      } catch {
        /* they can log in manually */
      }
    },
    onError: (err) =>
      toast.error(err instanceof ApiError ? err.message : "Registration failed."),
  });

  if (registered) {
    return (
      <AuthShell title="You're all set!" subtitle="Taking you to your dashboard…">
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="flex flex-col items-center gap-4 py-6 text-center">
          <div className="grid size-16 place-items-center rounded-2xl bg-success/15 text-success">
            <MailCheck className="size-8" />
          </div>
          <p className="text-sm text-muted-foreground">
            We sent a verification link to <span className="font-medium text-foreground">{getValues("email")}</span>.
          </p>
        </motion.div>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Create your account"
      subtitle="Start speaking English with Aria in under a minute."
      footer={
        <>
          Already have an account?{" "}
          <Link to="/login" className="font-semibold text-primary hover:underline">
            Log in
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit((v) => mutation.mutate(v))} className="space-y-4">
        <div>
          <Label htmlFor="full_name">Full name</Label>
          <Input id="full_name" placeholder="Jane Doe" autoComplete="name" {...register("full_name")} />
          <FieldError message={errors.full_name?.message} />
        </div>
        <div>
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" placeholder="you@example.com" autoComplete="email" {...register("email")} />
          <FieldError message={errors.email?.message} />
        </div>
        <div>
          <Label htmlFor="password">Password</Label>
          <PasswordInput id="password" placeholder="At least 8 characters" autoComplete="new-password" {...register("password")} />
          <FieldError message={errors.password?.message} />
        </div>
        <div>
          <Label htmlFor="confirm">Confirm password</Label>
          <PasswordInput id="confirm" placeholder="Re-enter your password" autoComplete="new-password" {...register("confirm")} />
          <FieldError message={errors.confirm?.message} />
        </div>
        <Button type="submit" variant="gradient" size="lg" className="w-full" loading={isSubmitting || mutation.isPending}>
          Create account
        </Button>
      </form>
    </AuthShell>
  );
}
