/**
 * AdminUsers 頁面 - 用戶管理
 * @module pages/admin/AdminUsers
 * @theme luxe (LUXE 高端主題)
 */

import React, { useState, useEffect } from "react";
import {
  DataTable,
  Pagination,
  PillButton,
  Input,
  Modal,
  Toggle,
} from "@/components/ui";
import { get, put } from "@/services/api";
import type { User, PaginatedUsersResponse } from "@/types";

/**
 * AdminUsers - 用戶管理頁面
 *
 * @returns {JSX.Element} 用戶管理頁面
 */
const AdminUsers: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        setError("");
        const res = await get<PaginatedUsersResponse>(
          `/api/admin/users?page=${currentPage}&limit=10`,
        );
        // ✅ 防禦性編程：API 攔截器返回 response.data
        if (res && res.users && Array.isArray(res.users)) {
          setUsers(
            res.users.map(
              (u) =>
                ({
                  // 資料庫欄位
                  user_id: u.user_id,
                  name: u.display_name || u.name || u.username || "",
                  display_name: u.display_name,
                  email: u.email,
                  sex: u.sex ?? false,
                  is_active: u.is_active ?? true,
                  created_at: u.created_at || new Date().toISOString(),
                  updated_at: u.updated_at || new Date().toISOString(),
                  // 前端別名
                  id: u.user_id,
                  role: u.isAdmin ? "admin" : "user",
                  isAdmin: u.isAdmin ?? false,
                  createdAt: u.created_at?.split("T")[0] || "",
                }) as User,
            ),
          );
          setTotalPages(res.totalPages || 1);
        } else {
          console.error("Failed to fetch users:", res);
          setUsers([]);
          setError("載入用戶失敗：數據格式錯誤");
        }
      } catch (err) {
        console.error("Failed to fetch users:", err);
        setUsers([]);
        setError("載入用戶失敗");
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [currentPage]);

  /**
   * 切換私密相簿權限
   */
  const handleToggleSex = async (user: User) => {
    try {
      await put(`/api/admin/users/${user.user_id}`, { sex: !user.sex });
      // 更新本地狀態
      setUsers((prev) =>
        prev.map((u) =>
          u.user_id === user.user_id ? { ...u, sex: !u.sex } : u,
        ),
      );
    } catch (err) {
      console.error("Failed to toggle sex permission:", err);
      setError("切換權限失敗");
    }
  };

  const filteredUsers = users.filter(
    (user) =>
      user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const columns = [
    { key: "name" as const, header: "姓名", isPrimary: true },
    { key: "email" as const, header: "電子郵件" },
    {
      key: "role" as const,
      header: "角色",
      render: (user: User) => (
        <span
          className={`
            px-2 py-1 text-xs rounded
            ${
              user.role === "admin"
                ? "bg-luxe-gold/20 text-luxe-gold"
                : "bg-luxe-muted/20 text-luxe-muted"
            }
          `}
        >
          {user.role === "admin" ? "管理員" : "一般用戶"}
        </span>
      ),
    },
    {
      key: "sex" as const,
      header: "私密相簿",
      render: (user: User) => (
        <Toggle
          checked={user.sex ?? false}
          onChange={() => handleToggleSex(user)}
        />
      ),
    },
    { key: "createdAt" as const, header: "建立日期", hideOnMobile: true },
    {
      key: "actions" as const,
      header: "操作",
      render: (user: User) => (
        <button
          onClick={() => setSelectedUser(user)}
          className="text-luxe-gold hover:underline text-sm"
        >
          編輯
        </button>
      ),
    },
  ];

  return (
    <div>
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-light text-luxe-text">用戶管理</h1>
          <p className="text-luxe-muted">管理系統用戶</p>
        </div>
        <PillButton theme="luxe" variant="outline" className="w-full sm:w-auto">
          新增用戶
        </PillButton>
      </div>

      {/* Search */}
      <div className="mb-6">
        <Input
          placeholder="搜尋用戶..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          theme="luxe"
          className="w-full sm:max-w-sm"
          icon={
            <svg
              className="w-4 h-4 text-luxe-muted"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          }
        />
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-4 bg-red-900/20 border border-red-500/30 rounded-lg text-red-400">
          {error}
        </div>
      )}

      {/* Table */}
      <DataTable
        columns={columns}
        data={filteredUsers}
        keyExtractor={(user) => user.user_id}
        loading={loading}
        theme="luxe"
        emptyMessage="沒有找到用戶"
      />

      {/* Pagination */}
      <div className="mt-6">
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          theme="luxe"
        />
      </div>

      {/* Edit Modal */}
      <Modal
        isOpen={!!selectedUser}
        onClose={() => setSelectedUser(null)}
        title="編輯用戶"
        theme="luxe"
      >
        {selectedUser && (
          <form className="space-y-4">
            <Input
              label="姓名"
              defaultValue={selectedUser.name || ""}
              theme="luxe"
            />
            <Input
              label="電子郵件"
              defaultValue={selectedUser.email}
              theme="luxe"
              disabled
            />
            <div className="flex justify-end gap-3 pt-4">
              <PillButton
                theme="luxe"
                variant="outline"
                onClick={() => setSelectedUser(null)}
              >
                取消
              </PillButton>
              <PillButton theme="luxe" variant="filled">
                儲存
              </PillButton>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};

export default AdminUsers;
