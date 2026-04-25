/**
 * Realtime 訂閱封裝
 * @module services/realtime.service
 *
 * 模式：每個對話一個 channel `conv-{uuid}`
 * 後端寫入訊息後用 service_role 在該 channel broadcast 'new_message' 事件
 */

import type { RealtimeChannel } from "@supabase/supabase-js";
import { getSupabaseClient } from "./supabase.client";
import type { ChatMessage } from "./chat.service";

type NewMessageHandler = (msg: ChatMessage) => void;
type MembersChangedHandler = (data: {
  type: "added" | "removed";
  userIds: number[];
}) => void;

interface SubscribeOptions {
  onNewMessage?: NewMessageHandler;
  onMembersChanged?: MembersChangedHandler;
}

/** 訂閱單一對話 channel；回傳 unsubscribe function */
export function subscribeConversation(
  conversationId: string,
  opts: SubscribeOptions,
): () => void {
  const client = getSupabaseClient();
  const channel: RealtimeChannel = client.channel(`conv-${conversationId}`, {
    config: { broadcast: { self: false } },
  });
  if (opts.onNewMessage) {
    channel.on("broadcast", { event: "new_message" }, ({ payload }) => {
      opts.onNewMessage!(payload as ChatMessage);
    });
  }
  if (opts.onMembersChanged) {
    channel.on("broadcast", { event: "members_changed" }, ({ payload }) => {
      opts.onMembersChanged!(
        payload as { type: "added" | "removed"; userIds: number[] },
      );
    });
  }
  channel.subscribe();
  return () => {
    void client.removeChannel(channel);
  };
}

/** 一次訂閱多個對話（給全域通知用）*/
export function subscribeMany(
  conversationIds: string[],
  onMessage: NewMessageHandler,
): () => void {
  const unsubs = conversationIds.map((id) =>
    subscribeConversation(id, { onNewMessage: onMessage }),
  );
  return () => unsubs.forEach((u) => u());
}
