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

import React, { useEffect, useRef, useState } from "react";
import { PillButton, Modal, useDialog } from "@/components/ui";
import { lessonService } from "@/services/content/lesson.service";
import { post } from "@/services/api";
import type { Lesson, LessonInput } from "@/types";

const AdminLessons: React.FC = () => {
  const dialog = useDialog();
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
      setError("載入失敗");
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
      title: "刪除教學影片",
      message: `確定要刪除「${lesson.title}」？這是軟刪除，不會真的從 DB 消失。`,
      confirmText: "刪除",
      cancelText: "取消",
      danger: true,
    });
    if (!ok) return;
    try {
      await lessonService.remove(lesson.id);
      void fetchLessons();
    } catch (err) {
      console.error(err);
      void dialog.alert({ title: "刪除失敗", message: String(err) });
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
      void dialog.alert({ title: "切換失敗", message: String(err) });
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
          <h1 className="text-2xl font-light tracking-wider">教學影片管理</h1>
          <p className="text-sm text-muted mt-1">
            目前只支援 Loom；新增時貼 Loom 分享連結即可
          </p>
        </div>
        <PillButton theme="luxe" variant="primary" onClick={onCreate}>
          ＋ 新增
        </PillButton>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-900/20 border border-red-500/30 rounded-lg text-sm text-red-400">
          {error}
        </div>
      )}

      {loading ? (
        <p className="text-muted">載入中...</p>
      ) : lessons.length === 0 ? (
        <p className="text-muted py-12 text-center">
          目前沒有任何教學影片。點上面的「＋ 新增」開始建立。
        </p>
      ) : (
        <div className="space-y-3">
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
                    {l.is_published ? "已發佈" : "草稿"}
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
                    <span>📝 {l.transcript.length} 句逐字稿</span>
                  )}
                  <span className="font-mono text-[10px] opacity-60">
                    {l.loom_id.slice(0, 12)}…
                  </span>
                </div>

                <div className="mt-3 flex gap-2 flex-wrap">
                  <PillButton
                    theme="luxe"
                    variant="outline"
                    size="sm"
                    onClick={() => onEdit(l)}
                  >
                    編輯
                  </PillButton>
                  <PillButton
                    theme="luxe"
                    variant="outline"
                    size="sm"
                    onClick={() => onTogglePublish(l)}
                  >
                    {l.is_published ? "下架" : "發佈"}
                  </PillButton>
                  <PillButton
                    theme="luxe"
                    variant="outline"
                    size="sm"
                    onClick={() => onDelete(l)}
                  >
                    刪除
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
  const [thumbUploading, setThumbUploading] = useState(false);
  const [thumbUploadError, setThumbUploadError] = useState("");
  const thumbFileRef = useRef<HTMLInputElement>(null);
  const [submitting, setSubmitting] = useState(false);

  const isEdit = !!lesson;
  const existingLineCount = lesson?.transcript?.length || 0;

  const handleSubmit = async () => {
    if (!title.trim() || !loomUrl.trim()) {
      void dialog.alert({
        title: "缺欄位",
        message: "標題與 Loom 連結為必填",
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
      void dialog.alert({ title: "儲存失敗", message: String(err) });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal isOpen onClose={onClose} title={isEdit ? "編輯教學影片" : "新增教學影片"} size="lg">
      <input
        ref={thumbFileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={async (e) => {
          const file = e.target.files?.[0];
          if (!file) return;
          e.target.value = "";
          setThumbUploading(true);
          setThumbUploadError("");
          const reader = new FileReader();
          reader.onload = async (ev) => {
            const dataUrl = (ev.target?.result as string) ?? "";
            try {
              const { url } = await post<{ url: string }>(
                "/api/lessons/upload-thumbnail",
                { image: dataUrl },
              );
              setThumbnailUrl(url);
            } catch {
              setThumbUploadError("上傳失敗，請重試");
            } finally {
              setThumbUploading(false);
            }
          };
          reader.readAsDataURL(file);
        }}
      />
      <div className="space-y-4 max-h-[75vh] overflow-y-auto pr-1">
        <Field label="Loom 分享連結 *" hint="例：https://www.loom.com/share/d3479f55…">
          <input
            type="url"
            className="studio-input w-full"
            placeholder="https://www.loom.com/share/..."
            value={loomUrl}
            onChange={(e) => setLoomUrl(e.target.value)}
          />
        </Field>

        <Field label="封面截圖" hint="上傳截圖或貼網址；不填則自動抓 Loom 縮圖">
          <div className="flex gap-2">
            <input
              type="url"
              className="studio-input flex-1"
              placeholder="https://..."
              value={thumbnailUrl}
              onChange={(e) => setThumbnailUrl(e.target.value)}
            />
            <button
              type="button"
              onClick={() => thumbFileRef.current?.click()}
              disabled={thumbUploading}
              className="px-3 py-2 bg-gold/15 hover:bg-gold/25 text-gold text-xs rounded-lg border border-gold/30 transition-colors whitespace-nowrap disabled:opacity-50"
            >
              {thumbUploading ? "上傳中..." : "上傳截圖"}
            </button>
          </div>
          {thumbUploadError && (
            <p className="text-xs text-red-400 mt-1">{thumbUploadError}</p>
          )}
          {thumbnailUrl && (
            <img
              src={thumbnailUrl}
              alt="縮圖預覽"
              className="mt-2 w-full h-24 object-cover rounded-lg"
              onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
            />
          )}
        </Field>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="標題 *">
            <input
              type="text"
              className="studio-input w-full"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </Field>
          <Field label="標題（英）">
            <input
              type="text"
              className="studio-input w-full"
              value={titleEn}
              onChange={(e) => setTitleEn(e.target.value)}
            />
          </Field>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="描述">
            <textarea
              className="studio-input w-full resize-none"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </Field>
          <Field label="描述（英）">
            <textarea
              className="studio-input w-full resize-none"
              rows={3}
              value={descriptionEn}
              onChange={(e) => setDescriptionEn(e.target.value)}
            />
          </Field>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Field label="分類">
            <input
              type="text"
              className="studio-input w-full"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="例：教練養成"
            />
          </Field>
          <Field
            label="標籤"
            hint="用逗號分隔（前端會自動切 #）"
          >
            <input
              type="text"
              className="studio-input w-full"
              value={keywords}
              onChange={(e) => setKeywords(e.target.value)}
              placeholder="心理學,諮詢,體驗課"
            />
          </Field>
          <Field label="排序">
            <input
              type="number"
              className="studio-input w-full"
              value={sortOrder}
              onChange={(e) => setSortOrder(Number(e.target.value) || 0)}
            />
          </Field>
        </div>

        <Field label="逐字稿" hint="貼 Loom 匯出的 VTT / SRT 全文，後端會自動 parse 成可同步的格式">
          {existingLineCount > 0 && !transcriptRaw && (
            <p className="text-xs text-muted mb-2">
              目前已有 {existingLineCount} 句逐字稿；要更換才需要重貼，否則留空即可。
            </p>
          )}
          <textarea
            className="studio-input w-full resize-none font-mono text-xs"
            rows={6}
            placeholder={`WEBVTT\n\n00:00:00.500 --> 00:00:03.200\n大家好，今天要分享...\n\n00:00:03.200 --> 00:00:05.800\n一套心理學導向的諮詢流程`}
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
            或請後端自動嘗試從 Loom 抓取（best-effort，可能失敗）
          </label>
          <div className="mt-2 flex items-center gap-2 text-xs text-muted">
            <span>逐字稿語言：</span>
            <select
              className="studio-input"
              value={transcriptLang}
              onChange={(e) => setTranscriptLang(e.target.value)}
            >
              <option value="zh-TW">繁體中文</option>
              <option value="zh-CN">簡體中文</option>
              <option value="en">English</option>
              <option value="ja">日本語</option>
            </select>
          </div>
        </Field>

        <label className="flex items-center gap-2 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={isPublished}
            onChange={(e) => setIsPublished(e.target.checked)}
          />
          <span>立即發佈</span>
        </label>
      </div>

      <div className="mt-5 flex gap-3 justify-end pt-4 border-t border-gold/15">
        <PillButton
          theme="luxe"
          variant="outline"
          onClick={onClose}
          disabled={submitting}
        >
          取消
        </PillButton>
        <PillButton
          theme="luxe"
          variant="primary"
          onClick={handleSubmit}
          disabled={submitting}
        >
          {submitting ? "儲存中..." : isEdit ? "儲存變更" : "新增"}
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
