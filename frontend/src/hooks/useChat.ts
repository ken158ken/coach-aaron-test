/**
 * useChat — 載入對話清單、訊息、訂閱新訊息
 * @module hooks/useChat
 */

import { useCallback, useEffect, useRef, useState } from "react";
import {
  chatService,
  type ChatConversation,
  type ChatMessage,
} from "@/services/chat.service";
import { subscribeConversation } from "@/services/realtime.service";

/** 載自己的對話清單 + 提供 refresh */
export function useConversations(): {
  conversations: ChatConversation[];
  loading: boolean;
  refresh: () => Promise<void>;
} {
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      const data = await chatService.listConversations();
      setConversations(data);
    } catch (err) {
      console.error("載入對話失敗", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { conversations, loading, refresh };
}

/** 載某對話的訊息 + 訂閱新訊息 */
export function useConversationMessages(conversationId: string | null): {
  messages: ChatMessage[];
  loading: boolean;
  appendLocal: (m: ChatMessage) => void;
  refresh: () => Promise<void>;
} {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const seenIds = useRef<Set<number>>(new Set());

  const refresh = useCallback(async () => {
    if (!conversationId) {
      setMessages([]);
      seenIds.current.clear();
      return;
    }
    try {
      setLoading(true);
      const data = await chatService.getMessages(conversationId, { limit: 50 });
      seenIds.current = new Set(data.map((m) => m.id));
      setMessages(data);
    } catch (err) {
      console.error("載入訊息失敗", err);
    } finally {
      setLoading(false);
    }
  }, [conversationId]);

  const appendLocal = useCallback((m: ChatMessage) => {
    if (seenIds.current.has(m.id)) return;
    seenIds.current.add(m.id);
    setMessages((prev) => [...prev, m]);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // Realtime 訂閱
  useEffect(() => {
    if (!conversationId) return;
    const unsub = subscribeConversation(conversationId, {
      onNewMessage: (m) => appendLocal(m),
    });
    return unsub;
  }, [conversationId, appendLocal]);

  return { messages, loading, appendLocal, refresh };
}
