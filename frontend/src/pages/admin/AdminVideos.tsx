/**
 * AdminVideos 頁面 - 影片管理
 * 支援拖曳排序 + 直接編輯排序編號 + 卡片/列表檢視切換
 *
 * @module pages/admin/AdminVideos
 * @theme luxe (LUXE 高端主題)
 */

import React, {
  useState,
  useEffect,
  useCallback,
  useRef,
  useMemo,
} from "react";
import { PillButton, Input, useDialog } from "@/components/ui";
import { get, post, put } from "@/services/api";
import { videoService } from "@/services/video.service";
import type { AdminVideo } from "@/types";
import { useScrollLock } from "@/hooks/useScrollLock";

/** 日誌工具 */
const logger = {
  info: (msg: string, data?: unknown) =>
    console.log(`[AdminVideos] ${msg}`, data || ""),
  error: (msg: string, err?: unknown) =>
    console.error(`[AdminVideos] ${msg}`, err || ""),
};

type ViewMode = "list" | "card-sm" | "card-md" | "card-lg";

/** 取得 Instagram 影片嵌入縮圖 URL */
const getVideoThumbnail = (video: AdminVideo): string => {
  if (video.type === "youtube") {
    const match = video.url?.match(
      /(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|shorts\/))([a-zA-Z0-9_-]+)/,
    );
    if (match) return `https://img.youtube.com/vi/${match[1]}/mqdefault.jpg`;
  }
  return "";
};

/** 取得平台圖示 */
const getPlatformIcon = (type: string): string => {
  switch (type) {
    case "youtube":   return "🎬";
    case "instagram": return "📸";
    case "facebook":  return "📘";
    case "tiktok":    return "🎵";
    default:          return "🎞️";
  }
};

/**
 * AdminVideos - 影片管理頁面
 * 重心是「排列渲染順序」，而非傳統 CRUD 編輯
 */
