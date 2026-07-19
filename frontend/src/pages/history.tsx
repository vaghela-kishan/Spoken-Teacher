import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { History, MessageSquare, Trash2 } from "lucide-react";
import * as React from "react";

import { EmptyState } from "@/components/common/empty-state";
import { ListSkeleton } from "@/components/common/loaders";
import { PageHeader } from "@/components/common/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "@/components/ui/sonner";
import { chatApi } from "@/features/chat/api";
import { ChatMessage } from "@/features/voice/components/chat-message";
import { qk } from "@/lib/queryClient";
import { formatDuration, timeAgo } from "@/lib/utils";

export default function HistoryPage() {
  const [page, setPage] = React.useState(1);
  const [openId, setOpenId] = React.useState<string | null>(null);
  const qc = useQueryClient();

  const listQ = useQuery({ queryKey: qk.conversations(page), queryFn: () => chatApi.list(page, 12) });
  const detailQ = useQuery({
    queryKey: qk.conversation(openId ?? ""),
    queryFn: () => chatApi.get(openId!),
    enabled: !!openId,
  });

  const del = useMutation({
    mutationFn: (id: string) => chatApi.remove(id),
    onSuccess: () => {
      toast.success("Conversation deleted");
      // If we just removed the last item on this page, step back so the user
      // isn't stranded on a now-empty / out-of-range page.
      if (listQ.data && listQ.data.items.length === 1 && page > 1) setPage((p) => p - 1);
      qc.invalidateQueries({ queryKey: ["conversations"] });
    },
  });

  return (
    <div>
      <PageHeader title="Chat History" subtitle="Review and replay your past speaking sessions." />

      {listQ.isLoading ? (
        <ListSkeleton rows={6} />
      ) : listQ.data && listQ.data.items.length > 0 ? (
        <>
          <div className="grid gap-3 sm:grid-cols-2">
            {listQ.data.items.map((c, i) => (
              <motion.div key={c.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
                <GlassCard className="card-hover flex items-center justify-between gap-3 p-4">
                  <button className="min-w-0 flex-1 text-left" onClick={() => setOpenId(c.id)}>
                    <div className="flex items-center gap-2">
                      <div className="grid size-9 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
                        <MessageSquare className="size-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate font-medium">{c.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {c.message_count} messages · {formatDuration(c.duration_seconds)} · {timeAgo(c.updated_at)}
                        </p>
                      </div>
                    </div>
                  </button>
                  <div className="flex items-center gap-2">
                    {c.avg_overall_score != null && (
                      <Badge variant={c.avg_overall_score >= 80 ? "success" : "warning"}>
                        {Math.round(c.avg_overall_score)}
                      </Badge>
                    )}
                    <Button variant="ghost" size="icon" onClick={() => del.mutate(c.id)} aria-label="Delete">
                      <Trash2 className="size-4 text-muted-foreground hover:text-destructive" />
                    </Button>
                  </div>
                </GlassCard>
              </motion.div>
            ))}
          </div>

          {listQ.data.pages > 1 && (
            <div className="mt-6 flex items-center justify-center gap-3">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                Previous
              </Button>
              <span className="text-sm text-muted-foreground">
                Page {page} of {listQ.data.pages}
              </span>
              <Button variant="outline" size="sm" disabled={page >= listQ.data.pages} onClick={() => setPage((p) => p + 1)}>
                Next
              </Button>
            </div>
          )}
        </>
      ) : (
        <EmptyState
          icon={History}
          title="No conversations yet"
          description="Head to Voice Chat and start speaking — your sessions will be saved here."
        />
      )}

      {/* Transcript dialog */}
      <Dialog open={!!openId} onOpenChange={(o) => !o && setOpenId(null)}>
        <DialogContent className="max-h-[85vh] max-w-2xl overflow-hidden">
          <DialogHeader>
            <DialogTitle>{detailQ.data?.title ?? "Conversation"}</DialogTitle>
            <DialogDescription>
              {detailQ.data ? `${detailQ.data.message_count} messages` : "Loading…"}
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-[60vh] space-y-4 overflow-y-auto pr-1">
            {detailQ.data?.messages.map((m) => (
              <div key={m.id}>
                <ChatMessage message={m} />
                {m.correction && m.correction.original_text !== m.correction.corrected_text && (
                  <div className="ml-11 mt-1 rounded-lg bg-muted/40 p-2 text-xs">
                    <span className="text-destructive line-through">{m.correction.original_text}</span>
                    <span className="mx-1.5">→</span>
                    <span className="font-medium text-success">{m.correction.corrected_text}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
