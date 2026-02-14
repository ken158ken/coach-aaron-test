/**
 * 管理員白名單頁面
 * @description 提供管理員白名單的新增、編輯、刪除和啟用/停用功能
 * @module pages/admin/AdminWhitelist
 */

import React, { useState, useEffect } from "react";
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
import { get, post, del } from "@/services/api";
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
}

/** 後端白名單資料結構 */
interface AdminWhitelistItem {
  whitelist_id: number;
  email: string | null;
  phone_number: string | null;
  note: string | null;
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
  const [whitelist, setWhitelist] = useState<WhitelistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [deleteItem, setDeleteItem] = useState<WhitelistItem | null>(null);
  const [newItem, setNewItem] = useState<WhitelistCreateData>({
    email: "",
    note: "",
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
            isActive: item.is_active,
            createdAt: item.created_at?.split("T")[0] || "",
          })),
        );
      } else {
        logger.error("Failed to fetch whitelist", res);
        setWhitelist([]);
        setError("載入白名單失敗：數據格式錯誤");
      }
    } catch (err) {
      logger.error("Failed to fetch whitelist", err);
      setWhitelist([]);
      setError("載入白名單失敗");
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
        setError("請填寫 Email");
        return;
      }

      // Email 格式驗證
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(newItem.email)) {
        setError("請輸入有效的 Email 格式");
        return;
      }

      logger.info("Adding whitelist item", { email: newItem.email });
      const res = await post<AdminWhitelistItem>("/api/admin/whitelist", {
        email: newItem.email,
        phone_number: null,
        note: newItem.note || null,
      });

      if (res && res.whitelist_id) {
        const newEntry: WhitelistItem = {
          id: String(res.whitelist_id),
          email: res.email || undefined,
          phoneNumber: res.phone_number || undefined,
          note: res.note || "",
          isActive: res.is_active,
          createdAt: res.created_at?.split("T")[0] || "",
        };
        setWhitelist((prev) => [...prev, newEntry]);
        setShowAddModal(false);
        setNewItem({ email: "", note: "" });
        logger.info("Whitelist item added successfully");
      } else {
        setError("新增失敗：回應格式錯誤");
      }
    } catch (err) {
      logger.error("Failed to add whitelist item", err);
      setError("新增失敗");
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
      setError("刪除失敗");
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
      setError("更新失敗");
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
    { key: "note" as const, header: "備註" },
    {
      key: "isActive" as const,
      header: (
        <span className="inline-flex items-center gap-1.5">
          <span className="text-red-400 font-medium">可進入後台管理權限</span>
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
              如果不小心把自己後台權限關掉請聯絡小恩調整資料庫
            </span>
          </span>
        </span>
      ),
      headerText: "後台管理權限",
      render: (item: WhitelistItem) => (
        <Toggle
          checked={item.isActive}
          onChange={() => handleToggleActive(item)}
        />
      ),
    },
    { key: "createdAt" as const, header: "建立日期" },
    {
      key: "actions" as const,
      header: "操作",
      render: (item: WhitelistItem) => (
        <button
          onClick={() => setDeleteItem(item)}
          className="text-red-400 hover:text-red-300 transition-colors text-sm"
        >
          刪除
        </button>
      ),
    },
  ];

  if (loading) {
    return <Loading text="載入中..." />;
  }

  return (
    <div>
      <PageHeader
        title="白名單管理"
        subtitle="管理可登入後台的用戶白名單"
        actions={
          <PillButton onClick={() => setShowAddModal(true)}>
            新增白名單
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
          data={whitelist}
          columns={columns}
          keyExtractor={(item) => item.id}
        />
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center overflow-y-auto py-6">
          <div
            className="absolute inset-0 bg-black/80 backdrop-blur-md"
            onClick={() => setShowAddModal(false)}
          />
          <div className="relative bg-luxe-surface border border-luxe-gold/20 rounded-lg p-4 sm:p-6 max-w-md w-full mx-3 sm:mx-4 max-h-[80vh] overflow-y-auto my-auto">
            <h3 className="text-lg font-medium text-luxe-text mb-4">
              新增白名單
            </h3>

            <div className="space-y-4">
              <Input
                label="Email *"
                type="email"
                value={newItem.email}
                onChange={(e) =>
                  setNewItem((prev) => ({ ...prev, email: e.target.value }))
                }
                placeholder="user@example.com"
              />
              <Textarea
                label="備註"
                value={newItem.note}
                onChange={(e) =>
                  setNewItem((prev) => ({ ...prev, note: e.target.value }))
                }
                placeholder="角色說明..."
                rows={3}
              />
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                className="px-4 py-2 text-sm text-luxe-muted hover:text-luxe-text transition-colors"
                onClick={() => setShowAddModal(false)}
              >
                取消
              </button>
              <PillButton onClick={handleAdd}>新增</PillButton>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm Dialog */}
      <ConfirmDialog
        isOpen={!!deleteItem}
        title="刪除白名單"
        message={`確定要刪除 ${deleteItem?.email} 嗎？`}
        onConfirm={() => deleteItem && handleDelete(deleteItem)}
        onCancel={() => setDeleteItem(null)}
        confirmText="刪除"
        danger
      />
    </div>
  );
};

export default AdminWhitelist;
