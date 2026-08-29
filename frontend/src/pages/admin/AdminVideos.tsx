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
import { PillButton, Input, useDialog, ImageInput } from "@/components/ui";
import { get, post, put } from "@/services/api";
import { videoService } from "@/services/content/video.service";
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

/** 取得影片縮圖 URL：優先用 DB 存的 thumbnail_url，YouTube fallback 用公開縮圖 */
const getVideoThumbnail = (video: AdminVideo): string => {
  if (video.thumbnail_url) return video.thumbnail_url;
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

  // ── 批量新增影片 Modal 狀態 ──
  const [showAddModal, setShowAddModal] = useState(false);
  const [addSubmitting, setAddSubmitting] = useState(false);

  type AddRow = {
    id: number;
    url: string;
    title: string;
    description: string;
    type: string;
    thumbnailUrl: string;   // 縮圖的 Storage public URL（也是預覽來源）
    uploading: boolean;     // 縮圖上傳中（送出前用來擋住未完成的上傳）
  };

  const newRow = (id: number): AddRow => ({
    id, url: "", title: "", description: "", type: "instagram",
    thumbnailUrl: "", uploading: false,
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
    updateRow(id, { url, type: detectPlatform(url) });
  };

  const addNewRow = () => {
    const id = nextIdRef.current++;
    setAddRows((prev) => [...prev, newRow(id)]);
  };

  const removeRow = (id: number) => {
    setAddRows((prev) => prev.filter((r) => r.id !== id));
  };

  /**
   * 上傳截圖給特定列。
   * 影片縮圖沿用既有的 temp→finalize 機制（`/api/videos/upload-thumbnail`，
   * base64 進、thumbnails bucket 出），所以不走統一的 /api/uploads；
   * UI 則交給 ImageInput，與其他上傳點一致。
   */
  const uploadRowThumbnail = (rowId: number) => (file: File): Promise<string> =>
    new Promise<string>((resolve, reject) => {
      updateRow(rowId, { uploading: true });
      const reader = new FileReader();
      reader.onerror = () => {
        updateRow(rowId, { uploading: false });
        reject(new Error("讀取檔案失敗，請重新選擇。"));
      };
      reader.onload = async (ev) => {
        const dataUrl = (ev.target?.result as string) ?? "";
        try {
          const { url } = await post<{ url: string }>(
            "/api/videos/upload-thumbnail",
            { image: dataUrl },
          );
          updateRow(rowId, { uploading: false });
          resolve(url);
        } catch (err) {
          logger.error("上傳縮圖失敗", err);
          updateRow(rowId, { uploading: false });
          reject(new Error("上傳失敗，請重試。"));
        }
      };
      reader.readAsDataURL(file);
    });

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

    // 若有縮圖仍在上傳，提示使用者等待
    if (valid.some((r) => r.uploading)) {
      dialog.alert({ title: "請稍候", message: "有縮圖仍在上傳中，請等候上傳完成。" });
      return;
    }

    setAddSubmitting(true);
    try {
      const payload = valid.map((r) => ({
        title: r.title.trim(),
        url: r.url.trim(),
        type: r.type,
        description: r.description.trim() || undefined,
        thumbnail: r.thumbnailUrl || undefined,
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
                    <ImageInput
                      label="截圖（選填）"
                      value={row.thumbnailUrl}
                      onChange={(url) => updateRow(row.id, { thumbnailUrl: url })}
                      aspectHint="16 / 9"
                      compact
                      uploadFn={uploadRowThumbnail(row.id)}
                    />
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
