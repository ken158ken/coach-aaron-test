/**
 * MessageThread — 右欄訊息流 + 輸入框
 * @module components/chat/MessageThread
 */

import React, { useEffect, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  chatService,
  type ChatConversation,
  type ChatMessage,
  type ChatParticipant,
  type ChatUser,
  getConversationName,
} from "@/services/chat.service";
import { useAuth } from "@/context/AuthContext";
import { useConversationMessages } from "@/hooks/useChat";
import { usePresenceMany } from "@/hooks/usePresence";
import { formatLastSeen } from "@/services/presence.service";
import MessageBubble from "./MessageBubble";
import MessageInput from "./MessageInput";
import PresenceDot from "./PresenceDot";
import UserAvatar from "./UserAvatar";

interface MessageThreadProps {
  conversation: ChatConversation;
  onBack?: () => void;
  onAfterSend?: () => void;
}

const MessageThread: React.FC<MessageThreadProps> = ({
  conversation,
  onBack,
  onAfterSend,
}) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const me = Number(user?.user_id || 0);
  const { messages, loading, appendLocal } = useConversationMessages(conversation.id);
  const scrollRef = useRef<HTMLDivElement>(null);

  // 對方 ID（DM 用）
  const dmPartner = useMemo(() => {
    if (conversation.type !== "dm") return null;
    const parts = conversation.participants as
      | (ChatParticipant | { user_id: number })[]
      | undefined;
    if (!parts) return null;
    return parts
      .map((p) =>
        "user" in p
          ? (p as ChatParticipant).user
          : (p as { user_id: number }),
      )
      .find((u) => u && (u as { user_id: number }).user_id !== me);
  }, [conversation, me]);

  const partnerIds = dmPartner ? [(dmPartner as { user_id: number }).user_id] : [];
  const presenceMap = usePresenceMany(partnerIds);
  const partnerPresence = dmPartner
    ? presenceMap.get((dmPartner as { user_id: number }).user_id)
    : null;

  // sender_id → name map（給群組顯示寄件人名）
  const senderNameMap = useMemo(() => {
    const m = new Map<number, string>();
    const parts = conversation.participants as ChatParticipant[] | undefined;
    parts?.forEach((p) => {
      if ("user" in p) {
        const u = p.user;
        m.set(
          u.user_id,
          u.admin_display_name || u.display_name || u.name || "用戶",
        );
      }
    });
    return m;
  }, [conversation]);

  // 新訊息進來自動捲到底
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [messages.length]);

  // 開頁就標已讀
  useEffect(() => {
    chatService.markRead(conversation.id).catch(() => {});
  }, [conversation.id]);

  const handleSend = async (data: { content: string; image: File | null }) => {
    const msg = await chatService.sendMessage(conversation.id, {
      content: data.content,
      image: data.image,
    });
    appendLocal(msg);
    onAfterSend?.();
  };

  const headerName = getConversationName(conversation, me);
  const headerSub =
    conversation.type === "dm" && partnerPresence
      ? formatLastSeen(partnerPresence.last_seen_at)
      : conversation.type === "group"
        ? `${(conversation.participants as ChatParticipant[]).length} 位成員`
        : "";

  return (
    <div className="flex flex-col h-full bg-surface">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-gold/15 shrink-0">
        {onBack && (
          <button
            onClick={onBack}
            className="p-1.5 rounded-lg text-muted hover:text-gold hover:bg-gold/10 transition-colors lg:hidden"
            title="返回"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        )}
        <div className="relative shrink-0">
          {conversation.type === "group" ? (
            <div className="w-9 h-9 rounded-full bg-gold/15 flex items-center justify-center text-gold font-medium">
              👥
            </div>
          ) : dmPartner ? (
            <UserAvatar user={dmPartner as ChatUser} size="md" />
          ) : (
            <div className="w-9 h-9 rounded-full bg-gold/15 flex items-center justify-center text-gold font-medium">
              {headerName.charAt(0).toUpperCase()}
            </div>
          )}
          {partnerPresence && (
            <span className="absolute -bottom-0.5 -right-0.5">
              <PresenceDot status={partnerPresence.status} />
            </span>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-medium truncate">{headerName}</h3>
          {headerSub && <p className="text-xs text-muted">{headerSub}</p>}
        </div>
        <button
          onClick={() => navigate("/chat")}
          className="p-1.5 rounded-lg text-muted hover:text-gold hover:bg-gold/10 transition-colors hidden lg:block"
          title="關閉"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 py-3">
        {loading && (
          <div className="text-center py-8 text-muted text-sm">載入中...</div>
        )}
        {!loading && messages.length === 0 && (
          <div className="text-center py-12 text-muted text-sm">
            尚無訊息，打個招呼吧
          </div>
        )}
        {messages.map((msg: ChatMessage, idx: number) => {
          const isMine = msg.sender_id === me;
          const prev = messages[idx - 1];
          const samePrev = prev && prev.sender_id === msg.sender_id;
          return (
            <MessageBubble
              key={msg.id}
              msg={msg}
              isMine={isMine}
              senderName={senderNameMap.get(msg.sender_id)}
              showSenderName={
                conversation.type === "group" && !isMine && !samePrev
              }
            />
          );
        })}
      </div>

      {/* Input */}
      <MessageInput onSend={handleSend} />
    </div>
  );
};

export default MessageThread;