const AdminVideos: React.FC = () => {
  const dialog = useDialog();

  const [videos, setVideos] = useState<AdminVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // ── IG Session (localStorage 持久化) ──
  const IG_SESSION_KEY = "admin_ig_sessionid";
  const [igSession, setIgSession] = useState<string>(
    () => localStorage.getItem(IG_SESSION_KEY) ?? "",
  );
  const [showIgSessionPanel, setShowIgSessionPanel] = useState(false);
  const [igSessionInput, setIgSessionInput] = useState("");

  const saveIgSession = () => {
    const val = igSessionInput.trim();
    localStorage.setItem(IG_SESSION_KEY, val);
    setIgSession(val);
    setShowIgSessionPanel(false);
    setIgSessionInput("");
  };

  const clearIgSession = () => {
    localStorage.removeItem(IG_SESSION_KEY);
    setIgSession("");
  };

  // ── 批量新增影片 Modal 狀態 ──
  const [showAddModal, setShowAddModal] = useState(false);
  const [addSubmitting, setAddSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const fileRowRef = useRef<number>(-1); // 記錄哪一列在上傳

  type AddRow = {
    id: number;
    url: string;
    title: string;
    description: string;
    type: string;
    thumbnail: string;
    fetchState: "idle" | "fetching" | "done" | "error";
    fetchError: string;
  };

  const newRow = (id: number): AddRow => ({
    id, url: "", title: "", description: "", type: "instagram",
    thumbnail: "", fetchState: "idle", fetchError: "",
  });

  const [addRows, setAddRows] = useState<AddRow[]>(() => [newRow(0)]);
  const nextIdRef = useRef(1);

  // 拖曳狀態
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const dragCounter = useRef(0);

  // ===== 載入影片 =====
  const fetchVideos = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const res = await get<AdminVideo[]>("/api/videos/admin/all");
      if (res && Array.isArray(res)) {
        setVideos(res);
        setHasUnsavedChanges(false);
      } else {
        setVideos([]);
        setError("載入影片失敗：數據格式錯誤");
      }
    } catch (err) {
      logger.error("載入影片失敗", err);
      setVideos([]);
      setError("載入影片失敗");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchVideos();
  }, [fetchVideos]);

  // ===== 搜尋過濾 =====
  const filteredVideos = useMemo(() => {
    if (!searchTerm) return videos;
    const term = searchTerm.toLowerCase();
    return videos.filter(
      (v) =>
        v.title.toLowerCase().includes(term) ||
        v.type?.toLowerCase().includes(term),
    );
  }, [videos, searchTerm]);

  // ===== 拖曳排序 =====
  const handleDragStart = (index: number) => {
    setDragIndex(index);
  };

  const handleDragEnter = (index: number) => {
    dragCounter.current++;
    setDragOverIndex(index);
  };

  const handleDragLeave = () => {
    dragCounter.current--;
    if (dragCounter.current <= 0) {
      setDragOverIndex(null);
      dragCounter.current = 0;
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();

    // 邊緣自動滾動：距視窗上/下 80px 範圍內觸發捲動
    const EDGE = 80;
    const SPEED = 12;
    const { clientY } = e;
    const { innerHeight } = window;

    if (clientY < EDGE) {
      window.scrollBy({ top: -SPEED, behavior: "instant" as ScrollBehavior });
    } else if (clientY > innerHeight - EDGE) {
      window.scrollBy({ top: SPEED, behavior: "instant" as ScrollBehavior });
    }
  };

  const handleDrop = (dropIndex: number) => {
    if (dragIndex === null || dragIndex === dropIndex) {
      setDragIndex(null);
      setDragOverIndex(null);
      dragCounter.current = 0;
      return;
    }

    const newVideos = [...videos];
    const [moved] = newVideos.splice(dragIndex, 1);
    newVideos.splice(dropIndex, 0, moved);

    // 更新所有 sort_order
    const reordered = newVideos.map((v, i) => ({
      ...v,
      sort_order: i + 1,
    }));

    setVideos(reordered);
    setHasUnsavedChanges(true);
    setDragIndex(null);
    setDragOverIndex(null);
    dragCounter.current = 0;
  };

  const handleDragEnd = () => {
    setDragIndex(null);
    setDragOverIndex(null);
    dragCounter.current = 0;
  };

  // ===== 直接編輯排序編號 =====
  const handleSortOrderChange = (videoId: number, newOrder: number) => {
    setVideos((prev) =>
      prev.map((v) =>
        v.video_id === videoId ? { ...v, sort_order: newOrder } : v,
      ),
    );
    setHasUnsavedChanges(true);
  };

  // ===== 上移/下移 =====
  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    const newVideos = [...videos];
    [newVideos[index - 1], newVideos[index]] = [
      newVideos[index],
      newVideos[index - 1],
    ];
    const reordered = newVideos.map((v, i) => ({ ...v, sort_order: i + 1 }));
    setVideos(reordered);
    setHasUnsavedChanges(true);
  };

  const handleMoveDown = (index: number) => {
    if (index >= videos.length - 1) return;
    const newVideos = [...videos];
    [newVideos[index], newVideos[index + 1]] = [
      newVideos[index + 1],
      newVideos[index],
    ];
    const reordered = newVideos.map((v, i) => ({ ...v, sort_order: i + 1 }));
    setVideos(reordered);
    setHasUnsavedChanges(true);
  };

  // ===== 儲存排序 =====
  const handleSaveOrder = async () => {
    try {
      setSaving(true);
      const orders = videos.map((v, i) => ({
        id: v.video_id,
        sortOrder: i + 1,
      }));
      await videoService.reorder(orders);
      logger.info("影片排序已儲存", { count: orders.length });
      setHasUnsavedChanges(false);
      await dialog.confirm({
        title: "儲存成功",
        message: "影片排序已更新，前台將顯示新的順序。",
        confirmText: "確定",
      });
    } catch (err) {
      logger.error("儲存排序失敗", err);
      setError("儲存排序失敗");
    } finally {
      setSaving(false);
    }
  };

  // ===== 切換可見 =====
  const handleToggleVisible = async (video: AdminVideo) => {
    try {
      const newVisible = !video.is_visible;
      await put(`/api/videos/${video.video_id}`, { isVisible: newVisible });
      setVideos((prev) =>
        prev.map((v) =>
          v.video_id === video.video_id ? { ...v, is_visible: newVisible } : v,
        ),
      );
      logger.info("影片可見性切換", {
        id: video.video_id,
        visible: newVisible,
      });
    } catch (err) {
      logger.error("切換影片可見性失敗", err);
      setError("切換影片可見性失敗");
    }
  };

  // ===== 批量新增影片 Modal =====
  useScrollLock(showAddModal);

  const detectPlatform = (url: string): string => {
    if (/instagram\.com/i.test(url)) return "instagram";
    if (/youtu\.be|youtube\.com/i.test(url)) return "youtube";
    if (/facebook\.com|fb\.watch/i.test(url)) return "facebook";
    if (/tiktok\.com/i.test(url)) return "tiktok";
    return "other";
  };

  const updateRow = (id: number, patch: Partial<AddRow>) =>
    setAddRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));

  const handleRowUrlChange = (id: number, url: string) => {
    updateRow(id, { url, type: detectPlatform(url), fetchState: "idle", fetchError: "" });
  };

  const addNewRow = () => {
    const id = nextIdRef.current++;
    setAddRows((prev) => [...prev, newRow(id)]);
  };

  const removeRow = (id: number) => {
    setAddRows((prev) => prev.filter((r) => r.id !== id));
  };

  /** 判斷是否為可自動擷取的平台 */
  const canAutoFetch = (url: string) => {
    if (/youtu\.be|youtube\.com|facebook\.com|fb\.watch/i.test(url)) return true;
    if (/instagram\.com/i.test(url) && igSession) return true; // 有 session 才可自動
    return false;
  };

  /** 對單一列擷取截圖 */
  const fetchThumbnailForRow = async (row: AddRow) => {
    if (!row.url.trim()) return;

    const isIG = /instagram\.com/i.test(row.url);

    // IG 且無 session → 提示設定
    if (isIG && !igSession) {
      updateRow(row.id, {
        fetchState: "error",
        fetchError: "需要設定 IG Session 才能自動擷取",
      });
      setShowIgSessionPanel(true);
      return;
    }

    // TikTok → 只能手動
    if (/tiktok\.com/i.test(row.url)) {
      updateRow(row.id, {
        fetchState: "error",
        fetchError: "TikTok 無法自動擷取，請手動截圖後上傳",
      });
      return;
    }

    updateRow(row.id, { fetchState: "fetching", fetchError: "" });
    try {
      const res = await post<{ base64?: string; imageUrl?: string }>("/api/videos/fetch-thumbnail", {
        url: row.url.trim(),
        ...(isIG && igSession ? { igSession } : {}),
      });
      // base64 優先，CDN 限制時 fallback 為直接 URL
      const thumbnail = res.base64 ?? res.imageUrl ?? "";
      updateRow(row.id, { fetchState: "done", thumbnail });
    } catch (err: unknown) {
      const msg = (err as { message?: string })?.message ?? "";
      const isSessionErr = msg.includes("session") || msg.includes("登入") || msg.includes("401");
      if (isSessionErr && isIG) {
        // session 已過期
        clearIgSession();
        updateRow(row.id, { fetchState: "error", fetchError: "IG Session 已過期，請重新設定" });
        setShowIgSessionPanel(true);
      } else {
        updateRow(row.id, { fetchState: "error", fetchError: msg || "擷取失敗，請手動上傳截圖" });
      }
    }
  };

  /** 批量擷取 */
  const fetchAllThumbnails = async () => {
    const autoRows = addRows.filter((r) => r.url.trim() && canAutoFetch(r.url) && !r.thumbnail);
    const igNoSession = addRows.filter((r) => r.url.trim() && /instagram\.com/i.test(r.url) && !igSession && !r.thumbnail);
    const tiktokRows = addRows.filter((r) => r.url.trim() && /tiktok\.com/i.test(r.url) && !r.thumbnail);
    const manualRows = [...igNoSession, ...tiktokRows];

    if (autoRows.length === 0 && igNoSession.length > 0) {
      const ok = await dialog.confirm({
        title: "需要 IG Session",
        message: `有 ${igNoSession.length} 部 IG 影片需要 Session 才能自動擷取。\n\n是否現在設定？`,
        confirmText: "設定 Session",
        cancelText: "跳過",
      });
      if (ok) setShowIgSessionPanel(true);
      return;
    }
    if (autoRows.length === 0) return;

    const fbCount = autoRows.filter((r) => /facebook\.com|fb\.watch/i.test(r.url)).length;
    const igCount = autoRows.filter((r) => /instagram\.com/i.test(r.url)).length;
    const ok = await dialog.confirm({
      title: "批量擷取截圖",
      message:
        `將為 ${autoRows.length} 部影片自動擷取縮圖` +
        (igCount > 0 ? `（含 ${igCount} 部 IG）` : "") +
        (fbCount > 0 ? `（含 ${fbCount} 部 Facebook）` : "") +
        "。" +
        (manualRows.length > 0 ? `\n\n${tiktokRows.length > 0 ? "TikTok 影片" : ""}需手動上傳截圖。` : ""),
      confirmText: "開始擷取",
      cancelText: "取消",
    });
    if (!ok) return;

    for (const row of tiktokRows) {
      updateRow(row.id, { fetchState: "error", fetchError: "TikTok 請手動截圖後上傳" });
    }
    for (const row of autoRows) {
      await fetchThumbnailForRow(row);
    }
  };

  /** 本機上傳截圖給特定列 */
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    const rowId = fileRowRef.current;
    if (!file || rowId < 0) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      updateRow(rowId, { thumbnail: (ev.target?.result as string) ?? "", fetchState: "done", fetchError: "" });
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const openFilePicker = (rowId: number) => {
    fileRowRef.current = rowId;
    fileInputRef.current?.click();
  };

  /** 關閉 modal 並重置 */
  const closeAddModal = () => {
    setShowAddModal(false);
    setAddRows([newRow(0)]);
    nextIdRef.current = 1;
  };

  /** 提交批量新增 */
  const handleBatchSubmit = async () => {
    const valid = addRows.filter((r) => r.url.trim() && r.title.trim());
    if (valid.length === 0) return;
    setAddSubmitting(true);
    try {
      const payload = valid.map((r) => ({
        title: r.title.trim(),
        url: r.url.trim(),
        type: r.type,
        description: r.description.trim() || undefined,
        thumbnail: r.thumbnail || undefined,
      }));
      const res = await post<{ inserted: number; data: AdminVideo[] }>("/api/videos/batch", { videos: payload });
      setVideos((prev) => [...prev, ...res.data]);
      closeAddModal();
    } catch {
      dialog.alert({ title: "新增失敗", message: "批量新增失敗，請稍後再試。" });
    } finally {
      setAddSubmitting(false);
    }
  };

  // ===== 檢視模式選項 =====
  const viewOptions: { mode: ViewMode; icon: string; label: string }[] = [
    { mode: "list", icon: "☰", label: "清單" },
    { mode: "card-sm", icon: "▪▪▪", label: "小圖" },
    { mode: "card-md", icon: "◻◻", label: "中圖" },
    { mode: "card-lg", icon: "⬜", label: "大圖" },
  ];

  // ===== 列表檢視 =====
  const renderListView = () => (
    <div className="space-y-1 overflow-x-auto">
      {/* 表頭 */}
      <div className="grid grid-cols-[40px_40px_1fr_100px_80px_100px] gap-2 px-4 py-2 text-xs text-luxe-muted border-b border-luxe-gold/10 min-w-130">
        <span></span>
        <span>順序</span>
        <span>影片標題</span>
        <span>分類</span>
        <span>可見</span>
        <span>操作</span>
      </div>

      {filteredVideos.map((video, index) => (
        <div
          key={video.video_id}
          draggable={!searchTerm}
          onDragStart={() => handleDragStart(index)}
          onDragEnter={() => handleDragEnter(index)}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={() => handleDrop(index)}
          onDragEnd={handleDragEnd}
          className={`grid grid-cols-[40px_40px_1fr_100px_80px_100px] gap-2 px-4 py-3 rounded-lg items-center transition-all min-w-130 ${
            dragIndex === index
              ? "opacity-40 scale-95"
              : dragOverIndex === index
                ? "bg-luxe-gold/10 border-t-2 border-luxe-gold/50"
                : "hover:bg-luxe-surface"
          } ${!video.is_visible ? "opacity-50" : ""}`}
        >
          {/* 拖曳手柄 */}
          <span className="cursor-grab active:cursor-grabbing text-luxe-muted hover:text-luxe-gold text-lg select-none">
            ⠿
          </span>

          {/* 排序編號 */}
          <input
            type="number"
            value={video.sort_order}
            onChange={(e) =>
              handleSortOrderChange(video.video_id, Number(e.target.value))
            }
            className="w-10 bg-transparent border border-luxe-gold/10 rounded px-1 py-0.5 text-xs text-luxe-text text-center focus:border-luxe-gold/50 focus:outline-none"
            min={1}
          />

          {/* 標題 */}
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-sm shrink-0">
              {getPlatformIcon(video.type)}
            </span>
            <span className="text-sm text-luxe-text truncate">
              {video.title}
            </span>
          </div>

          {/* 分類 */}
          <span className="text-xs text-luxe-muted">{video.type}</span>

          {/* 可見性 */}
          <button
            onClick={() => handleToggleVisible(video)}
            className={`text-xs px-2 py-1 rounded transition-all ${
              video.is_visible
                ? "bg-green-900/30 text-green-400 hover:bg-green-900/50"
                : "bg-red-900/30 text-red-400 hover:bg-red-900/50"
            }`}
          >
            {video.is_visible ? "👁 顯示" : "🚫 隱藏"}
          </button>

          {/* 操作 */}
          <div className="flex gap-1">
            <button
              onClick={() => handleMoveUp(index)}
              disabled={index === 0}
              className="text-luxe-muted hover:text-luxe-gold disabled:opacity-20 text-sm px-1"
              title="上移"
            >
              ▲
            </button>
            <button
              onClick={() => handleMoveDown(index)}
              disabled={index >= videos.length - 1}
              className="text-luxe-muted hover:text-luxe-gold disabled:opacity-20 text-sm px-1"
              title="下移"
            >
              ▼
            </button>
          </div>
        </div>
      ))}
    </div>
  );

  // ===== 卡片檢視 =====
  const renderCardView = () => {
    const gridClass =
      viewMode === "card-sm"
        ? "grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6"
        : viewMode === "card-md"
          ? "grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5"
          : "grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4";

    return (
      <div className={`grid ${gridClass} gap-3`}>
        {filteredVideos.map((video, index) => {
          const thumb = getVideoThumbnail(video);
          return (
            <div
              key={video.video_id}
              draggable={!searchTerm}
              onDragStart={() => handleDragStart(index)}
              onDragEnter={() => handleDragEnter(index)}
              onDragLeave={handleDragLeave}
              onDragOver={handleDragOver}
              onDrop={() => handleDrop(index)}
              onDragEnd={handleDragEnd}
              className={`group bg-luxe-surface rounded-lg border overflow-hidden cursor-grab active:cursor-grabbing transition-all ${
                dragIndex === index
                  ? "opacity-40 scale-95"
                  : dragOverIndex === index
                    ? "border-luxe-gold/50 shadow-lg shadow-luxe-gold/10"
                    : "border-luxe-gold/10 hover:border-luxe-gold/30"
              } ${!video.is_visible ? "opacity-50" : ""}`}
            >
              {/* 縮圖 */}
              <div className="aspect-video bg-luxe-bg flex items-center justify-center relative">
                {thumb ? (
                  <img
                    src={thumb}
                    alt={video.title}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <span className="text-3xl">
                    {getPlatformIcon(video.type)}
                  </span>
                )}
                {/* 排序編號浮標 */}
                <span className="absolute top-1 left-1 bg-black/60 text-white text-xs px-1.5 py-0.5 rounded">
                  #{video.sort_order}
                </span>
                {/* 可見性浮標 */}
                {!video.is_visible && (
                  <span className="absolute top-1 right-1 bg-red-500/80 text-white text-xs px-1.5 py-0.5 rounded">
                    隱藏
                  </span>
                )}
              </div>

              {/* 資訊 */}
              <div className="p-2">
                <p className="text-xs text-luxe-text truncate mb-1">
                  {video.title}
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-luxe-muted">
                    {video.type}
                  </span>
                  <div className="flex gap-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleMoveUp(index);
                      }}
                      className="text-luxe-muted hover:text-luxe-gold text-xs"
                    >
                      ▲
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleMoveDown(index);
                      }}
                      className="text-luxe-muted hover:text-luxe-gold text-xs"
                    >
                      ▼
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleVisible(video);
                      }}
                      className="text-luxe-muted hover:text-luxe-gold text-xs"
                    >
                      {video.is_visible ? "👁" : "🚫"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div>
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-light text-luxe-text">
            影片管理
          </h1>
          <p className="text-sm sm:text-base text-luxe-muted">
            拖曳調整影片在前台的顯示順序
          </p>
        </div>

        {/* 右側按鈕群 */}
        <div className="flex gap-2">
          <PillButton
            theme="luxe"
            variant="outline"
            onClick={() => setShowAddModal(true)}
          >
            ＋ 新增影片
          </PillButton>
          {hasUnsavedChanges && (
            <PillButton
              theme="luxe"
              variant="filled"
              onClick={handleSaveOrder}
              disabled={saving}
              className="animate-pulse"
            >
              {saving ? "儲存中..." : "💾 儲存排序"}
            </PillButton>
          )}
        </div>
      </div>

      {/* 搜尋 + 檢視切換 */}
      <div className="flex flex-col sm:flex-row flex-wrap gap-3 mb-6">
        <Input
          placeholder="搜尋影片..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          theme="luxe"
          className="flex-1 sm:max-w-sm"
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

        {/* 檢視模式切換 */}
        <div className="flex gap-1 bg-luxe-surface rounded-lg p-1 border border-luxe-gold/10">
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

      {/* 未儲存提示 */}
      {hasUnsavedChanges && (
        <div className="mb-4 p-3 bg-yellow-900/20 border border-yellow-500/30 rounded-lg text-yellow-400 text-sm flex items-center gap-2">
          ⚠️ 排序已變更，請記得點擊「儲存排序」按鈕
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="mb-4 p-4 bg-red-900/20 border border-red-500/30 rounded-lg text-red-400">
          {error}
          <button
            className="ml-2 text-red-300 hover:text-red-100"
            onClick={() => setError("")}
          >
            ✕
          </button>
        </div>
      )}

      {/* 載入中 */}
      {loading ? (
        <div className="text-center py-12 text-luxe-muted">載入中...</div>
      ) : filteredVideos.length === 0 ? (
        <div className="text-center py-12 text-luxe-muted">
          {searchTerm ? "沒有符合的影片" : "尚無影片"}
        </div>
      ) : (
        <>
          {/* 統計 */}
          <div className="mb-3 text-xs text-luxe-muted">
            共 {videos.length} 部影片
            {searchTerm && `（篩選結果：${filteredVideos.length} 部）`}
          </div>

          {/* 內容 */}
          {viewMode === "list" ? renderListView() : renderCardView()}
        </>
      )}

      {/* 隱藏 file input（批量各列共用，由 fileRowRef 記錄目標列） */}
      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />

      {/* ═══════════════════════════════════════════════════════
          批量新增影片 Modal
      ═══════════════════════════════════════════════════════ */}
      {showAddModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          onClick={(e) => { if (e.target === e.currentTarget) closeAddModal(); }}
        >
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

          <div className="relative z-10 w-full max-w-3xl bg-luxe-surface border border-luxe-gold/20 rounded-xl shadow-2xl flex flex-col max-h-[90vh]">

            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-luxe-gold/10 shrink-0">
              <div>
                <h2 className="text-base font-medium text-luxe-text">批量新增影片</h2>
                <p className="text-xs text-luxe-muted mt-0.5">可一次新增多部影片，依序填入後批量送出</p>
              </div>
              <button onClick={closeAddModal} className="text-luxe-muted hover:text-luxe-text text-lg leading-none">✕</button>
            </div>

            {/* 批量擷取截圖按鈕列 */}
            <div className="flex flex-wrap items-center gap-3 px-6 py-3 border-b border-luxe-gold/10 bg-luxe-bg/30 shrink-0">
              <button
                type="button"
                onClick={fetchAllThumbnails}
                disabled={addRows.every((r) => !r.url.trim() || r.fetchState === "fetching")}
                className="text-xs py-1.5 px-4 rounded-lg border border-luxe-gold/30 text-luxe-gold hover:bg-luxe-gold/10 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                🔍 批量擷取所有截圖
              </button>

              {/* IG Session 狀態列 */}
              <div className="flex items-center gap-2 ml-auto">
                {/* 狀態指示 */}
                {igSession ? (
                  <span className="flex items-center gap-1.5 text-[10px] text-emerald-400">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
                    IG Session 已設定
                    <button
                      onClick={clearIgSession}
                      title="清除 Session"
                      className="text-luxe-muted/50 hover:text-red-400 ml-0.5 transition-colors"
                    >✕</button>
                  </span>
                ) : (
                  <span className="text-[10px] text-luxe-muted/40">📸 IG 截圖需設定 Session</span>
                )}

                {/* 設定按鈕 */}
                <button
                  type="button"
                  onClick={() => { setIgSessionInput(igSession); setShowIgSessionPanel((v) => !v); }}
                  className={`text-[10px] py-1 px-2.5 rounded-md border transition-all ${
                    showIgSessionPanel
                      ? "bg-luxe-gold/15 border-luxe-gold/40 text-luxe-gold"
                      : "border-luxe-gold/20 text-luxe-muted hover:text-luxe-gold hover:border-luxe-gold/40"
                  }`}
                >
                  {igSession ? "更新 Session" : "設定 Session"}
                </button>

                {/* ? 說明 icon */}
                <div className="relative group">
                  <button
                    type="button"
                    className="w-5 h-5 rounded-full border border-luxe-gold/25 text-luxe-muted/60 hover:text-luxe-gold hover:border-luxe-gold/50 text-[10px] font-bold leading-none flex items-center justify-center transition-all"
                    tabIndex={-1}
                  >
                    ?
                  </button>
                  {/* Tooltip */}
                  <div className="absolute right-0 top-7 w-64 bg-luxe-bg border border-luxe-gold/20 rounded-xl shadow-xl p-4 z-20 hidden group-hover:block group-focus-within:block">
                    <p className="text-[10px] font-semibold text-luxe-gold mb-3">如何取得 IG sessionid？</p>
                    <ol className="space-y-2">
                      {[
                        { n: "1", text: "用此瀏覽器開啟 Instagram 並登入" },
                        { n: "2", text: <>按 <kbd className="bg-luxe-surface border border-luxe-gold/20 rounded px-1 text-[9px]">F12</kbd> 開啟開發者工具</> },
                        { n: "3", text: <>點上方 <span className="text-luxe-gold font-medium">Application</span> 分頁</> },
                        { n: "4", text: <>左側展開 <span className="text-luxe-gold font-medium">Cookies</span> → 點 <span className="font-mono text-[9px] bg-luxe-surface px-1 rounded">instagram.com</span></> },
                        { n: "5", text: <>找到 <span className="font-mono text-[9px] bg-luxe-surface px-1 rounded text-luxe-gold">sessionid</span>，複製右側 <span className="font-medium">Value</span> 欄位的值</> },
                        { n: "6", text: "貼到左邊輸入框並儲存" },
                      ].map((step) => (
                        <li key={step.n} className="flex gap-2 text-[10px] text-luxe-muted leading-relaxed">
                          <span className="shrink-0 w-4 h-4 rounded-full bg-luxe-gold/20 text-luxe-gold text-[9px] flex items-center justify-center font-bold">{step.n}</span>
                          <span>{step.text}</span>
                        </li>
                      ))}
                    </ol>
                    <p className="text-[9px] text-luxe-muted/40 mt-3 pt-2 border-t border-luxe-gold/10">
                      Session 僅存於此瀏覽器，不會傳至伺服器
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* IG Session 輸入 Panel（展開式） */}
            {showIgSessionPanel && (
              <div className="px-6 py-4 bg-luxe-bg/60 border-b border-luxe-gold/10 shrink-0">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xs font-medium text-luxe-text">📸 Instagram Session</span>
                  <span className="text-[9px] text-luxe-muted/50 ml-auto">僅存於此瀏覽器 · 不傳至伺服器</span>
                </div>
                <div className="flex gap-2">
                  <input
                    type="password"
                    value={igSessionInput}
                    onChange={(e) => setIgSessionInput(e.target.value)}
                    placeholder="貼上 sessionid 值（F12 → Application → Cookies → instagram.com → sessionid）"
                    className="flex-1 bg-luxe-surface border border-luxe-gold/20 rounded-lg px-3 py-2 text-xs text-luxe-text placeholder:text-luxe-muted/30 focus:outline-none focus:border-luxe-gold/50 font-mono"
                    onKeyDown={(e) => { if (e.key === "Enter") saveIgSession(); }}
                    autoFocus
                  />
                  <button
                    onClick={saveIgSession}
                    disabled={!igSessionInput.trim()}
                    className="px-4 py-2 text-xs bg-luxe-gold/20 text-luxe-gold border border-luxe-gold/30 rounded-lg hover:bg-luxe-gold/30 disabled:opacity-40 disabled:cursor-not-allowed transition-all whitespace-nowrap"
                  >
                    儲存
                  </button>
                  <button
                    onClick={() => setShowIgSessionPanel(false)}
                    className="px-3 py-2 text-xs text-luxe-muted border border-luxe-gold/10 rounded-lg hover:text-luxe-text transition-colors"
                  >
                    取消
                  </button>
                </div>
              </div>
            )}

            {/* 影片列清單 */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
              {addRows.map((row, idx) => (
                <div key={row.id} className="bg-luxe-bg/50 border border-luxe-gold/10 rounded-xl p-4">
                  {/* 列標題 */}
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs text-luxe-muted font-medium">影片 {idx + 1}</span>
                    {addRows.length > 1 && (
                      <button onClick={() => removeRow(row.id)} className="text-xs text-red-400/70 hover:text-red-400">✕ 移除</button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* 左欄：文字欄位 */}
                    <div className="space-y-2.5">
                      {/* URL */}
                      <div>
                        <label className="text-[10px] text-luxe-muted block mb-1">連結 *</label>
                        <Input
                          value={row.url}
                          onChange={(e) => handleRowUrlChange(row.id, e.target.value)}
                          placeholder="https://www.instagram.com/p/..."
                          theme="luxe"
                          className="w-full text-sm"
                        />
                        {row.url && (
                          <p className="text-[9px] text-luxe-muted/60 mt-0.5">
                            {row.type === "instagram" ? "📸 IG"
                              : row.type === "youtube" ? "🎬 YouTube"
                              : row.type === "facebook" ? "📘 Facebook"
                              : row.type === "tiktok" ? "🎵 TikTok"
                              : "🎞️ 其他"}
                          </p>
                        )}
                      </div>

                      {/* 標題 */}
                      <div>
                        <label className="text-[10px] text-luxe-muted block mb-1">標題 *</label>
                        <Input
                          value={row.title}
                          onChange={(e) => updateRow(row.id, { title: e.target.value })}
                          placeholder="影片標題"
                          theme="luxe"
                          className="w-full text-sm"
                        />
                      </div>

                      {/* 說明 */}
                      <div>
                        <label className="text-[10px] text-luxe-muted block mb-1">說明（選填）</label>
                        <textarea
                          value={row.description}
                          onChange={(e) => updateRow(row.id, { description: e.target.value })}
                          placeholder="影片說明"
                          rows={2}
                          className="w-full bg-luxe-surface border border-luxe-gold/20 rounded-lg px-3 py-2 text-xs text-luxe-text placeholder:text-luxe-muted/40 focus:outline-none focus:border-luxe-gold/50 resize-none"
                        />
                      </div>
                    </div>

                    {/* 右欄：截圖 */}
                    <div className="flex flex-col gap-2">
                      <label className="text-[10px] text-luxe-muted">截圖</label>

                      {/* 預覽 */}
                      <div className="relative aspect-video rounded-lg overflow-hidden bg-luxe-bg border border-luxe-gold/10 flex items-center justify-center">
                        {row.thumbnail ? (
                          <>
                            <img src={row.thumbnail} alt="" className="w-full h-full object-cover" />
                            <button
                              onClick={() => updateRow(row.id, { thumbnail: "", fetchState: "idle" })}
                              className="absolute top-1 right-1 bg-black/70 text-white text-[10px] px-1.5 py-0.5 rounded hover:bg-black/90"
                            >移除</button>
                          </>
                        ) : row.fetchState === "fetching" ? (
                          <span className="text-xs text-luxe-muted animate-pulse">擷取中...</span>
                        ) : (
                          <span className="text-luxe-muted/30 text-xs">無截圖</span>
                        )}

                        {/* 狀態 badge */}
                        {row.fetchState === "done" && row.thumbnail && (
                          <span className="absolute bottom-1 left-1 bg-emerald-500/80 text-white text-[9px] px-1.5 py-0.5 rounded">✓ 已擷取</span>
                        )}
                        {row.fetchState === "error" && (
                          <span className="absolute bottom-1 left-1 bg-red-500/80 text-white text-[9px] px-1.5 py-0.5 rounded">擷取失敗</span>
                        )}
                      </div>

                      {row.fetchError && (
                        <p className="text-[9px] text-red-400">{row.fetchError}</p>
                      )}

                      {/* 操作按鈕 */}
                      <div className="flex gap-1.5">
                        {canAutoFetch(row.url) ? (
                          <button
                            type="button"
                            onClick={() => fetchThumbnailForRow(row)}
                            disabled={!row.url.trim() || row.fetchState === "fetching"}
                            className="flex-1 text-[10px] py-1.5 rounded-lg border border-luxe-gold/25 text-luxe-gold hover:bg-luxe-gold/10 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                          >
                            {row.fetchState === "fetching" ? "擷取中..." : "🔍 自動擷取"}
                          </button>
                        ) : (
                          <span className="flex-1 text-[10px] py-1.5 text-center rounded-lg border border-luxe-gold/10 text-luxe-muted/40">
                            {row.url.trim() ? "IG/TikTok 請手動上傳" : "輸入連結後可擷取"}
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={() => openFilePicker(row.id)}
                          className="flex-1 text-[10px] py-1.5 rounded-lg border border-luxe-gold/15 text-luxe-muted hover:text-luxe-text transition-all"
                        >
                          📁 上傳
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {/* 加一列 */}
              <button
                type="button"
                onClick={addNewRow}
                className="w-full py-3 border border-dashed border-luxe-gold/20 rounded-xl text-xs text-luxe-muted/60 hover:border-luxe-gold/40 hover:text-luxe-muted transition-all"
              >
                ＋ 再加一部影片
              </button>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between gap-3 px-6 py-4 border-t border-luxe-gold/10 shrink-0">
              <p className="text-xs text-luxe-muted">
                {addRows.filter((r) => r.url.trim() && r.title.trim()).length} / {addRows.length} 筆可送出
              </p>
              <div className="flex gap-3">
                <button
                  onClick={closeAddModal}
                  className="py-2 px-5 text-sm text-luxe-muted hover:text-luxe-text border border-luxe-gold/15 rounded-lg transition-colors"
                >
                  取消
                </button>
                <PillButton
                  theme="luxe"
                  variant="filled"
                  onClick={handleBatchSubmit}
                  disabled={addRows.every((r) => !r.url.trim() || !r.title.trim()) || addSubmitting}
                >
                  {addSubmitting ? "新增中..." : `新增 ${addRows.filter((r) => r.url.trim() && r.title.trim()).length} 部影片`}
                </PillButton>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminVideos;
