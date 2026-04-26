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
} from "@/services/chat.service";
import { useAuth } from "@/context/AuthContext";
import { usePresenceMany } from "@/hooks/usePresence";
import { formatLastSeen } from "@/services/presence.service";
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

function userLabel(u: ChatUser): string {
  return u.admin_display_name || u.display_name || u.name || u.email || "用戶";
}

const GroupMembersModal: React.FC<GroupMembersModalProps> = ({
  isOpen,
  onClose,
  conversation,
  onChanged,
  onSelfLeft,
}) => {
  const { user, isAdmin } = useAuth();
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
    const name = userLabel(target.user);
    const ok = await dialog.confirm({
      title: isSelf ? "離開群組" : "移除成員",
      message: isSelf
        ? `確定要離開「${conversation.title}」嗎？\n離開後仍可看到舊訊息，但無法再發訊息或看到新訊息。`
        : `確定要把 ${name} 移出群組嗎？對方仍可看到離開前的訊息，但看不到新訊息。`,
      variant: "danger",
      confirmText: isSelf ? "離開" : "移除",
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
        title: "操作失敗",
        message: err instanceof Error ? err.message : "請稍後再試",
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
        title: "新增失敗",
        message: err instanceof Error ? err.message : "請稍後再試",
      });
    } finally {
      setWorking(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`👥 ${conversation.title} 成員（${participants.length}）`}
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
              {showAdd ? "完成" : "+ 新增成員"}
            </PillButton>
          </div>
        )}

        {/* 加成員 — 搜尋區 */}
        {showAdd && isAdmin && (
          <div className="rounded-lg border border-gold/15 bg-surface/60 p-3 space-y-2">
            <Input
              value={searchQ}
              onChange={(e) => setSearchQ(e.target.value)}
              placeholder="輸入名稱 / Email 搜尋..."
            />
            <div className="max-h-48 overflow-y-auto space-y-1">
              {searchResults.length === 0 && (
                <p className="text-xs text-muted text-center py-3">
                  {searchQ ? "找不到符合的會員" : "輸入關鍵字搜尋"}
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
                    <p className="text-sm truncate">{userLabel(u)}</p>
                    <p className="text-[10px] text-muted truncate">{u.email}</p>
                  </div>
                  <span className="text-gold text-xs">+ 加入</span>
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
                      {userLabel(u)}
                    </span>
                    {isSelf && (
                      <span className="text-[10px] text-muted bg-gold/5 px-1.5 py-0.5 rounded-full">
                        你
                      </span>
                    )}
                    {isAdminMember && (
                      <span className="text-[10px] text-gold bg-gold/10 px-1.5 py-0.5 rounded-full">
                        管理員
                      </span>
                    )}
                    {p.role === "admin" && !isAdminMember && (
                      <span className="text-[10px] text-gold bg-gold/10 px-1.5 py-0.5 rounded-full">
                        群主
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-muted">
                    {isSelf
                      ? "（你自己）"
                      : userPresence
                        ? formatLastSeen(userPresence.last_seen_at)
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
                    {isSelf ? "離開" : "移除"}
                  </button>
                )}
              </div>
            );
          })}
        </div>

        <div className="flex justify-end pt-2 border-t border-gold/10">
          <PillButton theme="luxe" variant="outline" onClick={onClose}>
            關閉
          </PillButton>
        </div>
      </div>
    </Modal>
  );
};

export default GroupMembersModal;
