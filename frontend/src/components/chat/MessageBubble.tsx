/**
 * MessageBubble — 單一訊息泡泡
 * @module components/chat/MessageBubble
 */

import React from "react";
import { format, isToday, isYesterday } from "date-fns";
import { zhTW } from "date-fns/locale";
import type { ChatMessage } from "@/services/chat.service";

interface MessageBubbleProps {
  msg: ChatMessage;
  isMine: boolean;
  /** 在群組裡顯示寄件人名（DM 不需要）*/
  senderName?: string;
  showSenderName?: boolean;
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  if (isToday(d)) return format(d, "HH:mm", { locale: zhTW });
  if (isYesterday(d)) return "昨天 " + format(d, "HH:mm", { locale: zhTW });
  return format(d, "MM/dd HH:mm", { locale: zhTW });
}

const MessageBubble: React.FC<MessageBubbleProps> = ({
  msg,
  isMine,
  senderName,
  showSenderName,
}) => {
  return (
    <div className={`flex ${isMine ? "justify-end" : "justify-start"} mb-2`}>
      <div
        className={`max-w-[75%] sm:max-w-[60%] ${
          isMine ? "items-end" : "items-start"
        } flex flex-col gap-1`}
      >
        {showSenderName && !isMine && senderName && (
          <span className="text-xs text-muted px-1">{senderName}</span>
        )}
        <div
          className={`rounded-2xl px-4 py-2.5 ${
            isMine
              ? "bg-gold text-black rounded-br-md"
              : "bg-surface-2 border border-gold/15 rounded-bl-md"
          }`}
        >
          {msg.image_url && (
            <a
              href={msg.image_url}
              target="_blank"
              rel="noopener noreferrer"
              className="block"
            >
              <img
                src={msg.image_url}
                alt="附圖"
                className="rounded-lg max-h-64 max-w-full object-contain"
                loading="lazy"
              />
            </a>
          )}
          {msg.content && (
            <p
              className={`whitespace-pre-wrap break-words text-sm ${
                msg.image_url ? "mt-2" : ""
              }`}
            >
              {msg.content}
            </p>
          )}
        </div>
        <span className="text-[10px] text-muted px-1">
          {formatTime(msg.created_at)}
        </span>
      </div>
    </div>
  );
};

export default MessageBubble;
