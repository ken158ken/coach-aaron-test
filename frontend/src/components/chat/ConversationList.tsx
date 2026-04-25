/**
 * ConversationList — 左欄對話清單
 * @module components/chat/ConversationList
 */

import React, { useMemo } from "react";
import { Link, useParams } from "react-router-dom";
import { format, isToday, isYesterday } from "date-fns";
import { zhTW } from "date-fns/locale";
import {
  type ChatConversation,
  getConversationName,
  previewText,
} from "@/services/chat.service";
import { useAuth } from "@/context/AuthContext";
import { usePresenceMany } from "@/hooks/usePresence";
import PresenceDot from "./PresenceDot";
import UnreadBadge from "./UnreadBadge";

interface ConversationListProps {
  conversations: ChatConversation[];
  loading: boolean;
  onNewChat?: () => void;
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  if (isToday(d)) return format(d, "HH:mm", { locale: zhTW });
  if (isYesterday(d)) return "昨天";
  return format(d, "MM/dd", { locale: zhTW });
}

const ConversationList: React.FC<ConversationListProps> = ({
  conversations,
  loading,
  onNewChat,
}) => {
  const { user } = useAuth();
  const { conversationId } = useParams();
  const me = Number(user?.user_id || 0);

  // 收集所有 DM 對方的 user_id 來查 presence
  const dmPartnerIds = useMemo(() => {
    const ids = new Set<number>();
    conversations.forEach((c) => {
      if (c.type !== "dm") return;
      (c.participants as { user_id: number }[] | undefined)?.forEach((u) => {
        if (u.user_id !== me) ids.add(u.user_id);
      });
    });
    return Array.from(ids);
  }, [conversations, me]);
  const presence = usePresenceMany(dmPartnerIds);

  return (
    <div className="flex flex-col h-full bg-surface border-r border-gold/15">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gold/15">
        <h2 className="font-medium">訊息</h2>
        {onNewChat && (
          <button
            onClick={onNewChat}
            className="p-1.5 rounded-lg text-muted hover:text-gold hover:bg-gold/10 transition-colors"
            title="新對話"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>
        )}
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {loading && (
          <div className="text-center py-12 text-muted text-sm">載入中...</div>
        )}
        {!loading && conversations.length === 0 && (
          <div className="text-center py-12 text-muted text-sm">
            尚無對話
            <br />
            <button
              onClick={onNewChat}
              className="mt-2 text-gold hover:underline"
            >
              開啟新對話
            </button>
          </div>
        )}
        {conversations.map((c) => {
          const name = getConversationName(c, me);
          const isActive = c.id === conversationId;
          const partner =
            c.type === "dm"
              ? (c.participants as { user_id: number }[] | undefined)?.find(
                  (u) => u.user_id !== me,
                )
              : null;
          const presenceStatus = partner
            ? presence.get(partner.user_id)?.status || "offline"
            : null;

          return (
            <Link
              key={c.id}
              to={`/chat/${c.id}`}
              className={`flex items-center gap-3 px-4 py-3 border-b border-gold/5 transition-colors ${
                isActive ? "bg-gold/10" : "hover:bg-gold/5"
              }`}
            >
              {/* Avatar */}
              <div className="relative shrink-0">
                <div className="w-10 h-10 rounded-full bg-gold/15 flex items-center justify-center text-gold font-medium">
                  {c.type === "group" ? "👥" : name.charAt(0).toUpperCase()}
                </div>
                {presenceStatus && (
                  <span className="absolute -bottom-0.5 -right-0.5">
                    <PresenceDot status={presenceStatus} />
                  </span>
                )}
              </div>

              {/* Body */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 mb-0.5">
                  <h3 className="font-medium text-sm truncate">{name}</h3>
                  {c.last_message && (
                    <span className="text-[10px] text-muted shrink-0">
                      {formatTime(c.last_message.created_at)}
                    </span>
                  )}
                </div>
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs text-muted truncate">
                    {c.last_message
                      ? previewText(c.last_message)
                      : "（尚無訊息）"}
                  </p>
                  <UnreadBadge count={c.unread_count || 0} />
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
};

export default ConversationList;
