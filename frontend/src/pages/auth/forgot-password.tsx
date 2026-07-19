import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { MailCheck } from "lucide-react";
import * as React from "react";
import { useForm } from "react-hook-form";
import { Link } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { FieldError } from "@/components/ui/field-error";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authApi } from "@/features/auth/api";
import { type ForgotValues, forgotSchema } from "@/features/auth/schemas";
import { AuthShell } from "@/pages/auth/auth-shell";

export default function ForgotPasswordPage() {
  const [sent, setSent] = React.useState(false);
  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors },
  } = useForm<ForgotValues>({ resolver: zodResolver(forgotSchema) });

  const mutation = useMutation({
    mutationFn: (v: ForgotValues) => authApi.forgotPassword(v.email),
    onSuccess: () => setSent(true),
  });

  return (
    <AuthShell
      title="Forgot password"
      subtitle="We'll email you a secure link to reset it."
      footer={
        <Link to="/login" className="font-semibold text-primary hover:underline">
          Back to log in
        </Link>
      }
    >
      {sent ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center gap-4 py-4 text-center">
          <div className="grid size-16 place-items-center rounded-2xl bg-success/15 text-success">
            <MailCheck className="size-8" />
          </div>
          <p className="text-sm text-muted-foreground">
            If <span className="font-medium text-foreground">{getValues("email")}</span> is registered, a reset link is on its way.
          </p>
        </motion.div>
      ) : (
        <form onSubmit={handleSubmit((v) => mutation.mutate(v))} className="space-y-4">
          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" placeholder="you@example.com" {...register("email")} />
            <FieldError message={errors.email?.message} />
          </div>
          <Button type="submit" variant="gradient" size="lg" className="w-full" loading={mutation.isPending}>
            Send reset link
          </Button>
        </form>
      )}
    </AuthShell>
  );
}
