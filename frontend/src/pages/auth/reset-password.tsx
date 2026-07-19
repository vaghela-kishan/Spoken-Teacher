import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { Link, useNavigate, useSearchParams } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { FieldError } from "@/components/ui/field-error";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/ui/password-input";
import { toast } from "@/components/ui/sonner";
import { authApi } from "@/features/auth/api";
import { type ResetValues, resetSchema } from "@/features/auth/schemas";
import { ApiError } from "@/lib/api";
import { AuthShell } from "@/pages/auth/auth-shell";

export default function ResetPasswordPage() {
  const [params] = useSearchParams();
  const token = params.get("token") ?? "";
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetValues>({ resolver: zodResolver(resetSchema) });

  const mutation = useMutation({
    mutationFn: (v: ResetValues) => authApi.resetPassword(token, v.password),
    onSuccess: () => {
      toast.success("Password reset! You can now log in.");
      navigate("/login", { replace: true });
    },
    onError: (err) => toast.error(err instanceof ApiError ? err.message : "Reset failed."),
  });

  if (!token) {
    return (
      <AuthShell title="Invalid link" subtitle="This reset link is missing or malformed.">
        <Link to="/forgot-password">
          <Button variant="gradient" className="w-full">
            Request a new link
          </Button>
        </Link>
      </AuthShell>
    );
  }

  return (
    <AuthShell title="Set a new password" subtitle="Choose a strong password you'll remember.">
      <form onSubmit={handleSubmit((v) => mutation.mutate(v))} className="space-y-4">
        <div>
          <Label htmlFor="password">New password</Label>
          <PasswordInput id="password" placeholder="At least 8 characters" {...register("password")} />
          <FieldError message={errors.password?.message} />
        </div>
        <div>
          <Label htmlFor="confirm">Confirm password</Label>
          <PasswordInput id="confirm" placeholder="Re-enter password" {...register("confirm")} />
          <FieldError message={errors.confirm?.message} />
        </div>
        <Button type="submit" variant="gradient" size="lg" className="w-full" loading={mutation.isPending}>
          Reset password
        </Button>
      </form>
    </AuthShell>
  );
}
