/**
 * ImageInput — 全站統一的圖片欄位元件
 * @module components/ui/ImageInput
 *
 * @description
 * 一個欄位、兩種來源：
 *   「上傳圖片」 → 拖放或點選 → POST /api/uploads/{entity}/{entityKey ?? temp}
 *                  → 後端 sharp 壓成 WebP 存進 Supabase Storage → 回傳 public URL
 *   「Cloudinary 網址」 → 貼現成網址，即時驗證帳號前綴
 *
 * 兩種來源產生的值都是一個字串 URL，透過 `onChange(url)` 交還給呼叫端；
 * 移除圖片 = `onChange("")`。驗證一律走 `@/lib/imageUrl`（全站唯一實作）。
 *
 * 主題：只用 admin 既有的 luxe-* / Tailwind class，不硬編色碼，
 *      深色與 studio-light 淺色模式都由 index.css 的 token 自動切換。
 */

import React, { useCallback, useEffect, useId, useRef, useState } from "react";
import {
  ACCEPT_ATTR,
  CLOUDINARY_PREFIX,
  isAllowedImageUrl,
  isCloudinaryUrl,
  validateImageFile,
} from "@/lib/imageUrl";
import {
  uploadImage,
  type ImageEntity,
  type ImageKind,
} from "@/services/content/upload.service";

export type { ImageEntity, ImageKind };

// ─────────────────────────────────────────────────────────
// 上傳目標 Context
// ─────────────────────────────────────────────────────────
/**
 * 富文本編輯器裡的插圖（RichTextEditor 的插圖 modal、ImageGallery node view）
 * 沒辦法直接拿到「目前正在編輯哪一篇文章／課程」，但上傳需要 entity + entityKey。
 * 由編輯頁在 RichTextEditor 外層包一層 Provider 把目標傳下去；
 * TipTap 的 React node view 是從 EditorContent 的 React tree portal 出來的，
 * 因此 context 會正常流入。沒有 Provider 時退回 article/temp（後端會當草稿處理）。
 */
export interface ImageUploadTarget {
  entity: ImageEntity;
  entityKey: string | number | null;
}

const DEFAULT_UPLOAD_TARGET: ImageUploadTarget = {
  entity: "article",
  entityKey: null,
};

const ImageUploadTargetContext =
  React.createContext<ImageUploadTarget>(DEFAULT_UPLOAD_TARGET);

export const ImageUploadTargetProvider: React.FC<{
  value: ImageUploadTarget;
  children: React.ReactNode;
}> = ({ value, children }) => {
  const memo = React.useMemo(
    () => ({ entity: value.entity, entityKey: value.entityKey ?? null }),
    [value.entity, value.entityKey],
  );
  return (
    <ImageUploadTargetContext.Provider value={memo}>
      {children}
    </ImageUploadTargetContext.Provider>
  );
};

/** 取得目前的插圖上傳目標 */
export const useImageUploadTarget = (): ImageUploadTarget =>
  React.useContext(ImageUploadTargetContext);

interface ImageInputBaseProps {
  /** 欄位標題；不給則不顯示標題列 */
  label?: string;
  /** 標題後的灰字補充說明（例如「列表卡片用」） */
  hint?: string;
  /** 目前的圖片網址（"" 代表未設定） */
  value: string;
  /** 值變更時呼叫；移除圖片會收到 "" */
  onChange: (url: string) => void;
  /** 已存在實體的 key；null/undefined → 上傳到 temp/，由後端在儲存時搬正 */
  entityKey?: string | number | null;
  /** 預覽框比例，CSS aspect-ratio 值，例如 "16 / 9"、"3 / 4" */
  aspectHint?: string;
  /** 必填時，空值會顯示提示 */
  required?: boolean;
  /** 外部（例如送出時驗證）傳進來的錯誤訊息 */
  error?: string;
  disabled?: boolean;
  /** 緊湊版：用於表格列 / 多欄並排的狹窄空間 */
  compact?: boolean;
  className?: string;
  /** 按下「移除」時的額外清理（例如 LP 的 deleteImage）；失敗不阻擋移除 */
  onRemove?: (url: string) => void | Promise<void>;
  /**
   * 網址頁籤的額外放行規則（Cloudinary 之外）。
   * 例如教學影片縮圖允許 Loom CDN：`{ test: isLoomUrl, hint: "或 cdn.loom.com" }`
   */
  allowUrl?: { test: (url: string) => boolean; hint: string };
}

