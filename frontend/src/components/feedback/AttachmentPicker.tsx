/**
 * 反饋附圖選擇器（支援貼上剪貼簿截圖 + 拖放 + 檔案選擇）
 * @module components/feedback/AttachmentPicker
 *
 * 受控元件：files 由父層持有。做前端驗證（mime / 大小 / 張數），
 * 真正上傳交給送出時的 multipart。預覽用本地 File 的 object URL。
 */

import React, { useCallback, useEffect, useRef, useState } from "react";

const ACCEPT = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const MAX_SIZE = 10 * 1024 * 1024; // 10MB

export interface AttachmentLabels {
  /** 拖放區主字（例：拖放或點擊上傳、可貼上截圖）*/
  dropHint: string;
  /** 「還能加 N 張」*/
  remaining: string; // 內含 {n}
  /** 超過張數 */
  tooMany: string; // 內含 {n}
  /** 檔案過大 */
  tooLarge: string;
  /** 格式不支援 */
  badType: string;
  /** 移除圖片 aria */
  removeAria: string;
}

interface Props {
  files: File[];
  onChange: (files: File[]) => void;
  max?: number;
  disabled?: boolean;
  theme?: "studio" | "luxe";
  labels: AttachmentLabels;
  /** 是否監聽全域 paste（開啟的 modal / 聚焦的輸入列設 true）*/
  listenPaste?: boolean;
}

const AttachmentPicker: React.FC<Props> = ({
  files,
  onChange,
  max = 6,
  disabled = false,
  theme = "studio",
  labels,
  listenPaste = true,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState("");
  const [previews, setPreviews] = useState<string[]>([]);

  // 為每個 File 建/收 object URL 預覽
  useEffect(() => {
    const urls = files.map((f) => URL.createObjectURL(f));
    setPreviews(urls);
    return () => urls.forEach((u) => URL.revokeObjectURL(u));
  }, [files]);

  const addFiles = useCallback(
    (incoming: File[]) => {
      setError("");
      const imgs = incoming.filter((f) => f.type.startsWith("image/"));
      if (imgs.length === 0) return;

      const valid: File[] = [];
      for (const f of imgs) {
        if (!ACCEPT.includes(f.type)) {
          setError(labels.badType);
          continue;
        }
        if (f.size > MAX_SIZE) {
          setError(labels.tooLarge);
          continue;
        }
        valid.push(f);
      }
      if (valid.length === 0) return;

      const room = max - files.length;
      if (room <= 0) {
        setError(labels.tooMany.replace("{n}", String(max)));
        return;
      }
      if (valid.length > room) {
        setError(labels.tooMany.replace("{n}", String(max)));
      }
      onChange([...files, ...valid.slice(0, room)]);
    },
    [files, max, onChange, labels],
  );

  // 全域貼上（剪貼簿截圖）
  useEffect(() => {
    if (!listenPaste || disabled) return;
    const onPaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      const pasted: File[] = [];
      for (const item of Array.from(items)) {
        if (item.kind === "file") {
          const f = item.getAsFile();
          if (f && f.type.startsWith("image/")) pasted.push(f);
        }
      }
      if (pasted.length) {
        e.preventDefault();
        addFiles(pasted);
      }
    };
    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
  }, [listenPaste, disabled, addFiles]);

  const remove = (idx: number) => {
    onChange(files.filter((_, i) => i !== idx));
    setError("");
  };

  const border = theme === "luxe" ? "border-luxe-gold/20" : "border-gold/25";
  const borderActive = theme === "luxe" ? "border-luxe-gold/60 bg-luxe-gold/5" : "border-gold/60 bg-gold/5";
  const muted = theme === "luxe" ? "text-luxe-muted" : "text-muted";

  const canAdd = files.length < max && !disabled;

  return (
    <div>
      <div
        onDragOver={(e) => {
          if (!canAdd) return;
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          if (!canAdd) return;
          addFiles(Array.from(e.dataTransfer.files || []));
        }}
        onClick={() => canAdd && inputRef.current?.click()}
        role="button"
        tabIndex={canAdd ? 0 : -1}
        onKeyDown={(e) => {
          if ((e.key === "Enter" || e.key === " ") && canAdd) {
            e.preventDefault();
            inputRef.current?.click();
          }
        }}
        className={`rounded-lg border border-dashed ${
          dragOver ? borderActive : border
        } px-4 py-3 text-center text-xs ${muted} transition-colors ${
          canAdd ? "cursor-pointer hover:opacity-80" : "opacity-50 cursor-not-allowed"
        }`}
      >
        <span className="mr-1">📎</span>
        {labels.dropHint}
        <span className="block mt-0.5 opacity-70">
          {labels.remaining.replace("{n}", String(Math.max(0, max - files.length)))}
        </span>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT.join(",")}
        multiple
        className="hidden"
        onChange={(e) => {
          addFiles(Array.from(e.target.files || []));
          e.target.value = "";
        }}
      />

      {error && (
        <p className="mt-2 text-xs text-red-500">{error}</p>
      )}

      {previews.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {previews.map((src, i) => (
            <div
              key={i}
              className={`relative w-16 h-16 rounded-lg overflow-hidden border ${border}`}
            >
              <img src={src} alt="" className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  remove(i);
                }}
                aria-label={labels.removeAria}
                className="absolute top-0.5 right-0.5 w-5 h-5 rounded-full bg-black/60 text-white text-xs flex items-center justify-center hover:bg-black/80"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AttachmentPicker;
