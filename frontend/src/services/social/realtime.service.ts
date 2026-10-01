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

/**
 * 訂閱單一對話 channel；回傳 unsubscribe function。
 *
 * ⚠️ supabase-js 現在是動態 import（見 supabase.client.ts 的註解），
 *    所以訂閱本身是非同步的。對外仍保持「同步回傳 cleanup」的介面，
 *    讓 useEffect 的 return 不用改成 async：
 *      - 若在 client 還沒載好就先 unsubscribe（React 18 StrictMode
 *        的 mount→unmount→mount、或使用者快速切換對話），以 `cancelled`
 *        旗標讓 channel 建立後立刻被移除，不會留下殭屍訂閱。
 */
export function subscribeConversation(
  conversationId: string,
  opts: SubscribeOptions,
): () => void {
  let cancelled = false;
  let cleanup: (() => void) | null = null;

  void getSupabaseClient()
    .then((client) => {
      const channel: RealtimeChannel = client.channel(
        `conv-${conversationId}`,
        { config: { broadcast: { self: false } } },
      );
      cleanup = () => {
        void client.removeChannel(channel);
      };
      if (cancelled) {
        cleanup();
        return;
      }
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
    })
    .catch((err) => {
      console.warn("[realtime] Supabase client 載入失敗", err);
    });

  return () => {
    cancelled = true;
    cleanup?.();
    cleanup = null;
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
