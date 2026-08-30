/**
 * FeedbackPage — 意見反饋（學員視角）
 * @module pages/FeedbackPage
 * @theme studio（前台語意 token：text-inherit / text-muted / bg-surface / gold）
 *
 * 卡片牆 + 新增反饋 modal（標題／內容／附圖，支援貼上截圖與拖放）+ 對話串。
 * 學員只看得到自己的反饋；回覆後狀態轉為「等待教練回應」。
 */

import React, { useCallback, useEffect, useState } from "react";
import { format } from "date-fns";
import { enUS, zhTW } from "date-fns/locale";
import { useLanguage } from "@/context/LanguageContext";
import { PillButton, Modal, useDialog } from "@/components/ui";
import {
  feedbackService,
  type FeedbackThreadSummary,
  type FeedbackThreadDetail,
  type FeedbackStatus,
} from "@/services/feedback/feedback.service";
import AttachmentPicker from "@/components/feedback/AttachmentPicker";
import FeedbackConversation from "@/components/feedback/FeedbackConversation";
import { FeedbackImageThumb, FeedbackLightbox } from "@/components/feedback/FeedbackImage";

/** 狀態徽章樣式（studio 語意色）*/
const STATUS_STYLE: Record<FeedbackStatus, string> = {
  waiting_coach: "bg-amber-500/15 text-amber-600 dark:text-amber-300 border-amber-500/30",
  waiting_member: "bg-gold/15 text-gold border-gold/30",
  in_progress: "bg-sky-500/15 text-sky-600 dark:text-sky-300 border-sky-500/30",
  resolved: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-300 border-emerald-500/30",
};

