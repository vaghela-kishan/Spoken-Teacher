import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { authApi } from "@/features/auth/api";
import { AuthShell } from "@/pages/auth/auth-shell";

export default function VerifyEmailPage() {
  const [params] = useSearchParams();
  const token = params.get("token") ?? "";

  const { isPending, isError, isSuccess } = useQuery({
    queryKey: ["verify-email", token],
    queryFn: () => authApi.verifyEmail(token),
    enabled: !!token,
    retry: false,
  });

  return (
    <AuthShell title="Email verification" subtitle="Confirming your email address.">
      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center gap-4 py-6 text-center">
        {(!token || isError) && (
          <>
            <div className="grid size-16 place-items-center rounded-2xl bg-destructive/15 text-destructive">
              <XCircle className="size-8" />
            </div>
            <p className="text-sm text-muted-foreground">This verification link is invalid or has expired.</p>
            <Link to="/app">
              <Button variant="outline">Go to dashboard</Button>
            </Link>
          </>
        )}
        {token && isPending && (
          <>
            <Loader2 className="size-10 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Verifying…</p>
          </>
        )}
        {isSuccess && (
          <>
            <div className="grid size-16 place-items-center rounded-2xl bg-success/15 text-success">
              <CheckCircle2 className="size-8" />
            </div>
            <p className="text-sm text-muted-foreground">Your email is verified. Welcome aboard! 🎉</p>
            <Link to="/app">
              <Button variant="gradient">Start speaking</Button>
            </Link>
          </>
        )}
      </motion.div>
    </AuthShell>
  );
}
