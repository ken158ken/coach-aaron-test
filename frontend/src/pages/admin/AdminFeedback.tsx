/**
 * AdminFeedback — 意見反饋後台（教練視角）
 * @module pages/admin/AdminFeedback
 * @theme luxe
 *
 * 依 ERP feedback 模組：狀態統計籤（計數＋篩選）＋搜尋＋大/中/小顯示切換＋卡片牆，
 * 詳情含可編輯標題、狀態一鍵切換 chip、刪整串、對話氣泡、教練回覆輸入列（附圖／貼上）。
 */

import React, { useCallback, useEffect, useState } from "react";
import { format } from "date-fns";
import { enUS, zhTW } from "date-fns/locale";
import { useLanguage } from "@/context/LanguageContext";
import { useDialog } from "@/components/ui";
import {
  feedbackService,
  FEEDBACK_STATUSES,
  type FeedbackThreadSummary,
  type FeedbackThreadDetail,
  type FeedbackStatus,
  type FeedbackStats,
} from "@/services/feedback/feedback.service";
import AttachmentPicker from "@/components/feedback/AttachmentPicker";
import FeedbackConversation from "@/components/feedback/FeedbackConversation";
import { FeedbackImageThumb, FeedbackLightbox } from "@/components/feedback/FeedbackImage";

/** 狀態徽章樣式（luxe）*/
const STATUS_STYLE: Record<FeedbackStatus, string> = {
  waiting_coach: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  waiting_member: "bg-luxe-gold/15 text-luxe-gold border-luxe-gold/30",
  in_progress: "bg-sky-500/15 text-sky-400 border-sky-500/30",
  resolved: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
};

type SizeMode = "large" | "medium" | "small";
const SIZE_KEY = "admin_feedback_size";

