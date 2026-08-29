/**
 * NewChatModal — 開新對話 modal
 * @module components/chat/NewChatModal
 *
 * 結構：
 *   - 頂部：admins 卡片區（永遠展開、視覺優先）
 *   - 下方：「其他會員」 searchable combobox（避免長清單轟炸）
 *
 * 模式：
 *   - DM：單選 → 直接開
 *   - Group（admin only）：多選 → 顯示 pill → 建立
 */

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Modal, Input, PillButton } from "@/components/ui";
import { chatService, type ChatUser } from "@/services/social/chat.service";
import { useAuth } from "@/context/AuthContext";
import UserAvatar from "./UserAvatar";
import { localizedUserName } from "./chatNames";
import { useLanguage } from "@/context/LanguageContext";
import type { AllTranslations } from "@/context/LanguageContext";

interface NewChatModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type Tab = "dm" | "group";

function userLabel(u: ChatUser, t: AllTranslations): string {
  return localizedUserName(u, t);
}

// ────────────────────────────────────────────────────────
// Admin pinned card grid
// ────────────────────────────────────────────────────────
const AdminCardGrid: React.FC<{
  admins: ChatUser[];
  selectedIds: Set<number>;
  multi: boolean;
  onPick: (u: ChatUser) => void;
  disabled?: boolean;
}> = ({ admins, selectedIds, multi, onPick, disabled }) => {
  const { t } = useLanguage();
  if (admins.length === 0) return null;
  return (
    <section data-tour="chat-new-admins">
      <p className="text-xs text-muted mb-2 flex items-center gap-1.5">
        <span className="text-gold">🏅</span>
        {t.chatUi.adminsAndCoaches}
        {multi && (
          <span className="text-[10px] text-muted">
            {t.chatUi.tapToToggle}
          </span>
        )}
      </p>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {admins.map((u) => {
          const selected = selectedIds.has(u.user_id);
          return (
            <button
              key={u.user_id}
              onClick={() => onPick(u)}
              disabled={disabled}
              className={`flex items-center gap-2 px-3 py-2.5 rounded-lg border transition-all text-left ${
                selected
                  ? "border-gold bg-gold/15"
                  : "border-gold/15 hover:border-gold/40 hover:bg-gold/5"
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              <UserAvatar user={u} size="md" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {userLabel(u, t)}
                </p>
                {u.admin_note && (
                  <p className="text-[10px] text-muted truncate">
                    {u.admin_note}
                  </p>
                )}
              </div>
              {multi && selected && <span className="text-gold">✓</span>}
            </button>
          );
        })}
      </div>
    </section>
  );
};

// ────────────────────────────────────────────────────────
// Member combobox — 搜尋 + 下拉選單
// ────────────────────────────────────────────────────────
const MemberCombobox: React.FC<{
  excludeIds: Set<number>;
  selectedIds: Set<number>;
  onPick: (u: ChatUser) => void;
  placeholder?: string;
}> = ({ excludeIds, selectedIds, onPick, placeholder }) => {
  const { t } = useLanguage();
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [results, setResults] = useState<ChatUser[]>([]);
  const [loading, setLoading] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  // 點外部關閉
  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  // 搜尋（debounce 250ms）
  useEffect(() => {
    let cancelled = false;
    const t = setTimeout(async () => {
      try {
        setLoading(true);
        const list = await chatService.searchUsers(q);
        if (!cancelled) setResults(list.filter((u) => !excludeIds.has(u.user_id)));
      } catch {
        if (!cancelled) setResults([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 250);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
    // 排除清單變動時也要重撈（避免誤顯示已選中的）
  }, [q, excludeIds]);

  return (
    <section data-tour="chat-new-search">
      <p className="text-xs text-muted mb-2">{t.chatUi.otherMembers}</p>
      <div className="relative" ref={wrapRef}>
        <Input
          value={q}
          onFocus={() => setOpen(true)}
          onChange={(e) => {
            setQ(e.target.value);
            setOpen(true);
          }}
          placeholder={placeholder || t.chatUi.comboboxPlaceholder}
        />
        {open && (
          <div
            className="absolute left-0 right-0 mt-1 z-30 bg-surface-2 border border-gold/20 rounded-lg shadow-2xl max-h-72 overflow-y-auto"
          >
            {loading && (
              <div className="px-3 py-4 text-center text-xs text-muted">
                {t.chatUi.searching}
              </div>
            )}
            {!loading && results.length === 0 && (
              <div className="px-3 py-6 text-center text-xs text-muted">
                {q ? t.chatUi.noMemberFound : t.chatUi.noOtherMembers}
              </div>
            )}
            {results.map((u) => {
              const selected = selectedIds.has(u.user_id);
              return (
                <button
                  key={u.user_id}
                  onClick={() => {
                    onPick(u);
                    // 多選時保持開著、單選關掉
                    if (selectedIds) setQ("");
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-gold/10 transition-colors ${
                    selected ? "bg-gold/15" : ""
                  }`}
                >
                  <UserAvatar user={u} size="sm" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm truncate">{userLabel(u, t)}</p>
                    <p className="text-[10px] text-muted truncate">{u.email}</p>
                  </div>
                  {selected && <span className="text-gold text-xs">✓</span>}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
};

// ────────────────────────────────────────────────────────
// Main modal
// ────────────────────────────────────────────────────────
const NewChatModal: React.FC<NewChatModalProps> = ({ isOpen, onClose }) => {
  const { isAdmin } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>("dm");
  const [admins, setAdmins] = useState<ChatUser[]>([]);
  const [groupTitle, setGroupTitle] = useState("");
  const [groupSelected, setGroupSelected] = useState<ChatUser[]>([]);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isOpen) return;
    setError("");
    setGroupSelected([]);
    setGroupTitle("");
    chatService.listAdmins().then(setAdmins).catch(() => setAdmins([]));
  }, [isOpen]);

  const adminIds = useMemo(
    () => new Set(admins.map((a) => a.user_id)),
    [admins],
  );

  const startDM = async (user: ChatUser) => {
    try {
      setCreating(true);
      setError("");
      const conv = await chatService.openDM(user.user_id);
      onClose();
      navigate(`/chat/${conv.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : t.chatUi.openChatFailed);
    } finally {
      setCreating(false);
    }
  };

  const toggleGroupMember = (u: ChatUser) => {
    setGroupSelected((prev) =>
      prev.find((x) => x.user_id === u.user_id)
        ? prev.filter((x) => x.user_id !== u.user_id)
        : [...prev, u],
    );
  };

  const createGroup = async () => {
    if (!groupTitle.trim()) {
      setError(t.chatUi.groupNameRequired);
      return;
    }
    if (groupSelected.length === 0) {
      setError(t.chatUi.pickAtLeastOne);
      return;
    }
    try {
      setCreating(true);
      setError("");
      const conv = await chatService.createGroup({
        title: groupTitle.trim(),
        memberIds: groupSelected.map((u) => u.user_id),
      });
      onClose();
      navigate(`/chat/${conv.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : t.chatUi.createGroupFailed);
    } finally {
      setCreating(false);
    }
  };

  const groupSelectedIds = useMemo(
    () => new Set(groupSelected.map((u) => u.user_id)),
    [groupSelected],
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t.chatUi.newChatTitle}
      size="lg"
      tourId="chat-new"
    >
      <div className="space-y-5">
        {isAdmin && (
          <div className="flex gap-2">
            <button
              onClick={() => setTab("dm")}
              className={`px-4 py-2 rounded-lg text-sm transition-all ${
                tab === "dm"
                  ? "bg-gold/20 text-gold border border-gold/30"
                  : "text-muted hover:text-inherit"
              }`}
            >
              {t.chatUi.tabDm}
            </button>
            <button
              onClick={() => setTab("group")}
              className={`px-4 py-2 rounded-lg text-sm transition-all ${
                tab === "group"
                  ? "bg-gold/20 text-gold border border-gold/30"
                  : "text-muted hover:text-inherit"
              }`}
            >
              {t.chatUi.tabGroup}
            </button>
          </div>
        )}

        {error && <div className="text-sm text-red-400">{error}</div>}

        {tab === "dm" && (
          <>
            <AdminCardGrid
              admins={admins}
              selectedIds={new Set()}
              multi={false}
              onPick={startDM}
              disabled={creating}
            />
            <MemberCombobox
              excludeIds={adminIds}
              selectedIds={new Set()}
              onPick={startDM}
              placeholder={t.chatUi.searchOtherMembers}
            />
          </>
        )}

        {tab === "group" && isAdmin && (
          <>
            <Input
              label={t.chatUi.groupNameLabel}
              value={groupTitle}
              onChange={(e) => setGroupTitle(e.target.value)}
              placeholder={t.chatUi.groupNamePlaceholder}
            />

            {/* 已選成員 pill */}
            {groupSelected.length > 0 && (
              <div className="flex flex-wrap gap-1.5 p-2 rounded-lg bg-gold/5 border border-gold/15">
                <span className="text-xs text-muted self-center">
                  {t.chatUi.selectedCount.replace(
                    "{count}",
                    String(groupSelected.length),
                  )}
                </span>
                {groupSelected.map((u) => (
                  <span
                    key={u.user_id}
                    className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full bg-gold/15 text-gold border border-gold/30"
                  >
                    <UserAvatar user={u} size="sm" className="w-5! h-5! text-[10px]!" />
                    {userLabel(u, t)}
                    <button
                      onClick={() => toggleGroupMember(u)}
                      className="hover:text-red-400"
                      type="button"
                    >
                      ✕
                    </button>
                  </span>
                ))}
              </div>
            )}

            <AdminCardGrid
              admins={admins}
              selectedIds={groupSelectedIds}
              multi={true}
              onPick={toggleGroupMember}
            />

            <MemberCombobox
              excludeIds={adminIds}
              selectedIds={groupSelectedIds}
              onPick={toggleGroupMember}
              placeholder={t.chatUi.searchAndAddPlaceholder}
            />

            <div className="flex justify-end gap-3 pt-3 border-t border-gold/10">
              <PillButton theme="luxe" variant="outline" onClick={onClose}>
                {t.common.cancel}
              </PillButton>
              <PillButton
                theme="luxe"
                variant="filled"
                onClick={createGroup}
                disabled={creating}
              >
                {creating
                  ? t.chatUi.creating
                  : t.chatUi.createGroupBtn.replace(
                      "{count}",
                      String(groupSelected.length),
                    )}
              </PillButton>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
};

export default NewChatModal;
