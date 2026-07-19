import { api } from "@/lib/api";
import type {
  ChatTurnResponse,
  Conversation,
  ConversationDetail,
  ConversationMode,
  Paginated,
} from "@/types";

export const chatApi = {
  list: (page = 1, size = 20) =>
    api
      .get<Paginated<Conversation>>("/conversations", { params: { page, size } })
      .then((r) => r.data),

  get: (id: string) => api.get<ConversationDetail>(`/conversations/${id}`).then((r) => r.data),

  create: (mode: ConversationMode = "free_talk", title?: string) =>
    api.post<Conversation>("/conversations", { mode, title }).then((r) => r.data),

  remove: (id: string) => api.delete(`/conversations/${id}`).then((r) => r.data),

  turn: (text: string, conversationId?: string, mode: ConversationMode = "free_talk") =>
    api
      .post<ChatTurnResponse>("/conversations/turn", {
        text,
        conversation_id: conversationId,
        mode,
      })
      .then((r) => r.data),
};
