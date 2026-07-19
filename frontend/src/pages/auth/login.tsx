import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Link, useLocation, useNavigate } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { FieldError } from "@/components/ui/field-error";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/ui/password-input";
import { toast } from "@/components/ui/sonner";
import { useAuth } from "@/features/auth/auth-context";
import { type LoginValues, loginSchema } from "@/features/auth/schemas";
import { ApiError } from "@/lib/api";
import { AuthShell } from "@/pages/auth/auth-shell";

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: Location })?.from?.pathname ?? "/app";

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginValues>({ resolver: zodResolver(loginSchema) });

  const onSubmit = async (values: LoginValues) => {
    try {
      const user = await login(values.email, values.password);
      toast.success(`Welcome back, ${user.full_name ?? "learner"}! 👋`);
      navigate(from, { replace: true });
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Login failed. Please try again.");
    }
  };

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Log in to continue your speaking practice."
      footer={
        <>
          Don&apos;t have an account?{" "}
          <Link to="/register" className="font-semibold text-primary hover:underline">
            Create one
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" placeholder="you@example.com" autoComplete="email" {...register("email")} />
          <FieldError message={errors.email?.message} />
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Password</Label>
            <Link to="/forgot-password" className="text-[13px] font-semibold text-primary hover:underline">
              Forgot?
            </Link>
          </div>
          <PasswordInput id="password" placeholder="••••••••" autoComplete="current-password" {...register("password")} />
          <FieldError message={errors.password?.message} />
        </div>
        <Button type="submit" variant="gradient" size="lg" className="mt-1 w-full text-base" loading={isSubmitting}>
          Log in
        </Button>
      </form>

      <p className="mt-4 rounded-xl border border-border/60 bg-muted/40 px-3 py-2.5 text-center text-[13px] text-muted-foreground">
        Demo learner: <span className="font-semibold text-foreground">learner@ai-tutor.app</span> · Learner@123
      </p>
    </AuthShell>
  );
}
