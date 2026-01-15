/**
 * 管理員白名單頁面
 * @description 提供管理員白名單的新增、編輯、刪除和啟用/停用功能
 * @module pages/admin/AdminWhitelist
 */

import { useState, useEffect } from "react";
import { FaPlus, FaTrash, FaShieldAlt } from "react-icons/fa";
import api from "@/lib/api";
import { formatDate } from "@/lib/ui";
import {
  PageHeader,
  LoadingSpinner,
  ConfirmDialog,
  Toggle,
} from "@/components/ui";
import type {
  WhitelistItem,
  WhitelistCreateData,
  WhitelistUpdateData,
} from "@/types";

/**
 * AdminWhitelist 元件
 *
 * @returns {JSX.Element} 管理員白名單頁面
 *
 * @example
 * ```tsx
 * <AdminWhitelist />
 * ```
 */
const AdminWhitelist = (): JSX.Element => {
  const [whitelist, setWhitelist] = useState<WhitelistItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [showAdd, setShowAdd] = useState<boolean>(false);
  const [deleteItem, setDeleteItem] = useState<WhitelistItem | null>(null);
  const [newItem, setNewItem] = useState<WhitelistCreateData>({
    email: "",
    phoneNumber: "",
    note: "",
  });
  const [error, setError] = useState<string>("");

  useEffect(() => {
    fetchWhitelist();
  }, []);

  /**
   * 取得白名單列表
   *
   * @returns {Promise<void>}
   */
  const fetchWhitelist = async (): Promise<void> => {
    try {
      setLoading(true);
      setError("");
      const res = await api.get<WhitelistItem[]>("/api/admin/whitelist");
      setWhitelist(res.data);
    } catch (err) {
      console.error("Failed to fetch whitelist:", err);
      setError("載入白名單失敗");
    } finally {
      setLoading(false);
    }
  };

  /**
   * 新增白名單項目
   *
   * @returns {Promise<void>}
   */
  const handleAdd = async (): Promise<void> => {
    try {
      setError("");
      if (!newItem.email && !newItem.phoneNumber) {
        setError("請填寫 Email 或手機號碼");
        return;
      }

      await api.post("/api/admin/whitelist", {
        email: newItem.email || null,
        phoneNumber: newItem.phoneNumber || null,
        note: newItem.note,
      });

      await fetchWhitelist();
      setShowAdd(false);
      setNewItem({ email: "", phoneNumber: "", note: "" });
    } catch (err: any) {
      console.error("Failed to add whitelist item:", err);
      setError(err.response?.data?.error || "新增失敗");
    }
  };

  /**
   * 切換啟用/停用狀態
   *
   * @param {WhitelistItem} item - 白名單項目
   * @returns {Promise<void>}
   */
  const handleToggle = async (item: WhitelistItem): Promise<void> => {
    try {
      setError("");
      const data: WhitelistUpdateData = {
        isActive: !item.is_active,
      };
      await api.put(`/api/admin/whitelist/${item.whitelist_id}`, data);
      await fetchWhitelist();
    } catch (err) {
      console.error("Failed to toggle:", err);
      setError("切換狀態失敗");
    }
  };

  /**
   * 刪除白名單項目
   *
   * @returns {Promise<void>}
   */
  const handleDelete = async (): Promise<void> => {
    if (!deleteItem) return;

    try {
      setError("");
      await api.delete(`/api/admin/whitelist/${deleteItem.whitelist_id}`);
      await fetchWhitelist();
      setDeleteItem(null);
    } catch (err: any) {
      console.error("Failed to delete whitelist item:", err);
      const errorMsg = err.response?.data?.error || "刪除失敗";
      alert(errorMsg);
      setDeleteItem(null);
    }
  };

  if (loading) {
    return <LoadingSpinner text="載入白名單中..." />;
  }

  return (
    <div>
      <PageHeader
        title="管理員白名單"
        subtitle="只有在白名單中的 Email 或手機才能登入管理後台"
        actions={
          <button
            className="btn btn-primary btn-sm gap-2"
            onClick={() => setShowAdd(true)}
          >
            <FaPlus /> 新增管理員
          </button>
        }
      />

      <div className="alert alert-info mb-4">
        <FaShieldAlt />
        <span>白名單中的 Email/手機，在註冊或登入後會自動獲得管理員權限。</span>
      </div>

      {error && (
        <div className="alert alert-error mb-4">
          <span>{error}</span>
        </div>
      )}

      <div className="card bg-base-100 shadow-md border border-base-300">
        <div className="card-body p-0">
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>Email</th>
                  <th>手機號碼</th>
                  <th>備註</th>
                  <th>狀態</th>
                  <th>建立時間</th>
                  <th className="w-20">操作</th>
                </tr>
              </thead>
              <tbody>
                {whitelist.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="text-center py-8 text-base-content/50"
                    >
                      白名單為空
                    </td>
                  </tr>
                ) : (
                  whitelist.map((item) => (
                    <tr key={item.whitelist_id}>
                      <td className="font-medium">{item.email || "-"}</td>
                      <td>{item.phone_number || "-"}</td>
                      <td className="text-sm text-base-content/60">
                        {item.note || "-"}
                      </td>
                      <td>
                        <Toggle
                          checked={item.is_active}
                          onChange={() => handleToggle(item)}
                          label={item.is_active ? "啟用" : "停用"}
                        />
                      </td>
                      <td className="text-sm">{formatDate(item.created_at)}</td>
                      <td>
                        <button
                          className="btn btn-ghost btn-xs text-error"
                          onClick={() => setDeleteItem(item)}
                        >
                          <FaTrash />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* 新增對話框 */}
      {showAdd && (
        <div className="modal modal-open">
          <div className="modal-box">
            <h3 className="font-bold text-lg mb-4">新增管理員</h3>

            {error && (
              <div className="alert alert-error mb-4">
                <span>{error}</span>
              </div>
            )}

            <div className="space-y-4">
              <div className="form-control">
                <label className="label">
                  <span className="label-text">Email</span>
                </label>
                <input
                  type="email"
                  className="input input-bordered"
                  placeholder="admin@example.com"
                  value={newItem.email}
                  onChange={(e) =>
                    setNewItem({ ...newItem, email: e.target.value })
                  }
                />
              </div>
              <div className="divider">或</div>
              <div className="form-control">
                <label className="label">
                  <span className="label-text">手機號碼</span>
                </label>
                <input
                  type="text"
                  className="input input-bordered"
                  placeholder="0912345678"
                  value={newItem.phoneNumber}
                  onChange={(e) =>
                    setNewItem({ ...newItem, phoneNumber: e.target.value })
                  }
                />
              </div>
              <div className="form-control">
                <label className="label">
                  <span className="label-text">備註 (選填)</span>
                </label>
                <input
                  type="text"
                  className="input input-bordered"
                  placeholder="例如：主要管理員"
                  value={newItem.note}
                  onChange={(e) =>
                    setNewItem({ ...newItem, note: e.target.value })
                  }
                />
              </div>
            </div>
            <div className="modal-action">
              <button
                className="btn btn-ghost"
                onClick={() => {
                  setShowAdd(false);
                  setError("");
                }}
              >
                取消
              </button>
              <button className="btn btn-primary" onClick={handleAdd}>
                新增
              </button>
            </div>
          </div>
          <div
            className="modal-backdrop"
            onClick={() => {
              setShowAdd(false);
              setError("");
            }}
          ></div>
        </div>
      )}

      {/* 刪除確認 */}
      <ConfirmDialog
        isOpen={!!deleteItem}
        title="確認刪除"
        message={`確定要從白名單移除「${
          deleteItem?.email || deleteItem?.phone_number
        }」嗎？`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteItem(null)}
        confirmText="刪除"
        danger
      />
    </div>
  );
};

export default AdminWhitelist;
