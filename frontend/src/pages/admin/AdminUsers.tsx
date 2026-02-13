/**
 * AdminUsers 頁面 - 用戶管理（含排序與篩選）
 * @module pages/admin/AdminUsers
 * @theme luxe (LUXE 高端主題)
 */

import React, { useState, useEffect, useMemo } from "react";
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

/** 日誌工具 */
const logger = {
  info: (msg: string, data?: unknown) =>
    console.log(`[AdminUsers] ${msg}`, data || ""),
  error: (msg: string, err?: unknown) =>
    console.error(`[AdminUsers] ${msg}`, err || ""),
};

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

  // 篩選狀態
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [activeFilter, setActiveFilter] = useState<string>("all");
  const [albumFilter, setAlbumFilter] = useState<string>("all");

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
          logger.error("Failed to fetch users", res);
          setUsers([]);
          setError("載入用戶失敗：數據格式錯誤");
        }
      } catch (err) {
        logger.error("Failed to fetch users", err);
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
      setUsers((prev) =>
        prev.map((u) =>
          u.user_id === user.user_id ? { ...u, sex: !u.sex } : u,
        ),
      );
      logger.info("Toggled album permission", { userId: user.user_id });
    } catch (err) {
      logger.error("Failed to toggle sex permission", err);
      setError("切換權限失敗");
    }
  };

  /** 篩選後的用戶列表 */
  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      // 文字搜尋
      const matchSearch =
        !searchTerm ||
        user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase());

      // 角色篩選
      const matchRole =
        roleFilter === "all" ||
        (roleFilter === "admin" && user.role === "admin") ||
        (roleFilter === "user" && user.role !== "admin");

      // 活躍狀態篩選
      const matchActive =
        activeFilter === "all" ||
        (activeFilter === "active" && user.is_active) ||
        (activeFilter === "inactive" && !user.is_active);

      // 私密相簿篩選
      const matchAlbum =
        albumFilter === "all" ||
        (albumFilter === "enabled" && user.sex) ||
        (albumFilter === "disabled" && !user.sex);

      return matchSearch && matchRole && matchActive && matchAlbum;
    });
  }, [users, searchTerm, roleFilter, activeFilter, albumFilter]);

  const columns = [
    {
      key: "name" as const,
      header: "姓名",
      isPrimary: true,
      sortValue: (user: User) => (user.name || "").toLowerCase(),
    },
    {
      key: "email" as const,
      header: "電子郵件",
      sortValue: (user: User) => user.email.toLowerCase(),
    },
    {
      key: "role" as const,
      header: "角色",
      sortValue: (user: User) => (user.role === "admin" ? 0 : 1),
      render: (user: User) => (
        <span
          className={`px-2 py-1 text-xs rounded ${
            user.role === "admin"
              ? "bg-luxe-gold/20 text-luxe-gold"
              : "bg-luxe-muted/20 text-luxe-muted"
          }`}
        >
          {user.role === "admin" ? "管理員" : "一般用戶"}
        </span>
      ),
    },
    {
      key: "is_active" as const,
      header: "狀態",
      sortValue: (user: User) => (user.is_active ? 1 : 0),
      render: (user: User) => (
        <span
          className={`px-2 py-1 text-xs rounded ${
            user.is_active
              ? "bg-green-500/20 text-green-400"
              : "bg-red-500/20 text-red-400"
          }`}
        >
          {user.is_active ? "活躍" : "停用"}
        </span>
      ),
    },
    {
      key: "sex" as const,
      header: "私密相簿",
      sortValue: (user: User) => (user.sex ? 1 : 0),
      render: (user: User) => (
        <Toggle
          checked={user.sex ?? false}
          onChange={() => handleToggleSex(user)}
        />
      ),
    },
    {
      key: "createdAt" as const,
      header: "建立日期",
      hideOnMobile: true,
    },
    {
      key: "actions" as const,
      header: "操作",
      sortable: false,
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 mb-6 sm:mb-8">
        <div>
          <h1 className="text-xl sm:text-2xl font-light text-luxe-text">
            用戶管理
          </h1>
          <p className="text-sm sm:text-base text-luxe-muted">管理系統用戶</p>
        </div>
        <PillButton theme="luxe" variant="outline" className="w-full sm:w-auto">
          新增用戶
        </PillButton>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row flex-wrap gap-3 mb-6">
        <Input
          placeholder="搜尋姓名或信箱..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          theme="luxe"
          className="w-full sm:w-64"
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
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="w-full sm:w-auto bg-luxe-surface border border-luxe-gold/20 rounded-lg px-4 py-3 text-luxe-text text-sm focus:outline-none focus:border-luxe-gold/50 [&>option]:bg-luxe-surface [&>option]:text-luxe-text"
        >
          <option value="all">全部角色</option>
          <option value="admin">管理員</option>
          <option value="user">一般用戶</option>
        </select>
        <select
          value={activeFilter}
          onChange={(e) => setActiveFilter(e.target.value)}
          className="w-full sm:w-auto bg-luxe-surface border border-luxe-gold/20 rounded-lg px-4 py-3 text-luxe-text text-sm focus:outline-none focus:border-luxe-gold/50 [&>option]:bg-luxe-surface [&>option]:text-luxe-text"
        >
          <option value="all">全部狀態</option>
          <option value="active">活躍</option>
          <option value="inactive">停用</option>
        </select>
        <select
          value={albumFilter}
          onChange={(e) => setAlbumFilter(e.target.value)}
          className="w-full sm:w-auto bg-luxe-surface border border-luxe-gold/20 rounded-lg px-4 py-3 text-luxe-text text-sm focus:outline-none focus:border-luxe-gold/50 [&>option]:bg-luxe-surface [&>option]:text-luxe-text"
        >
          <option value="all">私密相簿</option>
          <option value="enabled">已啟用</option>
          <option value="disabled">未啟用</option>
        </select>
      </div>

      {/* 篩選結果計數 */}
      <div className="mb-3 text-xs text-luxe-muted">
        顯示 {filteredUsers.length} / {users.length} 位用戶
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
        sortable
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
