/**
 * GroupMembersModal — 群組成員管理
 * @module components/chat/GroupMembersModal
 *
 * 用途：
 *   - 列出目前群組成員（含頭像 + 在線狀態 + admin 標籤）
 *   - admin 可以新增成員（搜尋後加入）+ 移除任意成員
 *   - 一般成員可查看 + 自己離開
 */

import React, { useEffect, useMemo, useState } from "react";
import { Modal, Input, PillButton, useDialog } from "@/components/ui";
import {
  chatService,
  type ChatConversation,
  type ChatParticipant,
  type ChatUser,
} from "@/services/social/chat.service";
import { useAuth } from "@/context/AuthContext";
import { usePresenceMany } from "@/hooks/usePresence";
import { useLanguage } from "@/context/LanguageContext";
import type { AllTranslations } from "@/context/LanguageContext";
import { localizedLastSeen, localizedUserName } from "./chatNames";
import UserAvatar from "./UserAvatar";
import PresenceDot from "./PresenceDot";

interface GroupMembersModalProps {
  isOpen: boolean;
  onClose: () => void;
  conversation: ChatConversation;
  /** 變更（加 / 踢 / 自己離開）後通知父元件刷新 */
  onChanged?: () => void;
  /** 當自己離開後呼叫（讓父頁面導去 /chat 列表）*/
  onSelfLeft?: () => void;
}

function userLabel(u: ChatUser, t: AllTranslations): string {
  return localizedUserName(u, t);
}