const AdminFeedback: React.FC = () => {
  const { t, isZhTW } = useLanguage();
  const fp = t.adminFeedbackPage;
  const dialog = useDialog();
  const dfLocale = isZhTW ? zhTW : enUS;

  const [threads, setThreads] = useState<FeedbackThreadSummary[]>([]);
  const [stats, setStats] = useState<FeedbackStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<FeedbackStatus | "">("");
  const [size, setSize] = useState<SizeMode>("medium");

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<FeedbackThreadDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // 標題編輯
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState("");

  // 回覆
  const [replyText, setReplyText] = useState("");
  const [replyFiles, setReplyFiles] = useState<File[]>([]);
  const [replying, setReplying] = useState(false);

  const [lightbox, setLightbox] = useState<{ id: string; name?: string } | null>(null);

  // 讀取顯示尺寸偏好
  useEffect(() => {
    try {
      const saved = localStorage.getItem(SIZE_KEY) as SizeMode | null;
      if (saved === "large" || saved === "medium" || saved === "small") setSize(saved);
    } catch {
      /* ignore */
    }
  }, []);
  const changeSize = (s: SizeMode) => {
    setSize(s);
    try {
      localStorage.setItem(SIZE_KEY, s);
    } catch {
      /* ignore */
    }
  };

  const formatTime = useCallback(
    (iso: string): string => {
      const d = new Date(iso);
      const diff = Date.now() - d.getTime();
      const min = Math.floor(diff / 60000);
      if (min < 1) return t.dateTime.justNow;
      if (min < 60) return t.dateTime.minutesAgo.replace("{n}", String(min));
      const hr = Math.floor(min / 60);
      if (hr < 24) return t.dateTime.hoursAgo.replace("{n}", String(hr));
      const day = Math.floor(hr / 24);
      if (day < 7) return t.dateTime.daysAgo.replace("{n}", String(day));
      return format(d, "yyyy/MM/dd HH:mm", { locale: dfLocale });
    },
    [t, dfLocale],
  );

  const fetchStats = useCallback(async () => {
    try {
      setStats(await feedbackService.stats());
    } catch {
      /* 統計失敗不阻擋列表 */
    }
  }, []);

  const fetchList = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const data = await feedbackService.listAdmin({
        search,
        status: statusFilter,
        limit: 50,
      });
      setThreads(data.threads);
    } catch (err) {
      console.error(err);
      setError(fp.loadFailed);
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, fp.loadFailed]);

  useEffect(() => {
    const timer = setTimeout(fetchList, search ? 300 : 0);
    return () => clearTimeout(timer);
  }, [fetchList, search]);

  useEffect(() => {
    void fetchStats();
  }, [fetchStats]);

  const openThread = useCallback(
    async (id: string) => {
      setSelectedId(id);
      setDetail(null);
      setEditingTitle(false);
      setReplyText("");
      setReplyFiles([]);
      try {
        setDetailLoading(true);
        setDetail(await feedbackService.detailAdmin(id));
      } catch (err) {
        console.error(err);
        setError(fp.loadFailed);
        setSelectedId(null);
      } finally {
        setDetailLoading(false);
      }
    },
    [fp.loadFailed],
  );

  const backToList = () => {
    setSelectedId(null);
    setDetail(null);
    void fetchList();
    void fetchStats();
  };

  const refreshDetail = async () => {
    if (selectedId) setDetail(await feedbackService.detailAdmin(selectedId));
    void fetchStats();
  };

  const handleSetStatus = async (status: FeedbackStatus) => {
    if (!selectedId || !detail) return;
    if (detail.status === status) return;
    try {
      await feedbackService.setStatus(selectedId, status);
      await refreshDetail();
    } catch (err) {
      console.error(err);
      await dialog.alert({ title: fp.errors.statusFailed, message: "" });
    }
  };

  const handleSaveTitle = async () => {
    if (!selectedId || !titleDraft.trim()) return;
    try {
      await feedbackService.setTitle(selectedId, titleDraft.trim());
      setEditingTitle(false);
      await refreshDetail();
    } catch (err) {
      console.error(err);
      await dialog.alert({ title: fp.errors.titleFailed, message: "" });
    }
  };

  const handleDeleteThread = async () => {
    if (!selectedId || !detail) return;
    const confirmed = await dialog.confirm({
      title: fp.deleteThreadTitle,
      message: fp.deleteThreadMessage.replace("{title}", detail.title),
      variant: "danger",
      confirmText: fp.detail.deleteThread,
    });
    if (!confirmed) return;
    try {
      await feedbackService.removeThread(selectedId);
      backToList();
    } catch (err) {
      console.error(err);
      await dialog.alert({ title: fp.errors.deleteFailed, message: "" });
    }
  };

  const handleReply = async () => {
    if (!selectedId) return;
    if (!replyText.trim() && replyFiles.length === 0) return;
    try {
      setReplying(true);
      await feedbackService.replyAdmin(selectedId, replyText.trim(), replyFiles);
      setReplyText("");
      setReplyFiles([]);
      await refreshDetail();
    } catch (err) {
      console.error(err);
      await dialog.alert({ title: fp.errors.replyFailed, message: "" });
    } finally {
      setReplying(false);
    }
  };

  const convLabels = {
    roleMember: fp.conversation.roleMember,
    roleCoach: fp.conversation.roleCoach,
    edited: fp.conversation.edited,
    edit: fp.conversation.edit,
    delete: fp.conversation.delete,
    save: fp.conversation.save,
    cancel: fp.conversation.cancel,
  };
  const attachLabels = { ...fp.attach };

  // 統計籤定義（全部 + 4 狀態）
  const statChips: { key: FeedbackStatus | ""; label: string; count: number }[] = [
    { key: "", label: fp.stats.all, count: stats?.total ?? 0 },
    { key: "waiting_coach", label: fp.stats.waiting_coach, count: stats?.waiting_coach ?? 0 },
    { key: "waiting_member", label: fp.stats.waiting_member, count: stats?.waiting_member ?? 0 },
    { key: "in_progress", label: fp.stats.in_progress, count: stats?.in_progress ?? 0 },
    { key: "resolved", label: fp.stats.resolved, count: stats?.resolved ?? 0 },
  ];

  const gridCols =
    size === "large"
      ? "grid-cols-1"
      : size === "small"
        ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
        : "grid-cols-1 sm:grid-cols-2";

  // ─────────────────────────────────────────────────────────
  // 詳情視圖
  // ─────────────────────────────────────────────────────────
  if (selectedId) {
    return (
      <div>
        <button
          onClick={backToList}
          className="text-sm text-luxe-muted hover:text-luxe-gold transition-colors mb-4"
          data-tour="adminfeedback-back"
        >
          {fp.backToList}
        </button>

        {detailLoading || !detail ? (
          <p className="text-luxe-muted py-16 text-center text-sm">{t.common.loading}</p>
        ) : (
          <div
            className="bg-luxe-surface rounded-2xl border border-luxe-gold/10 p-4 sm:p-6"
            data-tour="adminfeedback-detail"
          >
            {/* 頂列：狀態 + 訊息數 + 刪除 */}
            <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`text-xs px-2.5 py-0.5 rounded-full border ${STATUS_STYLE[detail.status]}`}
                >
                  {fp.statusLabel[detail.status]}
                </span>
                <span className="text-xs text-luxe-muted">
                  {fp.messagesCount.replace("{n}", String(detail.messages.length))}
                </span>
                <span className="text-xs text-luxe-muted">·</span>
                <span className="text-xs text-luxe-muted">
                  {fp.lastUpdated.replace("{time}", formatTime(detail.updated_at))}
                </span>
                {detail.owner_name && (
                  <span className="text-xs text-luxe-muted">
                    · {fp.fromMember.replace("{name}", detail.owner_name)}
                  </span>
                )}
              </div>
              <button
                onClick={handleDeleteThread}
                className="text-xs text-luxe-muted hover:text-red-400 transition-colors"
                data-tour="adminfeedback-delete"
              >
                🗑 {fp.detail.deleteThread}
              </button>
            </div>

            {/* 可編輯標題 */}
            <div className="mb-4" data-tour="adminfeedback-title">
              {editingTitle ? (
                <div className="flex items-center gap-2">
                  <input
                    value={titleDraft}
                    onChange={(e) => setTitleDraft(e.target.value)}
                    maxLength={200}
                    className="flex-1 rounded-lg bg-luxe-bg/60 border border-luxe-gold/20 px-3 py-2 text-lg text-luxe-text outline-none focus:border-luxe-gold/50"
                  />
                  <button
                    onClick={handleSaveTitle}
                    className="text-xs px-3 py-1.5 rounded-lg bg-luxe-gold/20 text-luxe-gold hover:bg-luxe-gold/30"
                  >
                    {fp.detail.saveTitle}
                  </button>
                  <button
                    onClick={() => setEditingTitle(false)}
                    className="text-xs px-2 py-1.5 rounded-lg text-luxe-muted hover:text-luxe-text"
                  >
                    {fp.detail.cancelEdit}
                  </button>
                </div>
              ) : (
                <h1 className="text-xl sm:text-2xl font-light text-luxe-text flex items-center gap-2 break-words">
                  {detail.title}
                  <button
                    onClick={() => {
                      setTitleDraft(detail.title);
                      setEditingTitle(true);
                    }}
                    aria-label={fp.detail.editTitleAria}
                    className="text-luxe-muted hover:text-luxe-gold text-base shrink-0"
                  >
                    ✎
                  </button>
                </h1>
              )}
            </div>

            {/* 狀態一鍵切換 chip */}
            <div className="flex flex-wrap gap-2 mb-6" data-tour="adminfeedback-status-chips">
              {FEEDBACK_STATUSES.map((s) => {
                const active = detail.status === s;
                return (
                  <button
                    key={s}
                    onClick={() => handleSetStatus(s)}
                    className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                      active
                        ? STATUS_STYLE[s] + " font-medium"
                        : "border-luxe-gold/15 text-luxe-muted hover:text-luxe-text hover:border-luxe-gold/30"
                    }`}
                  >
                    {fp.statusLabel[s]}
                  </button>
                );
              })}
            </div>

            <FeedbackConversation
              messages={detail.messages}
              viewerRole="coach"
              theme="luxe"
              labels={convLabels}
              formatTime={formatTime}
              onImageClick={(id, name) => setLightbox({ id, name })}
            />

            {/* 教練回覆輸入列 */}
            <div className="mt-6 pt-5 border-t border-luxe-gold/10" data-tour="adminfeedback-reply">
              <textarea
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                rows={3}
                placeholder={fp.reply.placeholder}
                className="w-full rounded-xl bg-luxe-bg/60 border border-luxe-gold/15 px-3.5 py-2.5 text-sm text-luxe-text outline-none focus:border-luxe-gold/40 resize-y"
              />
              <div className="mt-2">
                <AttachmentPicker
                  files={replyFiles}
                  onChange={setReplyFiles}
                  theme="luxe"
                  labels={attachLabels}
                  listenPaste
                />
              </div>
              <div className="flex justify-end mt-3">
                <button
                  disabled={replying || (!replyText.trim() && replyFiles.length === 0)}
                  onClick={handleReply}
                  className="text-sm px-5 py-2 rounded-full bg-luxe-gold text-black font-medium hover:bg-luxe-gold/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  {replying ? fp.reply.sending : fp.reply.send}
                </button>
              </div>
            </div>
          </div>
        )}

        <FeedbackLightbox
          imageId={lightbox?.id ?? null}
          fileName={lightbox?.name}
          onClose={() => setLightbox(null)}
        />
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────
  // 列表視圖
  // ─────────────────────────────────────────────────────────
  return (
    <div>
      <div className="mb-5" data-tour="adminfeedback-header">
        <h1 className="text-xl sm:text-2xl font-light text-luxe-text">{fp.pageTitle}</h1>
        <p className="text-sm text-luxe-muted">
          {fp.pageSubtitle.replace("{n}", String(stats?.total ?? 0))}
        </p>
      </div>

      {/* 狀態統計籤 */}
      <div className="flex flex-wrap gap-2 mb-4" data-tour="adminfeedback-stats">
        {statChips.map((chip) => {
          const active = statusFilter === chip.key;
          return (
            <button
              key={chip.key || "all"}
              onClick={() => setStatusFilter(chip.key)}
              className={`text-xs sm:text-sm px-3 py-1.5 rounded-full border transition-colors flex items-center gap-1.5 ${
                active
                  ? "bg-luxe-gold/15 text-luxe-gold border-luxe-gold/40 font-medium"
                  : "border-luxe-gold/15 text-luxe-muted hover:text-luxe-text hover:border-luxe-gold/30"
              }`}
            >
              {chip.label}
              <span className={active ? "text-luxe-gold" : "text-luxe-muted/70"}>
                {chip.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* 搜尋 + 顯示尺寸 */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={fp.searchPlaceholder}
          data-tour="adminfeedback-search"
          className="w-full sm:max-w-xs rounded-full bg-luxe-bg/60 border border-luxe-gold/15 px-4 py-2 text-sm text-luxe-text outline-none focus:border-luxe-gold/40"
        />
        <div className="flex items-center gap-2" data-tour="adminfeedback-size">
          <span className="text-xs text-luxe-muted">{fp.display.label}</span>
          <div className="flex rounded-full border border-luxe-gold/15 overflow-hidden">
            {(["large", "medium", "small"] as SizeMode[]).map((s) => (
              <button
                key={s}
                onClick={() => changeSize(s)}
                className={`px-3 py-1 text-xs transition-colors ${
                  size === s
                    ? "bg-luxe-gold/20 text-luxe-gold"
                    : "text-luxe-muted hover:text-luxe-text"
                }`}
              >
                {fp.display[s]}
              </button>
            ))}
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-900/20 border border-red-500/30 rounded-lg text-sm text-red-400">
          {error}
        </div>
      )}

      <div data-tour="adminfeedback-list">
        {loading ? (
          <p className="text-luxe-muted py-12 text-center text-sm">{t.common.loading}</p>
        ) : threads.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-4xl mb-3">📣</p>
            <p className="text-luxe-muted text-sm">
              {search || statusFilter ? fp.emptySearch : fp.empty}
            </p>
          </div>
        ) : (
          <div className={`grid ${gridCols} gap-4`}>
            {threads.map((th) => (
              <button
                key={th.id}
                onClick={() => openThread(th.id)}
                data-tour="adminfeedback-card"
                className={`text-left bg-luxe-surface rounded-2xl border border-luxe-gold/10 hover:border-luxe-gold/25 transition-colors flex flex-col ${
                  size === "small" ? "p-3" : "p-4 sm:p-5"
                }`}
              >
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span
                    className={`text-[11px] px-2 py-0.5 rounded-full border ${STATUS_STYLE[th.status]}`}
                  >
                    {fp.statusLabel[th.status]}
                  </span>
                  <span className="text-[11px] text-luxe-muted shrink-0">
                    {formatTime(th.updated_at)}
                  </span>
                </div>
                <h3
                  className={`font-medium text-luxe-text mb-1 line-clamp-1 ${
                    size === "large" ? "text-lg" : "text-base"
                  }`}
                >
                  {th.title}
                </h3>
                <p className="text-xs text-luxe-muted/80 mb-1">
                  {fp.fromMember.replace("{name}", th.owner_name)}
                </p>
                {th.preview && size !== "small" && (
                  <p
                    className={`text-sm text-luxe-muted flex-1 ${
                      size === "large" ? "line-clamp-3" : "line-clamp-2"
                    }`}
                  >
                    {th.preview}
                  </p>
                )}
                <div className="flex items-end justify-between gap-2 mt-3">
                  {th.message_count > 1 ? (
                    <span className="text-[11px] text-luxe-muted">
                      💬 {th.message_count}
                    </span>
                  ) : (
                    <span />
                  )}
                  {th.first_image_id && (
                    <FeedbackImageThumb
                      imageId={th.first_image_id}
                      theme="luxe"
                      className="w-10 h-10"
                      onClick={() => openThread(th.id)}
                    />
                  )}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      <FeedbackLightbox
        imageId={lightbox?.id ?? null}
        fileName={lightbox?.name}
        onClose={() => setLightbox(null)}
      />
    </div>
  );
};

export default AdminFeedback;
