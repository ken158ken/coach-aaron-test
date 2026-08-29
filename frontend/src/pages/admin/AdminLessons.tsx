/**
 * AdminLessons — 教學影片（Loom）管理頁
 * @module pages/admin/AdminLessons
 *
 * 功能：
 *   - 列表（含未發佈），顯示 thumbnail / title / category / 已發佈 / view
 *   - 新增按鈕 → 開 modal（必填 loom_url + title）
 *   - 編輯（同 modal，pre-filled）
 *   - 切換發佈狀態（直接 toggle）
 *   - 刪除（軟刪除，confirm dialog）
 *   - Transcript：admin 可貼 VTT/SRT，後端 parse 成 JSON 存
 */

import React, { useEffect, useState } from "react";
import { PillButton, Modal, useDialog, ImageInput } from "@/components/ui";
import { lessonService } from "@/services/content/lesson.service";
import { useLanguage } from "@/context/LanguageContext";
import type { Lesson, LessonInput } from "@/types";

const AdminLessons: React.FC = () => {
  const dialog = useDialog();
  const { t } = useLanguage();
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState<Lesson | null>(null);
  const [showForm, setShowForm] = useState(false);

  const fetchLessons = async () => {
    try {
      setLoading(true);
      setError("");
      const data = await lessonService.adminGetAll();
      setLessons(data || []);
    } catch (err) {
      console.error("Failed to fetch admin lessons:", err);
      setError(t.adminCommon.loadFailed);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchLessons();
  }, []);

  const onCreate = () => {
    setEditing(null);
    setShowForm(true);
  };

  const onEdit = (lesson: Lesson) => {
    setEditing(lesson);
    setShowForm(true);
  };

  const onDelete = async (lesson: Lesson) => {
    const ok = await dialog.confirm({
      title: t.adminLessonsPage.confirm.deleteTitle,
      message: t.adminLessonsPage.confirm.deleteMessage.replace(
        "{title}",
        lesson.title,
      ),
      confirmText: t.common.delete,
      cancelText: t.common.cancel,
      danger: true,
    });
    if (!ok) return;
    try {
      await lessonService.remove(lesson.id);
      void fetchLessons();
    } catch (err) {
      console.error(err);
      void dialog.alert({
        title: t.adminCommon.deleteFailed,
        message: String(err),
      });
    }
  };

  const onTogglePublish = async (lesson: Lesson) => {
    try {
      await lessonService.update(lesson.id, {
        is_published: !lesson.is_published,
      });
      void fetchLessons();
    } catch (err) {
      console.error(err);
      void dialog.alert({
        title: t.adminLessonsPage.error.toggleFailedTitle,
        message: String(err),
      });
    }
  };

  const onFormDone = () => {
    setShowForm(false);
    setEditing(null);
    void fetchLessons();
  };

  return (
    <div className="p-6 sm:p-8 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-light tracking-wider">
            {t.adminLessonsPage.pageTitle}
          </h1>
          <p className="text-sm text-muted mt-1">
            {t.adminLessonsPage.pageSubtitle}
          </p>
        </div>
        <PillButton
          theme="luxe"
          variant="primary"
          data-tour="lessons-add"
          onClick={onCreate}
        >
          ＋ {t.adminLessonsPage.addLesson}
        </PillButton>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-900/20 border border-red-500/30 rounded-lg text-sm text-red-400">
          {error}
        </div>
      )}

      {loading ? (
        <p className="text-muted">{t.common.loading}</p>
      ) : lessons.length === 0 ? (
        <p className="text-muted py-12 text-center">
          {t.adminLessonsPage.empty}
        </p>
      ) : (
        <div className="space-y-3" data-tour="lessons-list">
          {lessons.map((l) => (
            <div
              key={l.id}
              className="flex gap-4 p-3 sm:p-4 bg-surface rounded-xl border border-gold/15 hover:border-gold/30 transition-colors"
            >
              {/* Thumbnail */}
              <div className="shrink-0 w-32 sm:w-40 aspect-video rounded-lg overflow-hidden bg-surface-2 relative">
                <AdminLoomThumb
                  thumbnailUrl={l.thumbnail_url}
                  loomId={l.loom_id}
                />
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-3">
                  <h3 className="text-base sm:text-lg font-medium truncate">
                    {l.title}
                  </h3>
                  <span
                    className={`shrink-0 text-[10px] tracking-widest uppercase px-2 py-0.5 rounded-full ${
                      l.is_published
                        ? "bg-green-500/15 text-green-400 border border-green-500/30"
                        : "bg-gray-500/15 text-gray-400 border border-gray-500/30"
                    }`}
                  >
                    {l.is_published
                      ? t.adminLessonsPage.statusPublished
                      : t.common.draft}
                  </span>
                </div>
                {l.category && (
                  <p className="text-xs text-gold/70 tracking-widest uppercase mt-1">
                    {l.category}
                  </p>
                )}
                {l.description && (
                  <p className="text-xs sm:text-sm text-muted mt-2 line-clamp-2">
                    {l.description}
                  </p>
                )}
                <div className="mt-2 flex items-center gap-3 text-xs text-muted">
                  <span>👁 {l.view_count}</span>
                  {l.transcript && Array.isArray(l.transcript) && (
                    <span>
                      📝{" "}
                      {t.adminLessonsPage.transcriptLines.replace(
                        "{n}",
                        String(l.transcript.length),
                      )}
                    </span>
                  )}
                  <span className="font-mono text-[10px] opacity-60">
                    {l.loom_id.slice(0, 12)}…
                  </span>
                </div>

                <div
                  className="mt-3 flex gap-2 flex-wrap"
                  data-tour="lessons-row-actions"
                >
                  <PillButton
                    theme="luxe"
                    variant="outline"
                    size="sm"
                    onClick={() => onEdit(l)}
                  >
                    {t.common.edit}
                  </PillButton>
                  <PillButton
                    theme="luxe"
                    variant="outline"
                    size="sm"
                    onClick={() => onTogglePublish(l)}
                  >
                    {l.is_published
                      ? t.adminLessonsPage.unpublish
                      : t.adminLessonsPage.publish}
                  </PillButton>
                  <PillButton
                    theme="luxe"
                    variant="outline"
                    size="sm"
                    onClick={() => onDelete(l)}
                  >
                    {t.common.delete}
                  </PillButton>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <LessonFormModal
          lesson={editing}
          onClose={() => {
            setShowForm(false);
            setEditing(null);
          }}
          onSaved={onFormDone}
        />
      )}
    </div>
  );
};

// ─────────────────────────────────────────────────────────
// Form Modal
// ─────────────────────────────────────────────────────────
interface LessonFormModalProps {
  lesson: Lesson | null;
  onClose: () => void;
  onSaved: () => void;
}

const LessonFormModal: React.FC<LessonFormModalProps> = ({
  lesson,
  onClose,
  onSaved,
}) => {
  const dialog = useDialog();
  const { t } = useLanguage();
  const [title, setTitle] = useState(lesson?.title || "");
  const [titleEn, setTitleEn] = useState(lesson?.title_en || "");
  const [description, setDescription] = useState(lesson?.description || "");
  const [descriptionEn, setDescriptionEn] = useState(
    lesson?.description_en || "",
  );
  const [loomUrl, setLoomUrl] = useState(lesson?.loom_url || "");
  const [category, setCategory] = useState(lesson?.category || "");
  const [keywords, setKeywords] = useState(lesson?.keywords || "");
  const [sortOrder, setSortOrder] = useState(lesson?.sort_order ?? 0);
  const [isPublished, setIsPublished] = useState(lesson?.is_published ?? true);
  const [transcriptRaw, setTranscriptRaw] = useState("");
  const [transcriptLang, setTranscriptLang] = useState(
    lesson?.transcript_lang || "zh-TW",
  );
  const [fetchTranscript, setFetchTranscript] = useState(false);
  const [thumbnailUrl, setThumbnailUrl] = useState(lesson?.thumbnail_url || "");
  const [submitting, setSubmitting] = useState(false);

  const isEdit = !!lesson;
  const existingLineCount = lesson?.transcript?.length || 0;

  const handleSubmit = async () => {
    if (!title.trim() || !loomUrl.trim()) {
      void dialog.alert({
        title: t.adminLessonsPage.error.missingFieldsTitle,
        message: t.adminLessonsPage.error.missingFieldsMessage,
      });
      return;
    }

    const payload: Partial<LessonInput> = {
      title: title.trim(),
      title_en: titleEn.trim() || undefined,
      description: description.trim() || undefined,
      description_en: descriptionEn.trim() || undefined,
      loom_url: loomUrl.trim(),
      thumbnail_url: thumbnailUrl.trim() || undefined,
      category: category.trim() || undefined,
      keywords: keywords.trim() || undefined,
      sort_order: sortOrder,
      is_published: isPublished,
      transcript_lang: transcriptLang || undefined,
    };
    if (transcriptRaw.trim()) {
      payload.transcript_raw = transcriptRaw;
    } else if (fetchTranscript) {
      payload.fetch_transcript = true;
    }

    try {
      setSubmitting(true);
      if (isEdit && lesson) {
        await lessonService.update(lesson.id, payload);
      } else {
        await lessonService.create(payload as LessonInput);
      }
      onSaved();
    } catch (err) {
      console.error(err);
      void dialog.alert({
        title: t.adminCommon.saveFailed,
        message: String(err),
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen
      onClose={onClose}
      title={
        isEdit
          ? t.adminLessonsPage.form.editTitle
          : t.adminLessonsPage.form.createTitle
      }
      size="lg"
      tourId="lesson-form"
    >
      <div className="space-y-4 max-h-[75vh] overflow-y-auto pr-1">
        <Field
          label={t.adminLessonsPage.form.loomUrl}
          hint={t.adminLessonsPage.form.loomUrlHint}
        >
          <input
            type="url"
            data-tour="lesson-form-loom-url"
            className="studio-input w-full"
            placeholder="https://www.loom.com/share/..."
            value={loomUrl}
            onChange={(e) => setLoomUrl(e.target.value)}
          />
        </Field>

        <ImageInput
          label={t.adminLessonsPage.form.thumbnail}
          hint={t.adminLessonsPage.form.thumbnailHint}
          value={thumbnailUrl}
          onChange={setThumbnailUrl}
          entity="lesson"
          entityKey={lesson?.id ?? null}
          kind="thumb"
          aspectHint="16 / 9"
          allowUrl={{
            test: (url) => url.startsWith("https://cdn.loom.com/"),
            hint: t.adminLessonsPage.form.thumbnailUrlHint,
          }}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label={t.adminLessonsPage.form.title}>
            <input
              type="text"
              data-tour="lesson-form-title"
              className="studio-input w-full"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </Field>
          <Field label={t.adminLessonsPage.form.titleEn}>
            <input
              type="text"
              className="studio-input w-full"
              value={titleEn}
              onChange={(e) => setTitleEn(e.target.value)}
            />
          </Field>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label={t.adminLessonsPage.form.description}>
            <textarea
              className="studio-input w-full resize-none"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </Field>
          <Field label={t.adminLessonsPage.form.descriptionEn}>
            <textarea
              className="studio-input w-full resize-none"
              rows={3}
              value={descriptionEn}
              onChange={(e) => setDescriptionEn(e.target.value)}
            />
          </Field>
        </div>

        <div
          className="grid grid-cols-1 md:grid-cols-3 gap-4"
          data-tour="lesson-form-meta"
        >
          <Field label={t.adminCommon.colCategory}>
            <input
              type="text"
              className="studio-input w-full"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder={t.adminLessonsPage.form.categoryPlaceholder}
            />
          </Field>
          <Field
            label={t.adminLessonsPage.form.keywords}
            hint={t.adminLessonsPage.form.keywordsHint}
          >
            <input
              type="text"
              className="studio-input w-full"
              value={keywords}
              onChange={(e) => setKeywords(e.target.value)}
              placeholder={t.adminLessonsPage.form.keywordsPlaceholder}
            />
          </Field>
          <Field label={t.adminCommon.colSortOrder}>
            <input
              type="number"
              className="studio-input w-full"
              value={sortOrder}
              onChange={(e) => setSortOrder(Number(e.target.value) || 0)}
            />
          </Field>
        </div>

        <Field
          label={t.adminLessonsPage.form.transcript}
          hint={t.adminLessonsPage.form.transcriptHint}
        >
          {existingLineCount > 0 && !transcriptRaw && (
            <p className="text-xs text-muted mb-2">
              {t.adminLessonsPage.form.transcriptExisting.replace(
                "{n}",
                String(existingLineCount),
              )}
            </p>
          )}
          <textarea
            data-tour="lesson-form-transcript"
            className="studio-input w-full resize-none font-mono text-xs"
            rows={6}
            placeholder={t.adminLessonsPage.form.transcriptPlaceholder}
            value={transcriptRaw}
            onChange={(e) => setTranscriptRaw(e.target.value)}
          />
          <label className="mt-2 flex items-center gap-2 text-xs text-muted cursor-pointer select-none">
            <input
              type="checkbox"
              checked={fetchTranscript}
              onChange={(e) => setFetchTranscript(e.target.checked)}
              disabled={!!transcriptRaw.trim()}
            />
            {t.adminLessonsPage.form.transcriptFetch}
          </label>
          <div className="mt-2 flex items-center gap-2 text-xs text-muted">
            <span>{t.adminLessonsPage.form.transcriptLang}</span>
            <select
              className="studio-input"
              value={transcriptLang}
              onChange={(e) => setTranscriptLang(e.target.value)}
            >
              <option value="zh-TW">{t.adminLessonsPage.lang.zhTW}</option>
              <option value="zh-CN">{t.adminLessonsPage.lang.zhCN}</option>
              <option value="en">{t.adminLessonsPage.lang.en}</option>
              <option value="ja">{t.adminLessonsPage.lang.ja}</option>
            </select>
          </div>
        </Field>

        <label className="flex items-center gap-2 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={isPublished}
            onChange={(e) => setIsPublished(e.target.checked)}
          />
          <span>{t.adminLessonsPage.form.publishNow}</span>
        </label>
      </div>

      <div className="mt-5 flex gap-3 justify-end pt-4 border-t border-gold/15">
        <PillButton
          theme="luxe"
          variant="outline"
          onClick={onClose}
          disabled={submitting}
        >
          {t.common.cancel}
        </PillButton>
        <PillButton
          theme="luxe"
          variant="primary"
          data-tour="lesson-form-submit"
          onClick={handleSubmit}
          disabled={submitting}
        >
          {submitting
            ? t.adminCommon.saving
            : isEdit
              ? t.adminLessonsPage.form.saveChanges
              : t.adminLessonsPage.addLesson}
        </PillButton>
      </div>
    </Modal>
  );
};

const Field: React.FC<{
  label: string;
  hint?: string;
  children: React.ReactNode;
}> = ({ label, hint, children }) => (
  <div>
    <label className="block text-xs tracking-widest uppercase text-muted mb-1.5">
      {label}
    </label>
    {children}
    {hint && <p className="text-[11px] text-muted mt-1">{hint}</p>}
  </div>
);

/** Cascading thumbnail fallback：DB url → Loom CDN gif → jpg → 隱藏 */
const AdminLoomThumb: React.FC<{
  thumbnailUrl?: string | null;
  loomId: string;
}> = ({ thumbnailUrl, loomId }) => {
  const sources = React.useMemo(
    () =>
      [
        thumbnailUrl,
        `https://cdn.loom.com/sessions/thumbnails/${loomId}-with-play.gif`,
        `https://cdn.loom.com/sessions/thumbnails/${loomId}-with-play.jpg`,
      ].filter((s): s is string => !!s),
    [thumbnailUrl, loomId],
  );
  const [idx, setIdx] = React.useState(0);
  const [hidden, setHidden] = React.useState(false);
  React.useEffect(() => {
    setIdx(0);
    setHidden(false);
  }, [sources.length, sources[0]]);

  if (hidden || sources.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center text-muted text-xs">
        🎬
      </div>
    );
  }
  return (
    <img
      src={sources[idx]}
      alt=""
      loading="lazy"
      className="w-full h-full object-cover"
      onError={() => {
        if (idx + 1 < sources.length) setIdx(idx + 1);
        else setHidden(true);
      }}
    />
  );
};

export default AdminLessons;
