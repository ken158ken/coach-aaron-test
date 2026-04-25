/**
 * NewChatModal — 開新對話 modal
 * @module components/chat/NewChatModal
 *
 * 一般用戶：先列出 admin（白名單）+ 搜尋其他會員 → 開 1v1 DM
 * Admin：除上述外，多一個「建群組」tab
 */

import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Modal, Input, PillButton } from "@/components/ui";
import { chatService, type ChatUser } from "@/services/chat.service";
import { useAuth } from "@/context/AuthContext";

interface NewChatModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type Tab = "dm" | "group";

const NewChatModal: React.FC<NewChatModalProps> = ({ isOpen, onClose }) => {
  const { isAdmin } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>("dm");
  const [admins, setAdmins] = useState<ChatUser[]>([]);
  const [searchQ, setSearchQ] = useState("");
  const [results, setResults] = useState<ChatUser[]>([]);
  const [groupTitle, setGroupTitle] = useState("");
  const [groupSelected, setGroupSelected] = useState<ChatUser[]>([]);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isOpen) return;
    setError("");
    chatService.listAdmins().then(setAdmins).catch(() => setAdmins([]));
  }, [isOpen]);

  // 搜尋（debounce）
  useEffect(() => {
    if (!isOpen) return;
    const t = setTimeout(async () => {
      try {
        const list = await chatService.searchUsers(searchQ);
        setResults(list);
      } catch {
        setResults([]);
      }
    }, 250);
    return () => clearTimeout(t);
  }, [searchQ, isOpen]);

  const startDM = async (user: ChatUser) => {
    try {
      setCreating(true);
      setError("");
      const conv = await chatService.openDM(user.user_id);
      onClose();
      navigate(`/chat/${conv.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "開啟對話失敗");
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
      setError("請輸入群組名稱");
      return;
    }
    if (groupSelected.length === 0) {
      setError("請至少選擇一位成員");
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
      setGroupTitle("");
      setGroupSelected([]);
      navigate(`/chat/${conv.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "建立群組失敗");
    } finally {
      setCreating(false);
    }
  };

  const userLabel = (u: ChatUser): string =>
    u.admin_display_name || u.display_name || u.name || u.email || "用戶";

  const dmCandidates = useMemo(() => {
    const ids = new Set(admins.map((a) => a.user_id));
    const merged = [...admins];
    results.forEach((r) => {
      if (!ids.has(r.user_id)) {
        merged.push(r);
        ids.add(r.user_id);
      }
    });
    return merged;
  }, [admins, results]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="開啟新對話" size="lg">
      <div className="space-y-4">
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
              💬 1 對 1 私訊
            </button>
            <button
              onClick={() => setTab("group")}
              className={`px-4 py-2 rounded-lg text-sm transition-all ${
                tab === "group"
                  ? "bg-gold/20 text-gold border border-gold/30"
                  : "text-muted hover:text-inherit"
              }`}
            >
              👥 建群組
            </button>
          </div>
        )}

        {error && <div className="text-sm text-red-400">{error}</div>}

        {tab === "dm" && (
          <>
            <Input
              label="搜尋會員（名稱 / Email）"
              value={searchQ}
              onChange={(e) => setSearchQ(e.target.value)}
              placeholder="輸入後即時搜尋"
            />
            <div className="max-h-80 overflow-y-auto space-y-1.5">
              {admins.length > 0 && !searchQ && (
                <p className="text-xs text-muted px-1 mb-1">🏅 網站管理員</p>
              )}
              {dmCandidates.length === 0 && (
                <div className="text-center py-6 text-sm text-muted">
                  找不到符合的用戶
                </div>
              )}
              {dmCandidates.map((u) => (
                <button
                  key={u.user_id}
                  onClick={() => startDM(u)}
                  disabled={creating}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gold/10 transition-colors text-left disabled:opacity-50"
                >
                  <div className="w-9 h-9 rounded-full bg-gold/15 flex items-center justify-center text-gold font-medium shrink-0">
                    {userLabel(u).charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {userLabel(u)}
                      {u.admin_display_name && (
                        <span className="ml-2 text-[10px] text-gold bg-gold/10 px-1.5 py-0.5 rounded">
                          管理員
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-muted truncate">{u.email}</p>
                  </div>
                </button>
              ))}
            </div>
          </>
        )}

        {tab === "group" && isAdmin && (
          <>
            <Input
              label="群組名稱"
              value={groupTitle}
              onChange={(e) => setGroupTitle(e.target.value)}
              placeholder="例：教練團隊 ・ 學員 A 互動群"
            />
            <Input
              label="搜尋會員加入群組"
              value={searchQ}
              onChange={(e) => setSearchQ(e.target.value)}
              placeholder="輸入名稱 / Email"
            />
            {groupSelected.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {groupSelected.map((u) => (
                  <span
                    key={u.user_id}
                    className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full bg-gold/15 text-gold border border-gold/30"
                  >
                    {userLabel(u)}
                    <button
                      onClick={() => toggleGroupMember(u)}
                      className="hover:text-red-400"
                    >
                      ✕
                    </button>
                  </span>
                ))}
              </div>
            )}
            <div className="max-h-60 overflow-y-auto space-y-1.5">
              {dmCandidates.map((u) => {
                const selected = groupSelected.find((x) => x.user_id === u.user_id);
                return (
                  <button
                    key={u.user_id}
                    onClick={() => toggleGroupMember(u)}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-left ${
                      selected
                        ? "bg-gold/10 border border-gold/30"
                        : "hover:bg-gold/5 border border-transparent"
                    }`}
                  >
                    <div className="w-8 h-8 rounded-full bg-gold/15 flex items-center justify-center text-gold text-xs shrink-0">
                      {userLabel(u).charAt(0).toUpperCase()}
                    </div>
                    <span className="flex-1 text-sm truncate">{userLabel(u)}</span>
                    {selected && <span className="text-gold">✓</span>}
                  </button>
                );
              })}
            </div>
            <div className="flex justify-end gap-3 pt-2 border-t border-gold/10">
              <PillButton theme="luxe" variant="outline" onClick={onClose}>
                取消
              </PillButton>
              <PillButton
                theme="luxe"
                variant="filled"
                onClick={createGroup}
                disabled={creating}
              >
                {creating ? "建立中..." : "建立群組"}
              </PillButton>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
};

export default NewChatModal;
