/**
 * AdminUsers 頁面 - 用戶管理（含排序、篩選、多檢視模式、詳情彈窗）
 * @module pages/admin/AdminUsers
 * @theme luxe (LUXE 高端主題)
 */

import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  DataTable,
  Pagination,
  PillButton,
  Input,
  Modal,
  Toggle,
} from "@/components/ui";
import { get, put } from "@/services/api";
import { useLanguage } from "@/context/LanguageContext";
import type { User, PaginatedUsersResponse } from "@/types";

/** 課程售價可見性介面 */
interface CoursePriceVisibility {
  course_id: number;
  course_title: string;
  price: number;
  status: string;
  show_price: boolean;
}

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

/** 檢視模式 */
type ViewMode = "list" | "card-sm" | "card-md" | "card-lg";

/** 檢視模式選項（label 需要字典，所以只在這裡留 icon 對應） */
const viewModeIcons: { mode: ViewMode; icon: string }[] = [
  { mode: "list", icon: "☰" },
  { mode: "card-sm", icon: "▪▪▪" },
  { mode: "card-md", icon: "◻◻" },
  { mode: "card-lg", icon: "⬜" },
];

const AdminUsers: React.FC = () => {
  const { t } = useLanguage();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [detailUser, setDetailUser] = useState<User | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [priceVisibility, setPriceVisibility] = useState<
    CoursePriceVisibility[]
  >([]);
  const [priceLoading, setPriceLoading] = useState(false);
  const [showPriceModal, setShowPriceModal] = useState(false);

  // 篩選狀態
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [activeFilter, setActiveFilter] = useState<string>("all");

  /** 檢視模式選項（label 走字典） */
  const viewOptions = useMemo(
    () =>
      viewModeIcons.map((v) => ({
        ...v,
        label: {
          list: t.adminUsersPage.view.list,
          "card-sm": t.adminUsersPage.view.small,
          "card-md": t.adminUsersPage.view.medium,
          "card-lg": t.adminUsersPage.view.large,
        }[v.mode],
      })),
    [t],
  );

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
                  avatar_url: u.avatar_base64 || u.avatar_url || undefined,
                  phone_number: u.phone_number,
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
          setError(t.adminUsersPage.error.loadFormat);
        }
      } catch (err) {
        logger.error("Failed to fetch users", err);
        setUsers([]);
        setError(t.adminUsersPage.error.loadFailed);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [currentPage, t]);

  /**
   * 取得指定使用者的課程售價可見性
   */
  const fetchPriceVisibility = useCallback(async (userId: number) => {
    try {
      setPriceLoading(true);
      const data = await get<CoursePriceVisibility[]>(
        `/api/admin/price-visibility/${userId}`,
      );
      setPriceVisibility(Array.isArray(data) ? data : []);
    } catch (err) {
      logger.error("Failed to fetch price visibility", err);
      setPriceVisibility([]);
    } finally {
      setPriceLoading(false);
    }
  }, []);

  /**
   * 切換單一課程售價可見性
   */
  const handleTogglePriceVisibility = async (
    userId: number,
    courseId: number,
    showPrice: boolean,
  ) => {
    try {
      await put("/api/admin/price-visibility", {
        userId,
        courseId,
        showPrice,
      });
      setPriceVisibility((prev) =>
        prev.map((item) =>
          item.course_id === courseId
            ? { ...item, show_price: showPrice }
            : item,
        ),
      );
    } catch (err) {
      logger.error("Failed to toggle price visibility", err);
      setError(t.adminUsersPage.error.togglePrice);
    }
  };

  /**
   * 批次切換所有課程售價可見性
   */
  const handleBatchToggle = async (userId: number, showAll: boolean) => {
    try {
      await put("/api/admin/price-visibility/batch", { userId, showAll });
      setPriceVisibility((prev) =>
        prev.map((item) => ({ ...item, show_price: showAll })),
      );
    } catch (err) {
      logger.error("Failed to batch toggle price visibility", err);
      setError(t.adminUsersPage.error.batchTogglePrice);
    }
  };

  // 當 detailUser 改變時自動載入售價可見性
  useEffect(() => {
    if (detailUser?.user_id) {
      fetchPriceVisibility(detailUser.user_id);
    } else {
      setPriceVisibility([]);
    }
  }, [detailUser, fetchPriceVisibility]);

  /**
   * 渲染使用者頭像
   */
  const renderAvatar = useCallback(
    (user: User, size: "sm" | "md" | "lg" = "md") => {
      const sizeClasses = {
        sm: "w-8 h-8 text-xs",
        md: "w-12 h-12 text-base",
        lg: "w-20 h-20 text-2xl",
      };
      return user.avatar_url ? (
        <img
          src={user.avatar_url}
          alt={user.name}
          className={`${sizeClasses[size]} rounded-full object-cover border border-luxe-gold/30`}
          loading="lazy"
        />
      ) : (
        <div
          className={`${sizeClasses[size]} rounded-full bg-luxe-gold/15 border border-luxe-gold/30 flex items-center justify-center text-luxe-gold font-semibold`}
        >
          {user.name?.charAt(0)?.toUpperCase() || "U"}
        </div>
      );
    },
    [],
  );

  /** 角色徽章 */
  const getRoleBadge = (user: User) => (
    <span
      className={`px-2 py-0.5 text-[10px] rounded-full font-medium ${
        user.role === "admin"
          ? "bg-luxe-gold/20 text-luxe-gold"
          : "bg-luxe-muted/15 text-luxe-muted"
      }`}
    >
      {user.role === "admin"
        ? t.adminUsersPage.role.admin
        : t.adminUsersPage.role.user}
    </span>
  );

  /** 狀態徽章 */
  const getStatusBadge = (user: User) => (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 text-[10px] rounded-full font-medium ${
        user.is_active
          ? "bg-emerald-500/15 text-emerald-400"
          : "bg-red-500/15 text-red-400"
      }`}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full ${user.is_active ? "bg-emerald-400" : "bg-red-400"}`}
      />
      {user.is_active
        ? t.adminUsersPage.status.active
        : t.adminUsersPage.status.inactive}
    </span>
  );

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

      return matchSearch && matchRole && matchActive;
    });
  }, [users, searchTerm, roleFilter, activeFilter]);

  const columns = [
    {
      key: "name" as const,
      header: t.adminUsersPage.table.colName,
      isPrimary: true,
      sortValue: (user: User) => (user.name || "").toLowerCase(),
      render: (user: User) => (
        <div className="flex items-center gap-2">
          {renderAvatar(user, "sm")}
          <span className="truncate">{user.name || "—"}</span>
        </div>
      ),
    },
    {
      key: "email" as const,
      header: t.adminUsersPage.table.colEmail,
      sortValue: (user: User) => user.email.toLowerCase(),
    },
    {
      key: "role" as const,
      header: t.adminUsersPage.table.colRole,
      sortValue: (user: User) => (user.role === "admin" ? 0 : 1),
      render: (user: User) => getRoleBadge(user),
    },
    {
      key: "is_active" as const,
      header: t.adminCommon.colStatus,
      sortValue: (user: User) => (user.is_active ? 1 : 0),
      render: (user: User) => getStatusBadge(user),
    },
    {
      key: "createdAt" as const,
      header: t.adminUsersPage.table.colCreatedAt,
      hideOnMobile: true,
    },
    {
      key: "actions" as const,
      header: t.adminCommon.colActions,
      sortable: false,
      render: (user: User) => (
        <div className="flex gap-2">
          <button
            data-tour="users-view-btn"
            onClick={(e) => {
              e.stopPropagation();
              setDetailUser(user);
            }}
            className="text-blue-400 hover:underline text-sm"
          >
            {t.adminUsersPage.table.actionView}
          </button>
          <button
            data-tour="users-edit-btn"
            onClick={(e) => {
              e.stopPropagation();
              setSelectedUser(user);
            }}
            className="text-luxe-gold hover:underline text-sm"
          >
            {t.common.edit}
          </button>
        </div>
      ),
    },
  ];

  return (
    <div>
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 mb-6 sm:mb-8">
        <div>
          <h1 className="text-xl sm:text-2xl font-light text-luxe-text">
            {t.admin.users}
          </h1>
          <p className="text-sm sm:text-base text-luxe-muted">
            {t.adminUsersPage.pageSubtitle}
          </p>
        </div>
        <PillButton
          theme="luxe"
          variant="outline"
          className="w-full sm:w-auto"
          data-tour="users-add"
        >
          {t.adminUsersPage.addUser}
        </PillButton>
      </div>

      {/* Filters + View Toggle */}
      <div className="flex flex-col sm:flex-row flex-wrap gap-3 mb-6">
        <Input
          data-tour="users-search"
          placeholder={t.adminUsersPage.searchPlaceholder}
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
          data-tour="users-role-filter"
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="w-full sm:w-auto bg-luxe-surface border border-luxe-gold/20 rounded-lg px-4 py-3 pr-10 text-luxe-text text-sm focus:outline-none focus:border-luxe-gold/50 focus:ring-2 focus:ring-luxe-gold/20 appearance-none cursor-pointer hover:border-luxe-gold/40 transition-all [&>option]:bg-luxe-surface [&>option]:text-luxe-text"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%23C9A96E'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
            backgroundRepeat: "no-repeat",
            backgroundPosition: "right 0.5rem center",
            backgroundSize: "1.25em 1.25em",
          }}
        >
          <option value="all">{t.adminUsersPage.filter.allRoles}</option>
          <option value="admin">{t.adminUsersPage.role.admin}</option>
          <option value="user">{t.adminUsersPage.filter.standardUser}</option>
        </select>
        <select
          data-tour="users-status-filter"
          value={activeFilter}
          onChange={(e) => setActiveFilter(e.target.value)}
          className="w-full sm:w-auto bg-luxe-surface border border-luxe-gold/20 rounded-lg px-4 py-3 pr-10 text-luxe-text text-sm focus:outline-none focus:border-luxe-gold/50 focus:ring-2 focus:ring-luxe-gold/20 appearance-none cursor-pointer hover:border-luxe-gold/40 transition-all [&>option]:bg-luxe-surface [&>option]:text-luxe-text"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%23C9A96E'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
            backgroundRepeat: "no-repeat",
            backgroundPosition: "right 0.5rem center",
            backgroundSize: "1.25em 1.25em",
          }}
        >
          <option value="all">{t.adminUsersPage.filter.allStatuses}</option>
          <option value="active">{t.adminUsersPage.status.active}</option>
          <option value="inactive">{t.adminUsersPage.status.inactive}</option>
        </select>
        {/* 檢視模式切換 */}
        <div
          data-tour="users-view-toggle"
          className="flex gap-1 bg-luxe-surface rounded-lg p-1 border border-luxe-gold/10 ml-auto"
        >
          {viewOptions.map((opt) => (
            <button
              key={opt.mode}
              onClick={() => setViewMode(opt.mode)}
              className={`px-3 py-1.5 rounded text-xs font-medium transition-all ${
                viewMode === opt.mode
                  ? "bg-luxe-gold/20 text-luxe-gold"
                  : "text-luxe-muted hover:text-luxe-text"
              }`}
              title={opt.label}
            >
              {opt.icon}
            </button>
          ))}
        </div>
      </div>

      {/* 篩選結果計數 */}
      <div className="mb-3 text-xs text-luxe-muted">
        {t.adminUsersPage.resultCount
          .replace("{n}", String(filteredUsers.length))
          .replace("{total}", String(users.length))}
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-4 bg-red-900/20 border border-red-500/30 rounded-lg text-red-400">
          {error}
        </div>
      )}

      {/* ====== Content: List or Card ====== */}
      {viewMode === "list" ? (
        <>
          <DataTable
            data-tour="users-table"
            columns={columns}
            data={filteredUsers}
            keyExtractor={(user) => user.user_id}
            loading={loading}
            theme="luxe"
            emptyMessage={t.adminUsersPage.empty}
            sortable
            onRowClick={(user) => setDetailUser(user)}
          />
          <div className="mt-6">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
              theme="luxe"
            />
          </div>
        </>
      ) : (
        <>
          {loading ? (
            <div className="text-center py-12 text-luxe-muted">
              {t.common.loading}
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-12 text-luxe-muted">
              {t.adminUsersPage.empty}
            </div>
          ) : (
            <div
              className={`grid gap-4 ${
                viewMode === "card-sm"
                  ? "grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8"
                  : viewMode === "card-md"
                    ? "grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5"
                    : "grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4"
              }`}
            >
              {filteredUsers.map((user) => (
                <div
                  key={user.user_id}
                  onClick={() => setDetailUser(user)}
                  className={`group bg-luxe-surface rounded-lg border border-luxe-gold/10 hover:border-luxe-gold/30 overflow-hidden transition-all cursor-pointer hover:shadow-lg hover:shadow-luxe-gold/5 ${
                    user.role === "admin" ? "ring-1 ring-luxe-gold/15" : ""
                  }`}
                >
                  {/* ===== card-sm: 頭像 + 名字 ===== */}
                  {viewMode === "card-sm" && (
                    <div className="flex flex-col items-center py-3 px-2 gap-2">
                      {renderAvatar(user, "md")}
                      <div className="text-center min-w-0 w-full">
                        <p className="text-xs text-luxe-text truncate font-medium">
                          {user.name || "—"}
                        </p>
                        <div className="mt-1">{getRoleBadge(user)}</div>
                      </div>
                    </div>
                  )}

                  {/* ===== card-md: 頭像 + 資訊列 ===== */}
                  {viewMode === "card-md" && (
                    <div className="p-4">
                      <div className="flex items-center gap-3 mb-3">
                        {renderAvatar(user, "md")}
                        <div className="min-w-0 flex-1">
                          <p className="text-sm text-luxe-text truncate font-medium">
                            {user.name || "—"}
                          </p>
                          <p className="text-xs text-luxe-muted truncate">
                            {user.email}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-[10px]">
                        <div className="flex gap-1.5">
                          {getRoleBadge(user)}
                          {getStatusBadge(user)}
                        </div>
                        <span className="text-luxe-muted">
                          {user.createdAt}
                        </span>
                      </div>
                      {/* hover 操作列 */}
                      <div className="flex gap-2 mt-3 pt-2 border-t border-luxe-gold/5 transition-opacity">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedUser(user);
                          }}
                          className="text-luxe-gold hover:underline text-xs flex-1"
                        >
                          {t.common.edit}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* ===== card-lg: 大頭像 + 完整資訊 ===== */}
                  {viewMode === "card-lg" && (
                    <div className="p-5">
                      <div className="flex flex-col items-center mb-4">
                        {renderAvatar(user, "lg")}
                        <p className="mt-3 text-base text-luxe-text font-medium truncate max-w-full">
                          {user.name || "—"}
                        </p>
                        <p className="text-xs text-luxe-muted truncate max-w-full">
                          {user.email}
                        </p>
                      </div>
                      <div className="flex items-center justify-center gap-2 mb-3">
                        {getRoleBadge(user)}
                        {getStatusBadge(user)}
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs text-luxe-muted border-t border-luxe-gold/10 pt-3">
                        <div>
                          <span className="text-luxe-muted/60">
                            {t.adminUsersPage.detail.createdAt}
                          </span>
                          <p className="text-luxe-text">{user.createdAt}</p>
                        </div>
                        {user.phone_number && (
                          <div className="col-span-2">
                            <span className="text-luxe-muted/60">
                              {t.adminUsersPage.detail.phoneShort}
                            </span>
                            <p className="text-luxe-text">
                              {user.phone_number}
                            </p>
                          </div>
                        )}
                      </div>
                      {/* hover 操作列 */}
                      <div className="flex gap-2 mt-3 pt-2 border-t border-luxe-gold/5 transition-opacity">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedUser(user);
                          }}
                          className="text-luxe-gold hover:underline text-xs flex-1"
                        >
                          {t.common.edit}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
          <div className="mt-6">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
              theme="luxe"
            />
          </div>
        </>
      )}

      {/* ====== 使用者詳情 Modal ====== */}
      <Modal
        isOpen={!!detailUser}
        onClose={() => setDetailUser(null)}
        title={t.adminUsersPage.detail.title}
        theme="luxe"
        size="md"
        tourId="user-detail"
      >
        {detailUser && (
          <div className="space-y-6">
            {/* 頭像 + 基本資訊 */}
            <div className="flex flex-col items-center pb-4 border-b border-luxe-gold/10">
              {renderAvatar(detailUser, "lg")}
              <h3 className="mt-3 text-lg text-luxe-text font-medium">
                {detailUser.display_name || detailUser.name || "—"}
              </h3>
              <p className="text-sm text-luxe-muted">{detailUser.email}</p>
              <div className="flex gap-2 mt-2">
                {getRoleBadge(detailUser)}
                {getStatusBadge(detailUser)}
              </div>
            </div>

            {/* 詳細欄位 */}
            <div
              className="grid grid-cols-2 gap-x-6 gap-y-4 text-sm"
              data-tour="user-detail-fields"
            >
              <div>
                <span className="text-luxe-muted text-xs block mb-0.5">
                  {t.adminUsersPage.detail.userId}
                </span>
                <span className="text-luxe-text font-mono">
                  {detailUser.user_id}
                </span>
              </div>
              <div>
                <span className="text-luxe-muted text-xs block mb-0.5">
                  {t.adminUsersPage.detail.displayName}
                </span>
                <span className="text-luxe-text">
                  {detailUser.display_name || "—"}
                </span>
              </div>
              <div>
                <span className="text-luxe-muted text-xs block mb-0.5">
                  {t.adminUsersPage.detail.phone}
                </span>
                <span className="text-luxe-text">
                  {detailUser.phone_number || "—"}
                </span>
              </div>
              <div>
                <span className="text-luxe-muted text-xs block mb-0.5">
                  {t.adminUsersPage.detail.createdAt}
                </span>
                <span className="text-luxe-text">
                  {detailUser.created_at?.split("T")[0] || "—"}
                </span>
              </div>
              <div>
                <span className="text-luxe-muted text-xs block mb-0.5">
                  {t.adminUsersPage.detail.accountStatus}
                </span>
                <span className="text-luxe-text">
                  {detailUser.is_active
                    ? `✅ ${t.adminUsersPage.status.active}`
                    : `❌ ${t.adminUsersPage.status.inactive}`}
                </span>
              </div>
            </div>

            {/* 操作按鈕 */}
            <div className="flex flex-wrap justify-between gap-3 pt-4 border-t border-luxe-gold/10">
              <PillButton
                theme="luxe"
                variant="outline"
                data-tour="user-detail-price"
                onClick={() => setShowPriceModal(true)}
              >
                💰 {t.adminUsersPage.price.title}
              </PillButton>
              <div className="flex gap-3">
                <PillButton
                  theme="luxe"
                  variant="outline"
                  onClick={() => setDetailUser(null)}
                >
                  {t.adminCommon.close}
                </PillButton>
                <PillButton
                  theme="luxe"
                  variant="filled"
                  onClick={() => {
                    setSelectedUser(detailUser);
                    setDetailUser(null);
                  }}
                >
                  {t.adminUsersPage.detail.editUser}
                </PillButton>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* ====== 課程售價顯示管理 Modal ====== */}
      <Modal
        isOpen={showPriceModal && !!detailUser}
        onClose={() => setShowPriceModal(false)}
        title={t.adminUsersPage.price.titleFor.replace(
          "{name}",
          detailUser?.display_name || detailUser?.name || "",
        )}
        theme="luxe"
        size="md"
      >
        {detailUser && (
          <div className="space-y-4">
            {priceVisibility.length > 0 && (
              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => handleBatchToggle(detailUser.user_id, true)}
                  className="text-[11px] px-2.5 py-1 rounded-md bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25 transition-colors"
                >
                  {t.adminUsersPage.price.showAll}
                </button>
                <button
                  onClick={() => handleBatchToggle(detailUser.user_id, false)}
                  className="text-[11px] px-2.5 py-1 rounded-md bg-red-500/15 text-red-400 hover:bg-red-500/25 transition-colors"
                >
                  {t.adminUsersPage.price.hideAll}
                </button>
              </div>
            )}

            {priceLoading ? (
              <div className="text-xs text-luxe-muted py-6 text-center">
                {t.common.loading}
              </div>
            ) : priceVisibility.length === 0 ? (
              <div className="text-xs text-luxe-muted py-6 text-center">
                {t.adminUsersPage.price.empty}
              </div>
            ) : (
              <div className="max-h-[60vh] overflow-y-auto space-y-1.5 pr-1 scrollbar-thin scrollbar-thumb-luxe-gold/20 scrollbar-track-transparent">
                {priceVisibility.map((item) => (
                  <div
                    key={item.course_id}
                    className="flex items-center justify-between gap-3 py-2 px-3 rounded-lg bg-luxe-surface/50 border border-luxe-gold/5 hover:border-luxe-gold/15 transition-colors"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-luxe-text truncate">{item.course_title}</p>
                      <p className="text-[10px] text-luxe-muted">
                        NT$ {item.price?.toLocaleString() || 0}
                        {item.status !== "published" && (
                          <span className="ml-1.5 text-amber-400/80">
                            (
                            {item.status === "draft"
                              ? t.common.draft
                              : t.adminUsersPage.price.archived}
                            )
                          </span>
                        )}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`text-[10px] ${item.show_price ? "text-emerald-400" : "text-luxe-muted"}`}>
                        {item.show_price
                          ? t.adminUsersPage.price.shown
                          : t.adminUsersPage.price.hidden}
                      </span>
                      <Toggle
                        checked={item.show_price}
                        onChange={() =>
                          handleTogglePriceVisibility(
                            detailUser.user_id,
                            item.course_id,
                            !item.show_price,
                          )
                        }
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="flex justify-end pt-2 border-t border-luxe-gold/10">
              <PillButton theme="luxe" variant="outline" onClick={() => setShowPriceModal(false)}>
                {t.adminCommon.close}
              </PillButton>
            </div>
          </div>
        )}
      </Modal>

      {/* ====== 編輯 Modal ====== */}
      <Modal
        isOpen={!!selectedUser}
        onClose={() => setSelectedUser(null)}
        title={t.adminUsersPage.detail.editUser}
        theme="luxe"
        tourId="user-edit"
      >
        {selectedUser && (
          <form className="space-y-4">
            <Input
              data-tour="user-edit-name"
              label={t.adminUsersPage.table.colName}
              defaultValue={selectedUser.name || ""}
              theme="luxe"
            />
            <Input
              label={t.adminUsersPage.table.colEmail}
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
                {t.common.cancel}
              </PillButton>
              <PillButton theme="luxe" variant="filled" data-tour="user-edit-submit">
                {t.common.save}
              </PillButton>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};

export default AdminUsers;
