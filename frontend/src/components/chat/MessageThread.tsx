/**
 * MessageThread — 右欄訊息流 + 輸入框
 * @module components/chat/MessageThread
 */

import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { getAuthToken } from "@/services/api";
import {
  chatService,
  type ChatConversation,
  type ChatMessage,
  type ChatParticipant,
  type ChatUser,
} from "@/services/social/chat.service";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { useConversationMessages } from "@/hooks/useChat";
import { usePresenceMany } from "@/hooks/usePresence";

import { subscribeConversation } from "@/services/social/realtime.service";
import MessageBubble from "./MessageBubble";
import MessageInput from "./MessageInput";
import PresenceDot from "./PresenceDot";
import UserAvatar from "./UserAvatar";
import GroupMembersModal from "./GroupMembersModal";
import {
  localizedConversationName,
  localizedLastSeen,
  localizedUserName,
} from "./chatNames";

interface MessageThreadProps {
  conversation: ChatConversation;
  onBack?: () => void;
  onAfterSend?: () => void;
  /** 對話內成員變動（加 / 踢 / 自己離開）後通知父頁面 */
  onConversationChanged?: () => void;
}

const MessageThread: React.FC<MessageThreadProps> = ({
  conversation,
  onBack,
  onAfterSend,
  onConversationChanged,
}) => {
  const [showMembers, setShowMembers] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [exportingFmt, setExportingFmt] = useState<string | null>(null);
  const hasLeft = !!conversation.my_left_at;
  const { user } = useAuth();
  const navigate = useNavigate();
  const { t, isZhTW } = useLanguage();
  const me = Number(user?.user_id || 0);
  const { messages, loading, appendLocal, replaceLocal, removeLocal } =
    useConversationMessages(conversation.id);
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

  // 對 DM 拿對方、群組拿所有非自己成員的 presence
  const trackedIds = useMemo(() => {
    const parts = conversation.participants as
      | (ChatParticipant | { user_id: number })[]
      | undefined;
    if (!parts) return [];
    return parts
      .map((p) =>
        ("user" in p ? (p as ChatParticipant).user.user_id : (p as { user_id: number }).user_id),
      )
      .filter((id) => id !== me);
  }, [conversation, me]);
  const presenceMap = usePresenceMany(trackedIds);

  const partnerPresence = dmPartner
    ? presenceMap.get((dmPartner as { user_id: number }).user_id)
    : null;

  /** 群組頭像聚合燈號 */
  const groupStatus: "online" | "away" | "offline" = useMemo(() => {
    if (conversation.type !== "group") return "offline";
    let any: "online" | "away" | "offline" = "offline";
    trackedIds.forEach((id) => {
      const s = presenceMap.get(id)?.status;
      if (s === "online") any = "online";
      else if (s === "away" && any !== "online") any = "away";
    });
    return any;
  }, [conversation.type, trackedIds, presenceMap]);

  // sender_id → user map（給群組顯示寄件人名 + 頭像）
  const senderMap = useMemo(() => {
    const m = new Map<number, ChatUser>();
    const parts = conversation.participants as ChatParticipant[] | undefined;
    parts?.forEach((p) => {
      if ("user" in p) m.set(p.user.user_id, p.user);
    });
    return m;
  }, [conversation]);

  const senderNameOf = (id: number): string =>
    localizedUserName(senderMap.get(id), t);

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

  // 訂閱群組成員變動 → 通知父頁面 reload conversation（拉新的 participants）
  useEffect(() => {
    if (conversation.type !== "group") return;
    const unsub = subscribeConversation(conversation.id, {
      onMembersChanged: () => onConversationChanged?.(),
    });
    return unsub;
  }, [conversation.id, conversation.type, onConversationChanged]);

  const handleExport = useCallback(async (format: string) => {
    const token = getAuthToken();
    if (!token) return;
    setExportingFmt(format);
    setShowExportMenu(false);
    try {
      const res = await fetch(`/api/export/chat/${conversation.id}?format=${format}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(t.memberCenter.downloadFailed);
      const disposition = res.headers.get("content-disposition") || "";
      const match = disposition.match(/filename\*=UTF-8''(.+)/i);
      const filename = match
        ? decodeURIComponent(match[1])
        : `${t.memberCenter.chatFilePrefix}_${conversation.id.slice(0, 8)}.${format}`;
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      // 靜默失敗
    } finally {
      setExportingFmt(null);
    }
  }, [conversation.id, t]);

  const handleSend = async (data: { content: string; image: File | null }) => {
    // 樂觀更新：立刻把訊息放進去，不等 server roundtrip
    const tempId = -Date.now();
    const tempUrl = data.image ? URL.createObjectURL(data.image) : null;
    const optimistic: ChatMessage = {
      id: tempId,
      conversation_id: conversation.id,
      sender_id: me,
      content: data.content,
      image_url: tempUrl,
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      created_at: new Date().toISOString(),
    };
    appendLocal(optimistic);

    try {
      const real = await chatService.sendMessage(conversation.id, data);
      replaceLocal(tempId, real);
      // 釋放 blob URL
      if (tempUrl) URL.revokeObjectURL(tempUrl);
      onAfterSend?.();
    } catch (err) {
      removeLocal(tempId);
      if (tempUrl) URL.revokeObjectURL(tempUrl);
      throw err;
    }
  };

  const headerName = localizedConversationName(conversation, me, t);
  const headerSub =
    conversation.type === "dm" && partnerPresence
      ? localizedLastSeen(partnerPresence.last_seen_at, t, isZhTW)
      : conversation.type === "group"
        ? t.chatUi.memberCount.replace(
            "{count}",
            String((conversation.participants as ChatParticipant[]).length),
          )
        : "";

  return (
    <div className="flex flex-col h-full bg-surface">
      {/* Header */}
      <div
        className="flex items-center gap-3 px-4 py-3 border-b border-gold/15 shrink-0"
        data-tour="chat-thread-header"
      >
        {onBack && (
          <button
            data-tour="chat-back"
            onClick={onBack}
            className="p-1.5 rounded-lg text-muted hover:text-gold hover:bg-gold/10 transition-colors lg:hidden"
            title={t.common.back}
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
          {/* DM 用對方狀態，群組用聚合狀態 */}
          {conversation.type === "dm" && partnerPresence && (
            <span className="absolute -bottom-0.5 -right-0.5">
              <PresenceDot status={partnerPresence.status} />
            </span>
          )}
          {conversation.type === "group" && (
            <span className="absolute -bottom-0.5 -right-0.5">
              <PresenceDot status={groupStatus} />
            </span>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-medium truncate">{headerName}</h3>
          {headerSub && <p className="text-xs text-muted">{headerSub}</p>}
        </div>
        {/* 群組才顯示「查看成員」 */}
        {conversation.type === "group" && (
          <button
            onClick={() => setShowMembers(true)}
            className="p-1.5 rounded-lg text-muted hover:text-gold hover:bg-gold/10 transition-colors"
            title={t.chatUi.viewMembers}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          </button>
        )}
        {/* 匯出下拉 */}
        <div className="relative">
          <button
            data-tour="chat-export"
            onClick={() => setShowExportMenu((v) => !v)}
            disabled={exportingFmt !== null}
            className="p-1.5 rounded-lg text-muted hover:text-gold hover:bg-gold/10 transition-colors"
            title={t.exportFeature.exportConversation}
          >
            {exportingFmt ? (
              <span className="w-5 h-5 flex items-center justify-center">
                <span className="w-3.5 h-3.5 border border-t-transparent border-gold rounded-full animate-spin" />
              </span>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
            )}
          </button>
          {showExportMenu && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowExportMenu(false)} />
              <div className="absolute right-0 top-9 z-20 w-44 bg-surface border border-gold/20 rounded-xl shadow-xl overflow-hidden">
                <p className="px-3 py-2 text-[10px] text-muted uppercase tracking-widest border-b border-gold/10">
                  {t.exportFeature.exportFormat}
                </p>
                {[
                  { fmt: "txt", label: t.exportFeature.formatTxt },
                  { fmt: "md", label: t.exportFeature.formatMd },
                  { fmt: "xlsx", label: t.exportFeature.formatXlsx },
                  { fmt: "docx", label: t.exportFeature.formatDocx },
                ].map(({ fmt, label }) => (
                  <button
                    key={fmt}
                    onClick={() => handleExport(fmt)}
                    className="w-full text-left px-3 py-2.5 text-sm text-muted hover:text-gold hover:bg-gold/10 transition-colors"
                  >
                    {label}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        <button
          onClick={() => navigate("/chat")}
          className="p-1.5 rounded-lg text-muted hover:text-gold hover:bg-gold/10 transition-colors hidden lg:block"
          title={t.chatUi.close}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Messages */}
      <div
        ref={scrollRef}
        data-tour="chat-messages"
        className="flex-1 overflow-y-auto px-3 py-3"
      >
        {loading && (
          <div className="text-center py-8 text-muted text-sm">
            {t.common.loading}
          </div>
        )}
        {!loading && messages.length === 0 && (
          <div className="text-center py-12 text-muted text-sm">
            {t.chatUi.noMessagesGreeting}
          </div>
        )}
        {messages.map((msg: ChatMessage, idx: number) => {
          const isMine = msg.sender_id === me;
          const prev = messages[idx - 1];
          const next = messages[idx + 1];
          const samePrev = prev && prev.sender_id === msg.sender_id;
          const sameNext = next && next.sender_id === msg.sender_id;
          const sender = senderMap.get(msg.sender_id) || null;
          const senderStatus =
            sender && sender.user_id !== me
              ? presenceMap.get(sender.user_id)?.status
              : undefined;
          return (
            <MessageBubble
              key={msg.id}
              msg={msg}
              isMine={isMine}
              senderName={senderNameOf(msg.sender_id)}
              showSenderName={
                conversation.type === "group" && !isMine && !samePrev
              }
              showSenderAvatar={
                conversation.type === "group" && !isMine && !sameNext
              }
              sender={sender}
              senderStatus={senderStatus}
            />
          );
        })}
      </div>

      {/* Input — 已離開群組則顯示說明而非輸入框 */}
      {hasLeft ? (
        <div className="border-t border-gold/15 bg-surface-2/40 px-4 py-3 text-center text-sm text-muted">
          {t.chatUi.leftGroupNotice}
        </div>
      ) : (
        <MessageInput onSend={handleSend} />
      )}

      {/* 群組成員管理 modal */}
      {conversation.type === "group" && (
        <GroupMembersModal
          isOpen={showMembers}
          onClose={() => setShowMembers(false)}
          conversation={conversation}
          onChanged={onConversationChanged}
          onSelfLeft={() => navigate("/chat")}
        />
      )}
    </div>
  );
};

export default MessageThread;
