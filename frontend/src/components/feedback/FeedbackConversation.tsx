/**
 * 反饋對話串（氣泡）
 * @module components/feedback/FeedbackConversation
 *
 * 意見反饋 = 開發者(developer) ↔ 教練(coach) 的內部溝通。
 * 視角決定左右：author_role === viewerRole 的訊息靠右（自己這邊），其餘靠左。
 *   以開發者身分檢視：開發者(developer) 靠右、教練(coach) 靠左
 *   以教練身分檢視：教練(coach) 靠右、開發者(developer) 靠左
 *
 * 編輯／刪除只提供給「自己送出的訊息」（後端也只放行作者本人）。
 */

import React, { useState } from "react";
import type {
  FeedbackMessage,
  AuthorRole,
} from "@/services/feedback/feedback.service";
import { FeedbackImageThumb } from "./FeedbackImage";

export interface ConversationLabels {
  roleDeveloper: string;
  roleCoach: string;
  edited: string;
  edit: string;
  delete: string;
  save: string;
  cancel: string;
}

interface Props {
  messages: FeedbackMessage[];
  viewerRole: AuthorRole;
  theme?: "studio" | "luxe";
  labels: ConversationLabels;
  formatTime: (iso: string) => string;
  onImageClick: (imageId: string, fileName?: string) => void;
  /** 提供時，會員本人的 member 訊息顯示編輯 / 刪除 */
  onEditMessage?: (id: string, content: string) => Promise<void>;
  onDeleteMessage?: (id: string) => void;
}

const FeedbackConversation: React.FC<Props> = ({
  messages,
  viewerRole,
  theme = "studio",
  labels,
  formatTime,
  onImageClick,
  onEditMessage,
  onDeleteMessage,
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [saving, setSaving] = useState(false);

  const isLuxe = theme === "luxe";
  const muted = isLuxe ? "text-luxe-muted" : "text-muted";
  const nameColor = isLuxe ? "text-luxe-text" : "text-inherit";

  const bubbleOwn = isLuxe
    ? "bg-luxe-gold/15 text-luxe-text border border-luxe-gold/25"
    : "bg-gold/15 text-inherit border border-gold/25";
  const bubbleOther = isLuxe
    ? "bg-luxe-bg/50 text-luxe-text border border-luxe-gold/10"
    : "bg-surface text-inherit border border-gold/10";
  const avatarOwn = isLuxe ? "bg-luxe-gold/25 text-luxe-gold" : "bg-gold/25 text-gold";
  const avatarOther = isLuxe
    ? "bg-luxe-bg text-luxe-muted border border-luxe-gold/15"
    : "bg-surface text-muted border border-gold/15";

  const startEdit = (m: FeedbackMessage) => {
    setEditingId(m.id);
    setEditText(m.content);
  };

  const submitEdit = async (id: string) => {
    if (!onEditMessage || !editText.trim()) return;
    try {
      setSaving(true);
      await onEditMessage(id, editText.trim());
      setEditingId(null);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5" data-tour="feedback-conversation">
      {messages.map((m) => {
        const own = m.author_role === viewerRole;
        const roleLabel =
          m.author_role === "developer" ? labels.roleDeveloper : labels.roleCoach;
        const avatarChar = (m.author_name || roleLabel).trim().charAt(0) || "?";
        // 只能管理自己送出的訊息（後端也只放行作者本人）
        const canManage = own && !!onEditMessage;
        const isEditing = editingId === m.id;
        const wasEdited = m.updated_at && m.updated_at !== m.created_at;

        return (
          <div
            key={m.id}
            className={`flex gap-2.5 ${own ? "flex-row-reverse" : "flex-row"}`}
          >
            {/* 頭像 */}
            <span
              className={`shrink-0 w-9 h-9 rounded-full flex items-center justify-center text-sm font-medium ${
                own ? avatarOwn : avatarOther
              }`}
              aria-hidden="true"
            >
              {avatarChar}
            </span>

            <div className={`min-w-0 max-w-[78%] ${own ? "items-end" : "items-start"} flex flex-col`}>
              {/* 名稱 + 時間 */}
              <div
                className={`flex items-center gap-2 mb-1 text-[11px] ${muted} ${
                  own ? "flex-row-reverse" : ""
                }`}
              >
                <span className={`font-medium ${nameColor}`}>{m.author_name}</span>
                <span className="opacity-60">{roleLabel}</span>
                <span>·</span>
                <span>{formatTime(m.created_at)}</span>
                {wasEdited && <span className="opacity-60">({labels.edited})</span>}
              </div>

              {/* 氣泡 */}
              {isEditing ? (
                <div className={`w-full rounded-2xl p-2.5 ${bubbleOwn}`}>
                  <textarea
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                    rows={3}
                    className={`w-full bg-transparent resize-y text-sm outline-none ${nameColor}`}
                  />
                  <div className="flex justify-end gap-2 mt-2">
                    <button
                      type="button"
                      onClick={() => setEditingId(null)}
                      className={`text-xs px-2 py-1 rounded ${muted} hover:opacity-80`}
                    >
                      {labels.cancel}
                    </button>
                    <button
                      type="button"
                      disabled={saving || !editText.trim()}
                      onClick={() => submitEdit(m.id)}
                      className={`text-xs px-3 py-1 rounded ${
                        isLuxe ? "bg-luxe-gold/20 text-luxe-gold" : "bg-gold/20 text-gold"
                      } disabled:opacity-40`}
                    >
                      {labels.save}
                    </button>
                  </div>
                </div>
              ) : (
                <div
                  className={`rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed whitespace-pre-wrap break-words ${
                    own ? bubbleOwn : bubbleOther
                  } ${own ? "rounded-tr-sm" : "rounded-tl-sm"}`}
                >
                  {m.content && <span>{m.content}</span>}
                  {m.images.length > 0 && (
                    <div className={`flex flex-wrap gap-2 ${m.content ? "mt-2" : ""}`}>
                      {m.images.map((img) => (
                        <FeedbackImageThumb
                          key={img.id}
                          imageId={img.id}
                          alt={img.original_name || ""}
                          theme={theme}
                          className="w-24 h-24 sm:w-28 sm:h-28"
                          onClick={() =>
                            onImageClick(img.id, img.original_name || undefined)
                          }
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* 編輯 / 刪除（自己的 member 訊息）*/}
              {canManage && !isEditing && (
                <div className={`flex gap-3 mt-1 text-[11px] ${muted}`}>
                  <button
                    type="button"
                    onClick={() => startEdit(m)}
                    className="hover:opacity-80"
                    data-tour="feedback-msg-edit"
                  >
                    ✎ {labels.edit}
                  </button>
                  {onDeleteMessage && (
                    <button
                      type="button"
                      onClick={() => onDeleteMessage(m.id)}
                      className="hover:text-red-500"
                    >
                      🗑 {labels.delete}
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default FeedbackConversation;