/**
 * entity / kind 與 uploadFn 二選一：
 *  - 走統一上傳 API → 必須指定 entity + kind（決定 bucket 與壓縮 preset）
 *  - 自帶 uploadFn（影片縮圖的 temp→finalize、LP 的 lp-images）→ 不需要也不該給 entity，
 *    避免宣告了一個實際上沒被使用的 bucket 造成誤解。
 */
export type ImageInputProps = ImageInputBaseProps &
  (
    | {
        entity: ImageEntity;
        kind: ImageKind;
        uploadFn?: undefined;
      }
    | {
        entity?: undefined;
        kind?: undefined;
        /** 自訂上傳實作（回傳圖片 URL），完全取代預設的 /api/uploads 流程 */
        uploadFn: (file: File, onProgress?: (p: number) => void) => Promise<string>;
      }
  );

type Tab = "upload" | "url";

/** 上傳雲朵圖示 */
const UploadIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.5}
      d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
    />
  </svg>
);

const Spinner: React.FC<{ className?: string }> = ({ className = "w-4 h-4" }) => (
  <span
    className={`${className} inline-block border-2 border-t-transparent border-luxe-gold rounded-full animate-spin`}
    aria-hidden="true"
  />
);

const ImageInput: React.FC<ImageInputProps> = ({
  label,
  hint,
  value,
  onChange,
  entity,
  entityKey = null,
  kind,
  aspectHint = "16 / 9",
  required = false,
  error,
  disabled = false,
  compact = false,
  className = "",
  uploadFn,
  onRemove,
  allowUrl,
}) => {
  const fieldId = useId();
  const fileRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  /** 已有 Cloudinary 值時預設停在網址頁籤，其餘（含空值）預設上傳頁籤 */
  const [tab, setTab] = useState<Tab>(() => (isCloudinaryUrl(value) ? "url" : "upload"));
  /** 有值時是否展開輸入區（按「更換」或切換頁籤時展開） */
  const [replacing, setReplacing] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [uploadError, setUploadError] = useState("");
  const [urlDraft, setUrlDraft] = useState(isCloudinaryUrl(value) ? value : "");
  const [urlError, setUrlError] = useState("");
  const [previewFailed, setPreviewFailed] = useState(false);

  // 外部把 value 換掉（載入資料、切換編輯對象）時同步內部狀態
  useEffect(() => {
    setPreviewFailed(false);
    setUrlDraft(isCloudinaryUrl(value) ? value : "");
    setUrlError("");
    if (value) setReplacing(false);
  }, [value]);

  // 卸載時取消進行中的上傳，避免 setState on unmounted
  useEffect(() => () => abortRef.current?.abort(), []);

  const hasValue = Boolean(value && value.trim());
  const valueInvalid =
    hasValue && !isAllowedImageUrl(value) && !allowUrl?.test(value);
  const showPane = !hasValue || replacing;

  // ── 上傳 ────────────────────────────────────────────────
  const doUpload = useCallback(
    async (file: File) => {
      const fileError = validateImageFile(file);
      if (fileError) {
        setUploadError(fileError);
        return;
      }
      setUploadError("");
      setUploading(true);
      setProgress(0);

      const controller = new AbortController();
      abortRef.current = controller;

      try {
        // props 的判別聯集保證：沒有 uploadFn 時 entity / kind 一定有值，
        // 但 TS 無法在解構後的變數上維持這個關聯，所以這裡明確斷言。
        const url = uploadFn
          ? await uploadFn(file, setProgress)
          : (
              await uploadImage({
                entity: entity as ImageEntity,
                entityKey,
                kind: kind as ImageKind,
                file,
                onProgress: setProgress,
                signal: controller.signal,
              })
            ).url;
        onChange(url);
        setReplacing(false);
        setPreviewFailed(false);
      } catch (err) {
        if ((err as DOMException)?.name === "AbortError") return;
        setUploadError((err as Error)?.message || "上傳失敗，請重試。");
      } finally {
        abortRef.current = null;
        setUploading(false);
        setProgress(0);
      }
    },
    [entity, entityKey, kind, onChange, uploadFn],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      if (disabled || uploading) return;
      const file = e.dataTransfer.files?.[0];
      if (file) void doUpload(file);
    },
    [disabled, uploading, doUpload],
  );

  const handleDragOver = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      if (!disabled && !uploading) setDragging(true);
    },
    [disabled, uploading],
  );

  // ── 網址模式 ────────────────────────────────────────────
  const commitUrl = useCallback(
    (raw: string) => {
      const trimmed = raw.trim();
      setUrlDraft(trimmed);
      if (trimmed === "") {
        setUrlError("");
        if (hasValue) onChange("");
        return;
      }
      // Cloudinary、本站 Storage 網址（可貼別處已上傳的圖重複使用）、
      // 或呼叫端額外放行的來源（例如 Loom CDN）
      if (!isAllowedImageUrl(trimmed) && !allowUrl?.test(trimmed)) {
        setUrlError(
          `網址須為 ${CLOUDINARY_PREFIX} 開頭的 Cloudinary 圖片，或本站已上傳圖片的網址${allowUrl ? `（${allowUrl.hint}）` : ""}`,
        );
        return;
      }
      setUrlError("");
      setPreviewFailed(false);
      onChange(trimmed);
      setReplacing(false);
      // value 恆為空字串的呼叫端（如 ImageGallery 的新增面板）不會觸發
      // value-sync effect，草稿要在這裡清掉，避免再按一次 Enter 重複送出
      setUrlDraft("");
    },
    [hasValue, onChange, allowUrl],
  );

  const handleRemove = useCallback(() => {
    const removed = value;
    onChange("");
    setUrlDraft("");
    setUrlError("");
    setUploadError("");
    setReplacing(false);
    if (removed && onRemove) {
      void Promise.resolve(onRemove(removed)).catch(() => {
        /* 遠端清理失敗不影響前端已移除的狀態，由每日 cron 掃孤兒 */
      });
    }
  }, [value, onChange, onRemove]);

  const switchTab = useCallback(
    (next: Tab) => {
      setTab(next);
      setUploadError("");
      setUrlError("");
      if (hasValue) setReplacing(true);
    },
    [hasValue],
  );

  // ── 樣式尺寸 ────────────────────────────────────────────
  const pad = compact ? "p-3" : "p-5";
  const textSize = compact ? "text-[11px]" : "text-xs";
  const tabText = compact ? "text-[10px] px-2 py-1" : "text-xs px-3 py-1.5";

  const tabButton = (id: Tab, text: string) => {
    const active = tab === id;
    return (
      <button
        type="button"
        role="tab"
        aria-selected={active}
        aria-controls={`${fieldId}-pane`}
        disabled={disabled}
        onClick={() => switchTab(id)}
        data-tour={`image-input-tab-${id}`}
        className={`${tabText} rounded-md transition-colors disabled:opacity-50 ${
          active
            ? "bg-luxe-gold/20 text-luxe-gold"
            : "text-luxe-muted hover:text-luxe-gold hover:bg-luxe-gold/10"
        }`}
      >
        {text}
      </button>
    );
  };

  const visibleError = uploadError || urlError || error || "";

  return (
    /*
     * data-tour-* 是新手導覽的定位錨點（frontend/src/tours/）。
     * ImageInput 是全站共用元件，導覽用的選擇器一次寫在這裡，
     * 所有用到圖片欄位的頁面（課程、文章、影片、LP…）就都能導覽「雙模式上傳」。
     */
    <div className={`w-full ${className}`} data-tour="image-input">
      {/* ── 標題列 + 頁籤 ── */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
        {label && (
          <label htmlFor={`${fieldId}-url`} className={`${textSize} text-luxe-muted`}>
            {label}
            {required && <span className="ml-0.5 text-red-400">*</span>}
            {hint && <span className="ml-1 text-gray-500">（{hint}）</span>}
          </label>
        )}
        <div
          role="tablist"
          aria-label="圖片來源"
          data-tour="image-input-tabs"
          className="flex items-center gap-1 p-0.5 rounded-lg bg-luxe-surface border border-luxe-gold/10 ml-auto"
        >
          {tabButton("upload", "上傳圖片")}
          {tabButton("url", "Cloudinary 網址")}
        </div>
      </div>

      {/* ── 目前圖片預覽 ── */}
      {hasValue && (
        <div className="mb-2">
          <div
            className="relative w-full overflow-hidden rounded-lg border border-luxe-gold/20 bg-luxe-bg"
            style={{ aspectRatio: aspectHint }}
            onDragOver={handleDragOver}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
          >
            {previewFailed ? (
              <div className={`w-full h-full flex flex-col items-center justify-center gap-1 ${textSize} text-luxe-muted`}>
                <span>圖片無法載入</span>
                <span className="text-gray-500 break-all px-3 text-center">{value}</span>
              </div>
            ) : (
              <img
                src={value}
                alt={label ? `${label}預覽` : "圖片預覽"}
                className="w-full h-full object-cover"
                onError={() => setPreviewFailed(true)}
              />
            )}

            {(dragging || uploading) && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/60">
                {uploading ? (
                  <>
                    <Spinner />
                    <span className="text-[11px] text-white force-white">
                      上傳中 {progress > 0 ? `${progress}%` : ""}
                    </span>
                  </>
                ) : (
                  <span className="text-[11px] text-white force-white">放開以替換圖片</span>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 mt-1.5" data-tour="image-input-actions">
            <button
              type="button"
              disabled={disabled || uploading}
              onClick={() => setReplacing((r) => !r)}
              className={`${textSize} px-2.5 py-1 rounded-md border border-luxe-gold/20 text-luxe-muted hover:text-luxe-gold hover:border-luxe-gold/50 transition-colors disabled:opacity-50`}
            >
              {replacing ? "取消更換" : "更換"}
            </button>
            <button
              type="button"
              disabled={disabled || uploading}
              onClick={handleRemove}
              className={`${textSize} px-2.5 py-1 rounded-md border border-luxe-gold/10 text-luxe-muted hover:text-red-400 hover:border-red-500 transition-colors disabled:opacity-50`}
            >
              移除
            </button>
            <span className={`${textSize} text-gray-500 truncate ml-auto max-w-[45%]`} title={value}>
              {isCloudinaryUrl(value) ? "Cloudinary" : "已上傳"}
            </span>
          </div>
        </div>
      )}

      {/* ── 輸入區（未設定或按下「更換」時顯示） ── */}
      {showPane && (
        <div id={`${fieldId}-pane`} role="tabpanel">
          {tab === "upload" ? (
            <>
              <input
                ref={fileRef}
                type="file"
                accept={ACCEPT_ATTR}
                className="hidden"
                disabled={disabled}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  e.target.value = "";
                  if (file) void doUpload(file);
                }}
              />
              <button
                type="button"
                disabled={disabled || uploading}
                onClick={() => fileRef.current?.click()}
                data-tour="image-input-dropzone"
                onDragOver={handleDragOver}
                onDragLeave={() => setDragging(false)}
                onDrop={handleDrop}
                className={`w-full ${pad} flex flex-col items-center justify-center gap-1.5 rounded-lg border-2 border-dashed transition-colors disabled:opacity-60 disabled:cursor-wait ${
                  dragging
                    ? "border-luxe-gold bg-luxe-gold/10"
                    : "border-luxe-gold/20 hover:border-luxe-gold/50 hover:bg-luxe-gold/5"
                }`}
              >
                {uploading ? (
                  <>
                    <Spinner className={compact ? "w-4 h-4" : "w-5 h-5"} />
                    <span className={`${textSize} text-luxe-gold`}>
                      上傳中{progress > 0 ? ` ${progress}%` : "…"}
                    </span>
                    <span
                      className="w-full max-w-45 h-1 rounded-full bg-luxe-gold/10 overflow-hidden"
                      role="progressbar"
                      aria-valuenow={progress}
                      aria-valuemin={0}
                      aria-valuemax={100}
                    >
                      <span
                        className="block h-full bg-luxe-gold transition-all duration-200"
                        style={{ width: `${progress}%` }}
                      />
                    </span>
                  </>
                ) : (
                  <>
                    <UploadIcon className={`${compact ? "w-4 h-4" : "w-5 h-5"} text-luxe-gold`} />
                    <span className={`${textSize} text-luxe-muted`}>
                      拖曳圖片到這裡，或<span className="text-luxe-gold">點擊選擇檔案</span>
                    </span>
                    {!compact && (
                      <span className="text-[10px] text-gray-500">
                        JPG / PNG / WebP / GIF / AVIF，最大 5 MB，上傳後自動壓縮
                      </span>
                    )}
                  </>
                )}
              </button>
            </>
          ) : (
            <div className="flex gap-2" data-tour="image-input-url-row">
              <input
                id={`${fieldId}-url`}
                type="url"
                inputMode="url"
                value={urlDraft}
                disabled={disabled}
                placeholder={`${CLOUDINARY_PREFIX}image/upload/...`}
                onChange={(e) => {
                  const next = e.target.value;
                  setUrlDraft(next);
                  setUrlError(
                    next.trim() === "" ||
                      isAllowedImageUrl(next.trim()) ||
                      allowUrl?.test(next.trim())
                      ? ""
                      : `網址須為 ${CLOUDINARY_PREFIX} 開頭的 Cloudinary 圖片，或本站已上傳圖片的網址${allowUrl ? `（${allowUrl.hint}）` : ""}`,
                  );
                }}
                onBlur={(e) => commitUrl(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    commitUrl(urlDraft);
                  }
                }}
                className={`flex-1 min-w-0 px-3 py-2 rounded-lg bg-luxe-bg border outline-none ${textSize} text-luxe-text transition-colors ${
                  urlError
                    ? "border-red-500"
                    : "border-luxe-gold/20 focus:border-luxe-gold/50"
                }`}
              />
              <button
                type="button"
                disabled={disabled || !urlDraft.trim() || Boolean(urlError)}
                onClick={() => commitUrl(urlDraft)}
                className={`${textSize} px-3 py-2 rounded-lg bg-luxe-gold/15 hover:bg-luxe-gold/20 text-luxe-gold border border-luxe-gold/30 transition-colors whitespace-nowrap disabled:opacity-40`}
              >
                套用
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── 訊息區 ── */}
      {visibleError && (
        <p className={`${textSize} text-red-400 mt-1 whitespace-pre-line`}>{visibleError}</p>
      )}
      {!visibleError && valueInvalid && (
        <p className={`${textSize} text-red-400 mt-1`}>
          目前的網址不是允許的來源（可能是舊資料）。請改用上傳，或貼上 {CLOUDINARY_PREFIX} 開頭的網址。
        </p>
      )}
      {!visibleError && !valueInvalid && required && !hasValue && (
        <p className={`${textSize} text-gray-500 mt-1`}>此欄位為必填</p>
      )}
    </div>
  );
};

export default ImageInput;
