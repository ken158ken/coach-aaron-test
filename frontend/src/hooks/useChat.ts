/**
 * useChat — 載入對話清單、訊息、訂閱新訊息
 * @module hooks/useChat
 */

import { useCallback, useEffect, useRef, useState } from "react";
import {
  chatService,
  type ChatConversation,
  type ChatMessage,
} from "@/services/social/chat.service";
import { subscribeConversation } from "@/services/social/realtime.service";

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

/** 載某對話的訊息 + 訂閱新訊息 + 樂觀更新工具 */
export function useConversationMessages(conversationId: string | null): {
  messages: ChatMessage[];
  loading: boolean;
  appendLocal: (m: ChatMessage) => void;
  /** 用真實訊息替換樂觀更新的暫時訊息（依 tempId） */
  replaceLocal: (tempId: number, real: ChatMessage) => void;
  /** 移除暫時訊息（送出失敗時呼叫） */
  removeLocal: (id: number) => void;
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
    if (!m || typeof m.id !== "number") return;
    if (seenIds.current.has(m.id)) return;
    seenIds.current.add(m.id);
    setMessages((prev) => [...prev, m]);
  }, []);

  const replaceLocal = useCallback(
    (tempId: number, real: ChatMessage) => {
      seenIds.current.delete(tempId);
      seenIds.current.add(real.id);
      setMessages((prev) =>
        prev.map((m) => (m.id === tempId ? real : m)),
      );
    },
    [],
  );

  const removeLocal = useCallback((id: number) => {
    seenIds.current.delete(id);
    setMessages((prev) => prev.filter((m) => m.id !== id));
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

  return { messages, loading, appendLocal, replaceLocal, removeLocal, refresh };
}
