/**
 * LandingPageManager 頁面 - Landing Page 管理（Demo）
 *
 * 參照 AdminArticles 卡片佈局設計，
 * 使用本地 state 模擬資料（尚未接入後端）。
 *
 * @module pages/admin/LandingPageManager
 * @theme luxe (LUXE 高端主題)
 */

import React, { useState, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { PillButton, Input, useDialog } from "@/components/ui";

/** 日誌工具 */
const logger = {
  info: (msg: string, data?: unknown) =>
    console.log(`[LandingPageManager] ${msg}`, data || ""),
  error: (msg: string, err?: unknown) =>
    console.error(`[LandingPageManager] ${msg}`, err || ""),
};

/* ================================================================== */
/*  Types                                                              */
/* ================================================================== */

/** Landing Page 狀態 */
type PageStatus = "draft" | "published" | "archived";

/** Landing Page 資料結構（Demo 用） */
interface LandingPage {
  id: string;
  title: string;
  slug: string;
  description: string;
  status: PageStatus;
  thumbnailUrl: string;
  createdAt: string;
  updatedAt: string;
  viewCount: number;
}

/** 卡片檢視模式 */
type ViewMode = "card-sm" | "card-md" | "card-lg";

/** 檢視選項 */
const viewOptions: { mode: ViewMode; icon: string; label: string }[] = [
  { mode: "card-sm", icon: "▪▪▪", label: "小圖" },
  { mode: "card-md", icon: "◻◻", label: "中圖" },
  { mode: "card-lg", icon: "⬜", label: "大圖" },
];

/* ================================================================== */
/*  Demo 假資料                                                        */
/* ================================================================== */

const DEMO_PAGES: LandingPage[] = [
  {
    id: "lp-1",
    title: "2026 春季特訓班 — 限時早鳥優惠",
    slug: "2026-spring-bootcamp",
    description: "6 週密集訓練，報名享 85 折＋免費體適能評估",
    status: "published",
    thumbnailUrl: "",
    createdAt: "2026-01-10T09:00:00+08:00",
    updatedAt: "2026-02-01T14:30:00+08:00",
    viewCount: 342,
  },
  {
    id: "lp-2",
    title: "一對一私人教練體驗課",
    slug: "private-coaching-trial",
    description: "首次體驗價 $500，含身體組成分析報告",
    status: "draft",
    thumbnailUrl: "",
    createdAt: "2026-02-05T10:00:00+08:00",
    updatedAt: "2026-02-10T16:00:00+08:00",
    viewCount: 0,
  },
  {
    id: "lp-3",
    title: "企業員工健康方案",
    slug: "corporate-wellness",
    description: "客製化團體課程，提升團隊體能與工作效率",
    status: "published",
    thumbnailUrl: "",
    createdAt: "2026-01-20T08:00:00+08:00",
    updatedAt: "2026-02-14T11:00:00+08:00",
    viewCount: 128,
  },
  {
    id: "lp-4",
    title: "線上營養諮詢服務",
    slug: "online-nutrition",
    description: "搭配訓練的專業飲食計畫，遠端即可進行",
    status: "archived",
    thumbnailUrl: "",
    createdAt: "2025-11-01T09:00:00+08:00",
    updatedAt: "2025-12-20T10:00:00+08:00",
    viewCount: 87,
  },
];

/* ================================================================== */
/*  Helper                                                             */
/* ================================================================== */

/**
 * 取得狀態徽章 JSX
 *
 * @param {PageStatus} status - 頁面狀態
 * @returns {JSX.Element} 徽章元素
 */
const getStatusBadge = (status: PageStatus): JSX.Element => {
  const map: Record<PageStatus, { bg: string; text: string; label: string }> = {
    draft: {
      bg: "bg-yellow-500/20",
      text: "text-yellow-400",
      label: "草稿",
    },
    published: {
      bg: "bg-emerald-500/20",
      text: "text-emerald-400",
      label: "已發布",
    },
    archived: {
      bg: "bg-gray-500/20",
      text: "text-gray-400",
      label: "已封存",
    },
  };
  const s = map[status];
  return (
    <span
      className={`absolute top-1.5 left-1.5 ${s.bg} ${s.text} text-[10px] px-1.5 py-0.5 rounded-full font-bold shadow-sm backdrop-blur-sm`}
    >
      {s.label}
    </span>
  );
};

/* ================================================================== */
/*  主元件                                                              */
/* ================================================================== */

/**
 * LandingPageManager - Landing Page 管理頁面
 *
 * @returns {JSX.Element} Landing Page 管理頁面
 */
const LandingPageManager: React.FC = () => {
  const navigate = useNavigate();
  const dialog = useDialog();

  const [pages, setPages] = useState<LandingPage[]>(DEMO_PAGES);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [viewMode, setViewMode] = useState<ViewMode>("card-md");

  /* ── 篩選邏輯 ── */

  const filteredPages = useMemo(() => {
    let result = [...pages];

    // 狀態篩選
    if (statusFilter !== "all") {
      result = result.filter((p) => p.status === statusFilter);
    }

    // 搜尋
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      result = result.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.slug.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q),
      );
    }

    return result;
  }, [pages, searchTerm, statusFilter]);

  /* ── 操作 ── */

  /** 新增 Landing Page → 導航到 GrapesJS 編輯器 */
  const handleCreate = useCallback(() => {
    logger.info("建立新 Landing Page");
    navigate("/admin/landing-pages/new");
  }, [navigate]);

  /** 編輯 Landing Page → 導航到 GrapesJS 編輯器 */
  const handleEdit = useCallback(
    (page: LandingPage) => {
      logger.info("編輯 Landing Page", page.id);
      navigate(`/admin/landing-pages/${page.id}/edit`);
    },
    [navigate],
  );

  /** 刪除 Landing Page（Demo 直接從 state 移除） */
  const handleDelete = useCallback(
    async (page: LandingPage) => {
      try {
        const confirmed = await dialog.confirm({
          title: "刪除確認",
          message: `確定要刪除「${page.title}」嗎？此操作不可復原。`,
          variant: "danger",
          confirmText: "刪除",
          cancelText: "取消",
        });
        if (!confirmed) return;

        setPages((prev) => prev.filter((p) => p.id !== page.id));
        logger.info("已刪除 Landing Page", page.id);
      } catch (err) {
        logger.error("刪除失敗", err);
      }
    },
    [dialog],
  );

  /** 切換發布狀態（Demo） */
  const handleToggleStatus = useCallback((page: LandingPage) => {
    setPages((prev) =>
      prev.map((p) =>
        p.id === page.id
          ? {
              ...p,
              status: p.status === "published" ? "draft" : "published",
              updatedAt: new Date().toISOString(),
            }
          : p,
      ),
    );
    logger.info("切換狀態", {
      id: page.id,
      from: page.status,
    });
  }, []);

  /* ── 渲染 ── */

  /** Select 共用樣式 */
  const selectClass =
    "w-full sm:w-auto bg-luxe-surface border border-luxe-gold/20 rounded-lg px-4 py-3 pr-10 text-luxe-text text-sm focus:outline-none focus:border-luxe-gold/50 focus:ring-2 focus:ring-luxe-gold/20 appearance-none cursor-pointer hover:border-luxe-gold/40 transition-all duration-200 [&>option]:bg-luxe-surface [&>option]:text-luxe-text";

  const selectBgStyle = {
    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%23C9A96E'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
    backgroundRepeat: "no-repeat" as const,
    backgroundPosition: "right 0.5rem center",
    backgroundSize: "1.25em 1.25em",
  };

  return (
    <div>
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 mb-6 sm:mb-8">
        <div>
          <h1 className="text-xl sm:text-2xl font-light text-luxe-text">
            🚀 Landing Page 管理
          </h1>
          <p className="text-sm sm:text-base text-luxe-muted">
            建立與管理行銷活動頁面 ・ GrapesJS 視覺化編輯器
          </p>
          <span className="inline-block mt-1 text-[10px] text-yellow-400/80 bg-yellow-400/10 px-2 py-0.5 rounded">
            Demo 模式 — 資料僅存於瀏覽器記憶體
          </span>
        </div>
        <PillButton theme="luxe" variant="filled" onClick={handleCreate}>
          ＋ 新增 Landing Page
        </PillButton>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row flex-wrap gap-4 mb-6">
        <Input
          placeholder="搜尋頁面..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          theme="luxe"
          className="w-full sm:w-64"
          icon={
            <svg
              className="w-5 h-5"
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
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className={selectClass}
          style={selectBgStyle}
        >
          <option value="all">全部狀態</option>
          <option value="draft">草稿</option>
          <option value="published">已發布</option>
          <option value="archived">已封存</option>
        </select>

        {/* 檢視模式切換 */}
        <div className="flex gap-1 bg-luxe-surface rounded-lg p-1 border border-luxe-gold/10 ml-auto">
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
        共 {filteredPages.length} 個頁面
        {statusFilter !== "all" &&
          ` ・ 篩選：${statusFilter === "draft" ? "草稿" : statusFilter === "published" ? "已發布" : "已封存"}`}
      </div>

      {/* Cards Grid */}
      {filteredPages.length === 0 ? (
        <div className="text-center py-16 text-luxe-muted">
          <p className="text-5xl mb-4">📄</p>
          <p className="text-lg mb-2">尚無 Landing Page</p>
          <p className="text-sm mb-6">
            點擊上方「＋ 新增 Landing Page」開始建立
          </p>
          <PillButton theme="luxe" variant="outline" onClick={handleCreate}>
            立即建立
          </PillButton>
        </div>
      ) : (
        <div
          className={`grid gap-4 ${
            viewMode === "card-sm"
              ? "grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6"
              : viewMode === "card-md"
                ? "grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4"
                : "grid-cols-1 sm:grid-cols-2 xl:grid-cols-3"
          }`}
        >
          {filteredPages.map((page) => (
            <div
              key={page.id}
              className="group bg-luxe-surface rounded-lg border border-luxe-gold/10 hover:border-luxe-gold/30 overflow-hidden transition-all hover:shadow-lg hover:shadow-luxe-gold/5"
            >
              {/* 縮圖 */}
              <div className="aspect-[16/9] bg-luxe-bg flex items-center justify-center relative">
                {page.thumbnailUrl ? (
                  <img
                    src={page.thumbnailUrl}
                    alt={page.title}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <div className="flex flex-col items-center gap-1">
                    <span className="text-4xl">🚀</span>
                    <span className="text-[10px] text-luxe-muted/40">
                      Landing Page
                    </span>
                  </div>
                )}
                {getStatusBadge(page.status)}
              </div>

              {/* 資訊 */}
              <div className="p-3">
                <h3
                  className={`font-medium text-luxe-text truncate mb-1 ${
                    viewMode === "card-sm" ? "text-xs" : "text-sm"
                  }`}
                >
                  {page.title}
                </h3>
                {viewMode !== "card-sm" && (
                  <p className="text-xs text-luxe-muted line-clamp-2 mb-2">
                    {page.description || "無描述"}
                  </p>
                )}
                <div className="flex items-center justify-between text-[10px] text-luxe-muted">
                  <span className="truncate max-w-[120px]">/{page.slug}</span>
                  <span>👁 {page.viewCount}</span>
                </div>

                {/* 操作按鈕 */}
                <div className="flex gap-2 mt-2 pt-2 border-t border-luxe-gold/5 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => handleEdit(page)}
                    className="text-luxe-gold hover:underline text-xs flex-1"
                  >
                    編輯
                  </button>
                  <button
                    onClick={() => handleToggleStatus(page)}
                    className="text-emerald-400 hover:underline text-xs"
                  >
                    {page.status === "published" ? "下架" : "發布"}
                  </button>
                  <button
                    onClick={() => handleDelete(page)}
                    className="text-red-400 hover:underline text-xs"
                  >
                    刪除
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default LandingPageManager;
