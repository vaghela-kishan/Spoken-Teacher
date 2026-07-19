import * as React from "react";

import { metaApi } from "@/features/progress/api";

/** Periodically ping the backend so the user counts as "online". */
export function usePresenceHeartbeat(intervalMs = 30_000) {
  React.useEffect(() => {
    let active = true;
    const beat = () => {
      if (active) metaApi.heartbeat().catch(() => {});
    };
    beat();
    const id = setInterval(beat, intervalMs);
    return () => {
      active = false;
      clearInterval(id);
    };
  }, [intervalMs]);
}
