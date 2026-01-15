/**
 * 會員管理頁面
 * @description 提供會員列表、編輯、刪除和權限管理功能
 * @module pages/admin/AdminUsers
 */

import { useState, useEffect } from "react";
import { FaEdit, FaTrash, FaUserShield } from "react-icons/fa";
import api from "@/lib/api";
import { formatDate } from "@/lib/ui";
import {
  DataTable,
  StatusBadge,
  PageHeader,
  SearchInput,
  LoadingSpinner,
  ConfirmDialog,
  Toggle,
} from "@/components/ui";
import type { TableColumn } from "@/components/ui";
import type {
  AdminUser,
  PaginatedUsersResponse,
  UserUpdateData,
} from "@/types";

/**
 * AdminUsers 元件
 *
 * @returns {JSX.Element} 會員管理頁面
 *
 * @example
 * ```tsx
 * <AdminUsers />
 * ```
 */
const AdminUsers = (): JSX.Element => {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>("");
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [editUser, setEditUser] = useState<AdminUser | null>(null);
  const [deleteUser, setDeleteUser] = useState<AdminUser | null>(null);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    fetchUsers();
  }, [page, search]);

  /**
   * 取得會員列表
   *
   * @returns {Promise<void>}
   */
  const fetchUsers = async (): Promise<void> => {
    try {
      setLoading(true);
      setError("");
      const res = await api.get<PaginatedUsersResponse>("/api/admin/users", {
        params: { page, limit: 20, search },
      });
      setUsers(res.data.users);
      setTotalPages(res.data.totalPages);
    } catch (err) {
      console.error("Failed to fetch users:", err);
      setError("載入會員資料失敗");
    } finally {
      setLoading(false);
    }
  };

  /**
   * 更新會員資料
   *
   * @param {number} userId - 會員 ID
   * @param {UserUpdateData} data - 更新資料
   * @returns {Promise<void>}
   */
  const handleUpdateUser = async (
    userId: number,
    data: UserUpdateData
  ): Promise<void> => {
    try {
      setError("");
      await api.put(`/api/admin/users/${userId}`, data);
      await fetchUsers();
      setEditUser(null);
    } catch (err) {
      console.error("Failed to update user:", err);
      setError("更新會員資料失敗");
    }
  };

  /**
   * 刪除會員
   *
   * @param {number} userId - 會員 ID
   * @returns {Promise<void>}
   */
  const handleDeleteUser = async (userId: number): Promise<void> => {
    try {
      setError("");
      await api.delete(`/api/admin/users/${userId}`);
      await fetchUsers();
      setDeleteUser(null);
    } catch (err) {
      console.error("Failed to delete user:", err);
      setError("刪除會員失敗");
    }
  };

  /**
   * 切換私密相簿權限
   *
   * @param {AdminUser} user - 會員資料
   * @returns {Promise<void>}
   */
  const handleToggleSex = async (user: AdminUser): Promise<void> => {
    try {
      setError("");
      await handleUpdateUser(user.user_id, { sex: !user.sex });
    } catch (err) {
      console.error("Failed to toggle sex permission:", err);
      setError("切換權限失敗");
    }
  };

  const columns: TableColumn<AdminUser>[] = [
    {
      header: "使用者",
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className="avatar placeholder">
            <div className="bg-neutral text-neutral-content rounded-full w-10">
              <span>{(row.display_name || row.email)?.[0]?.toUpperCase()}</span>
            </div>
          </div>
          <div>
            <div className="font-semibold">
              {row.display_name || row.username}
            </div>
            <div className="text-sm text-base-content/60">{row.email}</div>
          </div>
        </div>
      ),
    },
    {
      header: "狀態",
      render: (row) => (
        <div className="flex flex-col gap-1">
          <StatusBadge
            status={row.is_active ? "active" : "inactive"}
            text={row.is_active ? "啟用" : "停用"}
          />
          {row.isAdmin && (
            <span className="badge badge-primary badge-sm gap-1">
              <FaUserShield /> 管理員
            </span>
          )}
        </div>
      ),
    },
    {
      header: "私密相簿權限",
      render: (row) => (
        <Toggle
          checked={row.sex}
          onChange={() => handleToggleSex(row)}
          label={row.sex ? "可檢視" : "不可檢視"}
        />
      ),
    },
    {
      header: "最後登入",
      render: (row) => (
        <span className="text-sm">{formatDate(row.last_login_at)}</span>
      ),
    },
    {
      header: "註冊時間",
      render: (row) => (
        <span className="text-sm">{formatDate(row.created_at)}</span>
      ),
    },
    {
      header: "操作",
      render: (row) => (
        <div className="flex gap-2">
          <button
            className="btn btn-ghost btn-xs"
            onClick={() => setEditUser(row)}
          >
            <FaEdit />
          </button>
          <button
            className="btn btn-ghost btn-xs text-error"
            onClick={() => setDeleteUser(row)}
            disabled={row.isAdmin}
          >
            <FaTrash />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader title="會員管理" subtitle={`共 ${users.length} 位會員`} />

      {error && (
        <div className="alert alert-error mb-4">
          <span>{error}</span>
        </div>
      )}

      <div className="mb-4 max-w-xs">
        <SearchInput
          value={search}
          onChange={(v) => {
            setSearch(v);
            setPage(1);
          }}
          placeholder="搜尋 Email / 名稱..."
        />
      </div>

      <div className="card bg-base-100 shadow-md border border-base-300">
        <div className="card-body p-0">
          {loading ? (
            <LoadingSpinner />
          ) : (
            <DataTable columns={columns} data={users} emptyText="找不到會員" />
          )}
        </div>
      </div>

      {/* 分頁 */}
      {totalPages > 1 && (
        <div className="flex justify-center mt-4">
          <div className="join">
            <button
              className="join-item btn btn-sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
            >
              «
            </button>
            <button className="join-item btn btn-sm">
              {page} / {totalPages}
            </button>
            <button
              className="join-item btn btn-sm"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              »
            </button>
          </div>
        </div>
      )}

      {/* 編輯對話框 */}
      {editUser && (
        <div className="modal modal-open">
          <div className="modal-box">
            <h3 className="font-bold text-lg mb-4">編輯會員</h3>
            <div className="space-y-4">
              <div className="form-control">
                <label className="label">
                  <span className="label-text">顯示名稱</span>
                </label>
                <input
                  type="text"
                  className="input input-bordered"
                  value={editUser.display_name || ""}
                  onChange={(e) =>
                    setEditUser({ ...editUser, display_name: e.target.value })
                  }
                />
              </div>
              <div className="form-control">
                <Toggle
                  checked={editUser.is_active}
                  onChange={(v) => setEditUser({ ...editUser, is_active: v })}
                  label="帳號啟用"
                />
              </div>
              <div className="form-control">
                <Toggle
                  checked={editUser.sex}
                  onChange={(v) => setEditUser({ ...editUser, sex: v })}
                  label="私密相簿檢視權限"
                />
              </div>
            </div>
            <div className="modal-action">
              <button
                className="btn btn-ghost"
                onClick={() => setEditUser(null)}
              >
                取消
              </button>
              <button
                className="btn btn-primary"
                onClick={() =>
                  handleUpdateUser(editUser.user_id, {
                    displayName: editUser.display_name,
                    isActive: editUser.is_active,
                    sex: editUser.sex,
                  })
                }
              >
                儲存
              </button>
            </div>
          </div>
          <div
            className="modal-backdrop"
            onClick={() => setEditUser(null)}
          ></div>
        </div>
      )}

      {/* 刪除確認 */}
      <ConfirmDialog
        isOpen={!!deleteUser}
        title="確認刪除"
        message={`確定要刪除會員「${
          deleteUser?.display_name || deleteUser?.email
        }」嗎？此操作無法復原。`}
        onConfirm={() => deleteUser && handleDeleteUser(deleteUser.user_id)}
        onCancel={() => setDeleteUser(null)}
        confirmText="刪除"
        danger
      />
    </div>
  );
};

export default AdminUsers;