const GroupMembersModal: React.FC<GroupMembersModalProps> = ({
  isOpen,
  onClose,
  conversation,
  onChanged,
  onSelfLeft,
}) => {
  const { user, isAdmin } = useAuth();
  const { t, isZhTW } = useLanguage();
  const dialog = useDialog();
  const me = Number(user?.user_id || 0);
  const [working, setWorking] = useState(false);

  const participants = (conversation.participants || []) as ChatParticipant[];

  // presence
  const memberIds = useMemo(
    () => participants.map((p) => p.user_id).filter((id) => id !== me),
    [participants, me],
  );
  const presence = usePresenceMany(memberIds);

  // 加成員 UI
  const [showAdd, setShowAdd] = useState(false);
  const [searchQ, setSearchQ] = useState("");
  const [searchResults, setSearchResults] = useState<ChatUser[]>([]);
  const existingIds = useMemo(
    () => new Set(participants.map((p) => p.user_id)),
    [participants],
  );

  useEffect(() => {
    if (!showAdd) return;
    const t = setTimeout(async () => {
      try {
        const list = await chatService.searchUsers(searchQ);
        setSearchResults(list.filter((u) => !existingIds.has(u.user_id)));
      } catch {
        setSearchResults([]);
      }
    }, 250);
    return () => clearTimeout(t);
  }, [searchQ, showAdd, existingIds]);

  // reset state when closed
  useEffect(() => {
    if (!isOpen) {
      setShowAdd(false);
      setSearchQ("");
      setSearchResults([]);
    }
  }, [isOpen]);

  const handleRemove = async (target: ChatParticipant) => {
    const isSelf = target.user_id === me;
    const name = userLabel(target.user, t);
    const ok = await dialog.confirm({
      title: isSelf ? t.chatUi.leaveGroupTitle : t.chatUi.removeMemberTitle,
      message: isSelf
        ? t.chatUi.leaveGroupMessage.replace(
            "{group}",
            conversation.title || t.chatUi.groupFallback,
          )
        : t.chatUi.removeMemberMessage.replace("{name}", name),
      variant: "danger",
      confirmText: isSelf ? t.chatUi.leave : t.chatUi.remove,
    });
    if (!ok) return;

    try {
      setWorking(true);
      await chatService.removeMember(conversation.id, target.user_id);
      onChanged?.();
      if (isSelf) {
        onClose();
        onSelfLeft?.();
      }
    } catch (err) {
      await dialog.alert({
        title: t.chatUi.actionFailed,
        message: err instanceof Error ? err.message : t.chatUi.tryAgainLater,
      });
    } finally {
      setWorking(false);
    }
  };

  const handleAdd = async (u: ChatUser) => {
    try {
      setWorking(true);
      await chatService.addMembers(conversation.id, [u.user_id]);
      setSearchQ("");
      onChanged?.();
    } catch (err) {
      await dialog.alert({
        title: t.chatUi.addFailed,
        message: err instanceof Error ? err.message : t.chatUi.tryAgainLater,
      });
    } finally {
      setWorking(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t.chatUi.membersTitle
        .replace("{group}", conversation.title || t.chatUi.groupFallback)
        .replace("{count}", String(participants.length))}
      size="lg"
    >
      <div className="space-y-4">
        {/* admin 加成員入口 */}
        {isAdmin && (
          <div className="flex justify-end">
            <PillButton
              theme="luxe"
              variant={showAdd ? "filled" : "outline"}
              size="sm"
              onClick={() => setShowAdd((v) => !v)}
              disabled={working}
            >
              {showAdd ? t.chatUi.done : t.chatUi.addMember}
            </PillButton>
          </div>
        )}

        {/* 加成員 — 搜尋區 */}
        {showAdd && isAdmin && (
          <div className="rounded-lg border border-gold/15 bg-surface/60 p-3 space-y-2">
            <Input
              value={searchQ}
              onChange={(e) => setSearchQ(e.target.value)}
              placeholder={t.chatUi.searchMemberPlaceholder}
            />
            <div className="max-h-48 overflow-y-auto space-y-1">
              {searchResults.length === 0 && (
                <p className="text-xs text-muted text-center py-3">
                  {searchQ ? t.chatUi.noMemberFound : t.chatUi.searchPrompt}
                </p>
              )}
              {searchResults.map((u) => (
                <button
                  key={u.user_id}
                  onClick={() => handleAdd(u)}
                  disabled={working}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gold/10 transition-colors text-left disabled:opacity-50"
                >
                  <UserAvatar user={u} size="sm" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm truncate">{userLabel(u, t)}</p>
                    <p className="text-[10px] text-muted truncate">{u.email}</p>
                  </div>
                  <span className="text-gold text-xs">{t.chatUi.addAction}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 成員清單 */}
        <div className="space-y-1.5 max-h-96 overflow-y-auto">
          {participants.map((p) => {
            const isSelf = p.user_id === me;
            const u = p.user;
            const userPresence = isSelf ? null : presence.get(p.user_id);
            const isAdminMember = !!u.admin_display_name;
            return (
              <div
                key={p.user_id}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg border border-gold/10"
              >
                <div className="relative shrink-0">
                  <UserAvatar user={u} size="md" />
                  {userPresence && (
                    <span className="absolute -bottom-0.5 -right-0.5">
                      <PresenceDot status={userPresence.status} />
                    </span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium truncate">
                      {userLabel(u, t)}
                    </span>
                    {isSelf && (
                      <span className="text-[10px] text-muted bg-gold/5 px-1.5 py-0.5 rounded-full">
                        {t.chatUi.you}
                      </span>
                    )}
                    {isAdminMember && (
                      <span className="text-[10px] text-gold bg-gold/10 px-1.5 py-0.5 rounded-full">
                        {t.chatUi.adminTag}
                      </span>
                    )}
                    {p.role === "admin" && !isAdminMember && (
                      <span className="text-[10px] text-gold bg-gold/10 px-1.5 py-0.5 rounded-full">
                        {t.chatUi.ownerTag}
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-muted">
                    {isSelf
                      ? t.chatUi.yourself
                      : userPresence
                        ? localizedLastSeen(
                            userPresence.last_seen_at,
                            t,
                            isZhTW,
                          )
                        : "—"}
                  </p>
                </div>

                {/* 操作 */}
                {(isAdmin || isSelf) && (
                  <button
                    onClick={() => handleRemove(p)}
                    disabled={working}
                    className="text-red-400 hover:text-red-300 text-xs px-2 py-1 transition-colors disabled:opacity-50"
                  >
                    {isSelf ? t.chatUi.leave : t.chatUi.remove}
                  </button>
                )}
              </div>
            );
          })}
        </div>

        <div className="flex justify-end pt-2 border-t border-gold/10">
          <PillButton theme="luxe" variant="outline" onClick={onClose}>
            {t.chatUi.close}
          </PillButton>
        </div>
      </div>
    </Modal>
  );
};

export default GroupMembersModal;
