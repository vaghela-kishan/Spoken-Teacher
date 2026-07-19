import { Toaster as Sonner } from "sonner";

import { useTheme } from "@/components/theme/theme-provider";

/** Theme-aware toast host. Use the exported `toast` from `sonner` directly. */
export function Toaster() {
  const { resolvedTheme } = useTheme();
  return (
    <Sonner
      theme={resolvedTheme}
      position="top-right"
      richColors
      closeButton
      toastOptions={{
        classNames: {
          toast: "rounded-xl border border-border shadow-lg",
        },
      }}
    />
  );
}

export { toast } from "sonner";