const FeedbackPage: React.FC = () => {
  const { t, isZhTW } = useLanguage();
  const fb = t.memberFeedback;
  const dialog = useDialog();
  const dfLocale = isZhTW ? zhTW : enUS;

  // 列表
  const [threads, setThreads] = useState<FeedbackThreadSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  // 詳情
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<FeedbackThreadDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // 新增 modal
  const [modalOpen, setModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");
  const [newFiles, setNewFiles] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);

  // 回覆
  const [replyText, setReplyText] = useState("");
  const [replyFiles, setReplyFiles] = useState<File[]>([]);
  const [replying, setReplying] = useState(false);

  // lightbox
  const [lightbox, setLightbox] = useState<{ id: string; name?: string } | null>(null);

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

  const fetchList = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const data = await feedbackService.listMine({ search, limit: 50 });
      setThreads(data.threads);
    } catch (err) {
      console.error(err);
      setError(fb.loadFailed);
    } finally {
      setLoading(false);
    }
  }, [search, fb.loadFailed]);

  // 搜尋防抖
  useEffect(() => {
    const timer = setTimeout(fetchList, search ? 300 : 0);
    return () => clearTimeout(timer);
  }, [fetchList, search]);

  const openThread = useCallback(async (id: string) => {
    setSelectedId(id);
    setDetail(null);
    setReplyText("");
    setReplyFiles([]);
    try {
      setDetailLoading(true);
      const data = await feedbackService.detailMine(id);
      setDetail(data);
    } catch (err) {
      console.error(err);
      setError(fb.loadFailed);
      setSelectedId(null);
    } finally {
      setDetailLoading(false);
    }
  }, [fb.loadFailed]);

  const backToList = () => {
    setSelectedId(null);
    setDetail(null);
    fetchList();
  };

  const handleCreate = async () => {
    if (!newTitle.trim()) {
      await dialog.alert({ title: fb.validation.titleRequired, message: "" });
      return;
    }
    if (!newContent.trim() && newFiles.length === 0) {
      await dialog.alert({ title: fb.validation.contentRequired, message: "" });
      return;
    }
    try {
      setSubmitting(true);
      const { id } = await feedbackService.create(
        newTitle.trim(),
        newContent.trim(),
        newFiles,
      );
      setModalOpen(false);
      setNewTitle("");
      setNewContent("");
      setNewFiles([]);
      await openThread(id);
    } catch (err) {
      console.error(err);
      await dialog.alert({ title: fb.errors.createFailed, message: "" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleReply = async () => {
    if (!selectedId) return;
    if (!replyText.trim() && replyFiles.length === 0) return;
    try {
      setReplying(true);
      await feedbackService.replyMine(selectedId, replyText.trim(), replyFiles);
      setReplyText("");
      setReplyFiles([]);
      const data = await feedbackService.detailMine(selectedId);
      setDetail(data);
    } catch (err) {
      console.error(err);
      await dialog.alert({ title: fb.errors.replyFailed, message: "" });
    } finally {
      setReplying(false);
    }
  };

  const handleEditMessage = async (messageId: string, content: string) => {
    try {
      await feedbackService.editMessage(messageId, content);
      if (selectedId) setDetail(await feedbackService.detailMine(selectedId));
    } catch (err) {
      console.error(err);
      await dialog.alert({ title: fb.errors.editFailed, message: "" });
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    const confirmed = await dialog.confirm({
      title: fb.deleteMsgTitle,
      message: fb.deleteMsgMessage,
      variant: "danger",
      confirmText: fb.conversation.delete,
    });
    if (!confirmed) return;
    try {
      await feedbackService.deleteMessage(messageId);
      if (selectedId) setDetail(await feedbackService.detailMine(selectedId));
    } catch (err) {
      console.error(err);
      await dialog.alert({ title: fb.errors.deleteFailed, message: "" });
    }
  };

  const convLabels = {
    roleMember: fb.conversation.roleMember,
    roleCoach: fb.conversation.roleCoach,
    edited: fb.conversation.edited,
    edit: fb.conversation.edit,
    delete: fb.conversation.delete,
    save: fb.conversation.save,
    cancel: fb.conversation.cancel,
  };
  const attachLabels = { ...fb.attach };

  // ─────────────────────────────────────────────────────────
  // 詳情視圖
  // ─────────────────────────────────────────────────────────
  if (selectedId) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-6 sm:py-10">
        <button
          onClick={backToList}
          className="text-sm text-muted hover:text-gold transition-colors mb-4"
          data-tour="feedback-back"
        >
          {fb.backToList}
        </button>

        {detailLoading || !detail ? (
          <div className="text-center py-16 text-muted">{t.common.loading}</div>
        ) : (
          <div
            className="bg-surface rounded-2xl border border-gold/15 p-4 sm:p-6"
            data-tour="feedback-detail"
          >
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span
                className={`text-xs px-2.5 py-0.5 rounded-full border ${STATUS_STYLE[detail.status]}`}
                data-tour="feedback-status"
              >
                {fb.statusLabel[detail.status]}
              </span>
              <span className="text-xs text-muted">
                {fb.messagesCount.replace("{n}", String(detail.messages.length))}
              </span>
              <span className="text-xs text-muted">·</span>
              <span className="text-xs text-muted">
                {fb.lastUpdated.replace("{time}", formatTime(detail.updated_at))}
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-light text-inherit mb-5 break-words">
              {detail.title}
            </h1>

            <FeedbackConversation
              messages={detail.messages}
              viewerRole="member"
              theme="studio"
              labels={convLabels}
              formatTime={formatTime}
              onImageClick={(id, name) => setLightbox({ id, name })}
              onEditMessage={handleEditMessage}
              onDeleteMessage={handleDeleteMessage}
            />

            {/* 回覆輸入列 */}
            <div className="mt-6 pt-5 border-t border-gold/10" data-tour="feedback-reply">
              <textarea
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                rows={3}
                placeholder={fb.reply.placeholder}
                className="w-full rounded-xl bg-black/5 dark:bg-white/5 border border-gold/15 px-3.5 py-2.5 text-sm text-inherit outline-none focus:border-gold/40 resize-y"
              />
              <div className="mt-2">
                <AttachmentPicker
                  files={replyFiles}
                  onChange={setReplyFiles}
                  theme="studio"
                  labels={attachLabels}
                  listenPaste
                />
              </div>
              <div className="flex justify-end mt-3">
                <PillButton
                  theme="luxe"
                  variant="filled"
                  size="sm"
                  disabled={replying || (!replyText.trim() && replyFiles.length === 0)}
                  onClick={handleReply}
                >
                  {replying ? fb.reply.sending : fb.reply.send}
                </PillButton>
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
    <div className="max-w-4xl mx-auto px-4 py-10 sm:py-16">
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-light text-inherit">{fb.heading}</h1>
          <p className="text-sm text-muted mt-1 max-w-md">{fb.subtitle}</p>
        </div>
        <PillButton
          theme="luxe"
          variant="filled"
          onClick={() => setModalOpen(true)}
          data-tour="feedback-new"
        >
          {fb.newFeedback}
        </PillButton>
      </div>

      {/* 搜尋 */}
      <div className="mb-6" data-tour="feedback-search">
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={fb.searchPlaceholder}
          className="w-full sm:max-w-xs rounded-full bg-surface border border-gold/15 px-4 py-2 text-sm text-inherit outline-none focus:border-gold/40"
        />
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-900/20 border border-red-500/30 rounded-lg text-sm text-red-400">
          {error}
        </div>
      )}

      <div data-tour="feedback-list">
        {loading ? (
          <div className="text-center py-12 text-muted">{t.common.loading}</div>
        ) : threads.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-4xl mb-3">💬</p>
            <p className="text-muted">{search ? fb.emptySearch : fb.empty}</p>
            {!search && (
              <p className="text-sm text-muted/70 mt-1">{fb.emptyHint}</p>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {threads.map((th) => (
              <button
                key={th.id}
                onClick={() => openThread(th.id)}
                data-tour="feedback-card"
                className="text-left bg-surface rounded-2xl border border-gold/15 p-4 hover:border-gold/30 hover:shadow-lg hover:shadow-gold/5 transition-all flex flex-col"
              >
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span
                    className={`text-[11px] px-2 py-0.5 rounded-full border ${STATUS_STYLE[th.status]}`}
                  >
                    {fb.statusLabel[th.status]}
                  </span>
                  <span className="text-[11px] text-muted shrink-0">
                    {formatTime(th.updated_at)}
                  </span>
                </div>
                <h3 className="text-base font-medium text-inherit mb-1 line-clamp-1">
                  {th.title}
                </h3>
                {th.preview && (
                  <p className="text-sm text-muted line-clamp-2 flex-1">
                    {th.preview}
                  </p>
                )}
                <div className="flex items-end justify-between gap-2 mt-3">
                  <span className="text-[11px] text-gold/80">
                    {th.status === "waiting_member" ? fb.yourTurn : fb.waitingCoach}
                  </span>
                  <div className="flex items-center gap-2 shrink-0">
                    {th.message_count > 1 && (
                      <span className="text-[11px] text-muted">
                        💬 {th.message_count}
                      </span>
                    )}
                    {th.first_image_id && (
                      <FeedbackImageThumb
                        imageId={th.first_image_id}
                        theme="studio"
                        className="w-10 h-10"
                        onClick={() => openThread(th.id)}
                      />
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 新增反饋 modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => !submitting && setModalOpen(false)}
        title={fb.modal.title}
        size="lg"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-muted mb-1">
              {fb.modal.titleLabel}
            </label>
            <input
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder={fb.modal.titlePlaceholder}
              maxLength={200}
              className="w-full rounded-lg bg-black/5 dark:bg-white/5 border border-gold/15 px-3.5 py-2.5 text-sm text-inherit outline-none focus:border-gold/40"
            />
          </div>
          <div>
            <label className="block text-sm text-muted mb-1">
              {fb.modal.contentLabel}
            </label>
            <textarea
              value={newContent}
              onChange={(e) => setNewContent(e.target.value)}
              rows={5}
              placeholder={fb.modal.contentPlaceholder}
              className="w-full rounded-lg bg-black/5 dark:bg-white/5 border border-gold/15 px-3.5 py-2.5 text-sm text-inherit outline-none focus:border-gold/40 resize-y"
            />
          </div>
          <div>
            <label className="block text-sm text-muted mb-1">
              {fb.modal.attachLabel}
            </label>
            <AttachmentPicker
              files={newFiles}
              onChange={setNewFiles}
              theme="studio"
              labels={attachLabels}
              listenPaste={modalOpen}
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <PillButton
              theme="luxe"
              variant="outline"
              size="sm"
              disabled={submitting}
              onClick={() => setModalOpen(false)}
            >
              {fb.modal.cancel}
            </PillButton>
            <PillButton
              theme="luxe"
              variant="filled"
              size="sm"
              disabled={submitting}
              onClick={handleCreate}
            >
              {submitting ? fb.modal.submitting : fb.modal.submit}
            </PillButton>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default FeedbackPage;
