/**
 * 管理員白名單頁面
 * @description 提供管理員白名單的新增、編輯、刪除和啟用/停用功能
 * @module pages/admin/AdminWhitelist
 */

import React, { useState, useEffect } from "react";
import { useModalBehavior } from "@/hooks/useModalBehavior";
import {
  PageHeader,
  Loading,
  ConfirmDialog,
  Toggle,
  PillButton,
  Input,
  Textarea,
  DataTable,
} from "@/components/ui";
import { get, post, put, del } from "@/services/api";
import { useLanguage } from "@/context/LanguageContext";
import type { WhitelistItem } from "@/types";

/** 日誌工具 */
const logger = {
  info: (msg: string, data?: unknown) =>
    console.log(`[AdminWhitelist] ${msg}`, data || ""),
  error: (msg: string, err?: unknown) =>
    console.error(`[AdminWhitelist] ${msg}`, err || ""),
};

interface WhitelistCreateData {
  email: string;
  note: string;
  displayName: string;
}

/** 後端白名單資料結構 */
interface AdminWhitelistItem {
  whitelist_id: number;
  email: string | null;
  phone_number: string | null;
  note: string | null;
  display_name: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * AdminWhitelist - 管理員白名單頁面
 *
 * @returns {JSX.Element} 管理員白名單頁面
 */
const AdminWhitelist: React.FC = () => {
  const { t } = useLanguage();
  const [whitelist, setWhitelist] = useState<WhitelistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [deleteItem, setDeleteItem] = useState<WhitelistItem | null>(null);
  const [editItem, setEditItem] = useState<WhitelistItem | null>(null);
  const [editNote, setEditNote] = useState("");
  const [editDisplayName, setEditDisplayName] = useState("");
  const [saving, setSaving] = useState(false);

  /* 兩個手寫彈窗原本沒鎖捲動、也不吃 Escape —— 統一補上（存檔中不讓 Escape 關） */
  useModalBehavior(showAddModal, () => setShowAddModal(false));
  useModalBehavior(!!editItem, () => {
    if (!saving) setEditItem(null);
  });
  const [newItem, setNewItem] = useState<WhitelistCreateData>({
    email: "",
    note: "",
    displayName: "",
  });
  const [error, setError] = useState("");

  useEffect(() => {
    fetchWhitelist();
  }, []);

  /**
   * 取得白名單列表
   */
  const fetchWhitelist = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await get<AdminWhitelistItem[]>("/api/admin/whitelist");
      if (res && Array.isArray(res)) {
        setWhitelist(
          res.map((item) => ({
            id: String(item.whitelist_id),
            email: item.email || undefined,
            phoneNumber: item.phone_number || undefined,
            note: item.note || "",
            displayName: item.display_name || "",
            isActive: item.is_active,
            createdAt: item.created_at?.split("T")[0] || "",
          })),
        );
      } else {
        logger.error("Failed to fetch whitelist", res);
        setWhitelist([]);
        setError(t.adminWhitelistPage.error.loadFormat);
      }
    } catch (err) {
      logger.error("Failed to fetch whitelist", err);
      setWhitelist([]);
      setError(t.adminWhitelistPage.error.loadFailed);
    } finally {
      setLoading(false);
    }
  };

  /**
   * 新增白名單項目 (只需 Email)
   */
  const handleAdd = async () => {
    try {
      setError("");
      if (!newItem.email) {
        setError(t.adminWhitelistPage.error.emailRequired);
        return;
      }

      // Email 格式驗證
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(newItem.email)) {
        setError(t.adminWhitelistPage.error.emailInvalid);
        return;
      }

      logger.info("Adding whitelist item", { email: newItem.email });
      const res = await post<AdminWhitelistItem>("/api/admin/whitelist", {
        email: newItem.email,
        phone_number: null,
        note: newItem.note || null,
        displayName: newItem.displayName || null,
      });

      if (res && res.whitelist_id) {
        const newEntry: WhitelistItem = {
          id: String(res.whitelist_id),
          email: res.email || undefined,
          phoneNumber: res.phone_number || undefined,
          note: res.note || "",
          displayName: res.display_name || "",
          isActive: res.is_active,
          createdAt: res.created_at?.split("T")[0] || "",
        };
        setWhitelist((prev) => [...prev, newEntry]);
        setShowAddModal(false);
        setNewItem({ email: "", note: "", displayName: "" });
        logger.info("Whitelist item added successfully");
      } else {
        setError(t.adminWhitelistPage.error.addFormat);
      }
    } catch (err) {
      logger.error("Failed to add whitelist item", err);
      setError(t.adminWhitelistPage.error.addFailed);
    }
  };

  /**
   * 刪除白名單項目
   */
  const handleDelete = async (item: WhitelistItem) => {
    try {
      logger.info("Deleting whitelist item", { id: item.id });
      await del(`/api/admin/whitelist/${item.id}`);
      setWhitelist((prev) => prev.filter((i) => i.id !== item.id));
      setDeleteItem(null);
      logger.info("Whitelist item deleted successfully");
    } catch (err) {
      logger.error("Failed to delete whitelist item", err);
      setError(t.adminCommon.deleteFailed);
    }
  };

  /**
   * 開啟編輯備註 modal
   */
  const openEditModal = (item: WhitelistItem) => {
    setEditItem(item);
    setEditNote(item.note || "");
    setEditDisplayName(item.displayName || "");
    setError("");
  };

  /**
   * 儲存備註 + 顯示名稱
   */
  const handleSaveNote = async () => {
    if (!editItem) return;
    try {
      setSaving(true);
      await put(`/api/admin/whitelist/${editItem.id}`, {
        note: editNote,
        displayName: editDisplayName,
      });
      setWhitelist((prev) =>
        prev.map((i) =>
          i.id === editItem.id
            ? { ...i, note: editNote, displayName: editDisplayName }
            : i,
        ),
      );
      setEditItem(null);
      setEditNote("");
      setEditDisplayName("");
      logger.info("Whitelist updated", { id: editItem.id });
    } catch (err) {
      logger.error("Failed to update whitelist", err);
      setError(t.adminCommon.updateFailed);
    } finally {
      setSaving(false);
    }
  };

  /**
   * 切換啟用狀態
   */
  const handleToggleActive = async (item: WhitelistItem) => {
    try {
      logger.info("Toggling whitelist item", { id: item.id });
      await post(`/api/admin/whitelist/${item.id}/toggle`, {});
      setWhitelist((prev) =>
        prev.map((i) =>
          i.id === item.id ? { ...i, isActive: !i.isActive } : i,
        ),
      );
    } catch (err) {
      logger.error("Failed to toggle whitelist item", err);
      setError(t.adminCommon.updateFailed);
    }
  };

  const columns = [
    {
      key: "email" as const,
      header: "Email",
      isPrimary: true,
      render: (item: WhitelistItem) => (
        <span className="text-luxe-text">{item.email || "-"}</span>
      ),
    },
    {
      key: "displayName" as const,
      header: t.adminWhitelistPage.table.colDisplayName,
      hideOnMobile: true,
      render: (item: WhitelistItem) => (
        <button
          onClick={() => openEditModal(item)}
          className="text-left w-full min-h-6 text-luxe-text hover:text-luxe-gold transition-colors"
          title={t.adminWhitelistPage.editHint}
        >
          {item.displayName ? (
            <span className="inline-flex items-center gap-1.5">
              <span className="text-xs px-2 py-0.5 rounded-full bg-luxe-gold/15 text-luxe-gold">
                {item.displayName}
              </span>
            </span>
          ) : (
            <span className="text-luxe-muted italic text-xs">
              {t.adminWhitelistPage.addDisplayNameHint}
            </span>
          )}
        </button>
      ),
    },
    {
      key: "note" as const,
      header: t.adminWhitelistPage.table.colNote,
      hideOnMobile: true,
      render: (item: WhitelistItem) => (
        <button
          onClick={() => openEditModal(item)}
          className="text-left w-full min-h-6 text-luxe-text hover:text-luxe-gold transition-colors group inline-flex items-center gap-1.5"
          title={t.adminWhitelistPage.editNoteHint}
        >
          <span className="truncate">
            {item.note || (
              <span className="text-luxe-muted italic">
                {t.adminWhitelistPage.addNoteHint}
              </span>
            )}
          </span>
          <svg
            className="w-3.5 h-3.5 opacity-0 group-hover:opacity-60 shrink-0 transition-opacity"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
            />
          </svg>
        </button>
      ),
    },
    {
      key: "isActive" as const,
      header: (
        <span
          className="inline-flex items-center gap-1.5"
          data-tour="whitelist-permission-col"
        >
          <span className="text-red-400 font-medium">
            {t.adminWhitelistPage.table.colPermission}
          </span>
          <span className="relative group/tip">
            <svg
              className="w-3.5 h-3.5 text-red-400/70 cursor-help"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8.228 9c.549-1.065 2.01-1.37 3.272-1.37 1.635 0 2.5.882 2.5 1.87 0 1.128-1.443 1.614-2.5 2.164V13m0 3h.01"
              />
              <circle cx="12" cy="12" r="10" strokeWidth={2} />
            </svg>
            <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-luxe-surface border border-red-500/30 rounded-lg text-[11px] text-red-300 whitespace-nowrap opacity-0 pointer-events-none group-hover/tip:opacity-100 transition-opacity duration-200 shadow-lg z-50">
              {t.adminWhitelistPage.permissionTip}
            </span>
          </span>
        </span>
      ),
      headerText: t.adminWhitelistPage.table.colPermissionShort,
      render: (item: WhitelistItem) => (
        // 手機版沒有表頭（改成卡片排版），導覽改指這顆開關本身
        <span data-tour="whitelist-permission-toggle">
          <Toggle
            checked={item.isActive}
            onChange={() => handleToggleActive(item)}
          />
        </span>
      ),
    },
    {
      key: "createdAt" as const,
      header: t.adminWhitelistPage.table.colCreatedAt,
      hideOnMobile: true,
    },
    {
      key: "actions" as const,
      header: t.adminCommon.colActions,
      render: (item: WhitelistItem) => (
        <div className="inline-flex items-center gap-3">
          <button
            onClick={() => openEditModal(item)}
            className="text-luxe-gold hover:text-luxe-gold/80 transition-colors text-sm"
          >
            {t.common.edit}
          </button>
          <button
            onClick={() => setDeleteItem(item)}
            className="text-red-400 hover:text-red-300 transition-colors text-sm"
          >
            {t.common.delete}
          </button>
        </div>
      ),
    },
  ];

  if (loading) {
    return <Loading text={t.common.loading} />;
  }

  return (
    <div>
      <PageHeader
        title={t.admin.whitelist}
        subtitle={t.adminWhitelistPage.pageSubtitle}
        actions={
          <PillButton
            data-tour="whitelist-add"
            onClick={() => setShowAddModal(true)}
          >
            {t.adminWhitelistPage.addEntry}
          </PillButton>
        }
      />

      {error && (
        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Data Table */}
      <div className="bg-luxe-surface rounded-lg border border-luxe-gold/10">
        <DataTable<WhitelistItem>
          data-tour="whitelist-table"
          data={whitelist}
          columns={columns}
          keyExtractor={(item) => item.id}
        />
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 modal-layer modal-scroll flex items-start sm:items-center justify-center overflow-y-auto py-6">
          <div
            className="absolute inset-0 bg-black/80 backdrop-blur-md"
            onClick={() => setShowAddModal(false)}
          />
          <div
            data-tour-modal="whitelist-add"
            className="relative bg-luxe-surface border border-luxe-gold/20 rounded-lg p-4 sm:p-6 max-w-md w-full mx-3 sm:mx-4 max-h-[80vh] overflow-y-auto modal-scroll my-auto"
          >
            <h3 className="text-lg font-medium text-luxe-text mb-4">
              {t.adminWhitelistPage.form.addTitle}
            </h3>

            <div className="space-y-4">
              <Input
                data-tour="whitelist-form-email"
                label="Email *"
                type="email"
                value={newItem.email}
                onChange={(e) =>
                  setNewItem((prev) => ({ ...prev, email: e.target.value }))
                }
                placeholder="user@example.com"
              />
              <Input
                data-tour="whitelist-form-name"
                label={t.adminWhitelistPage.form.displayName}
                value={newItem.displayName}
                onChange={(e) =>
                  setNewItem((prev) => ({
                    ...prev,
                    displayName: e.target.value,
                  }))
                }
                placeholder={t.adminWhitelistPage.form.displayNamePlaceholder}
              />
              <Textarea
                data-tour="whitelist-form-note"
                label={t.adminWhitelistPage.form.note}
                value={newItem.note}
                onChange={(e) =>
                  setNewItem((prev) => ({ ...prev, note: e.target.value }))
                }
                placeholder={t.adminWhitelistPage.form.notePlaceholder}
                rows={3}
              />
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                data-tour="whitelist-form-cancel"
                className="px-4 py-2 text-sm text-luxe-muted hover:text-luxe-text transition-colors"
                onClick={() => setShowAddModal(false)}
              >
                {t.common.cancel}
              </button>
              <PillButton data-tour="whitelist-form-submit" onClick={handleAdd}>
                {t.adminWhitelistPage.form.submitAdd}
              </PillButton>
            </div>
          </div>
        </div>
      )}

      {/* Edit Note Modal */}
      {editItem && (
        <div className="fixed inset-0 modal-layer modal-scroll flex items-start sm:items-center justify-center overflow-y-auto py-6">
          <div
            className="absolute inset-0 bg-black/80 backdrop-blur-md"
            onClick={() => !saving && setEditItem(null)}
          />
          <div className="relative bg-luxe-surface border border-luxe-gold/20 rounded-lg p-4 sm:p-6 max-w-md w-full mx-3 sm:mx-4 max-h-[80vh] overflow-y-auto modal-scroll my-auto">
            <h3 className="text-lg font-medium text-luxe-text mb-1">
              {t.adminWhitelistPage.form.editTitle}
            </h3>
            <p className="text-xs text-luxe-muted mb-4 break-all">
              {editItem.email}
            </p>

            <div className="space-y-4">
              <Input
                label={t.adminWhitelistPage.form.displayName}
                value={editDisplayName}
                onChange={(e) => setEditDisplayName(e.target.value)}
                placeholder={t.adminWhitelistPage.form.displayNamePlaceholder}
              />
              <Textarea
                label={t.adminWhitelistPage.form.note}
                value={editNote}
                onChange={(e) => setEditNote(e.target.value)}
                placeholder={t.adminWhitelistPage.form.notePlaceholder}
                rows={3}
              />
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                className="px-4 py-2 text-sm text-luxe-muted hover:text-luxe-text transition-colors disabled:opacity-50"
                onClick={() => setEditItem(null)}
                disabled={saving}
              >
                {t.common.cancel}
              </button>
              <PillButton onClick={handleSaveNote} disabled={saving}>
                {saving ? t.adminCommon.saving : t.common.save}
              </PillButton>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm Dialog */}
      <ConfirmDialog
        isOpen={!!deleteItem}
        title={t.adminWhitelistPage.confirm.deleteTitle}
        message={t.adminWhitelistPage.confirm.deleteMessage.replace(
          "{email}",
          deleteItem?.email || "",
        )}
        onConfirm={() => deleteItem && handleDelete(deleteItem)}
        onCancel={() => setDeleteItem(null)}
        confirmText={t.adminWhitelistPage.confirm.deleteConfirm}
        danger
      />
    </div>
  );
};

export default AdminWhitelist;
