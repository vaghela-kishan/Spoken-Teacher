import { AnimatePresence, motion } from "framer-motion";

export function FieldError({ message }: { message?: string }) {
  return (
    <AnimatePresence>
      {message && (
        <motion.p
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className="mt-1 text-xs font-medium text-destructive"
        >
          {message}
        </motion.p>
      )}
    </AnimatePresence>
  );
}
