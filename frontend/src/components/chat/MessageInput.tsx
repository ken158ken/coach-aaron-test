/**
 * MessageInput — 訊息輸入區（含選圖 + 預覽 + 送出）
 * @module components/chat/MessageInput
 */

import React, { useRef, useState } from "react";
import { PillButton } from "@/components/ui";

interface MessageInputProps {
  onSend: (data: { content: string; image: File | null }) => Promise<void>;
  disabled?: boolean;
}

const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED_MIMES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

const MessageInput: React.FC<MessageInputProps> = ({ onSend, disabled }) => {
  const [content, setContent] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const pickImage = (file: File | null) => {
    setError("");
    if (!file) {
      setImage(null);
      setPreview(null);
      return;
    }
    if (!ALLOWED_MIMES.includes(file.type)) {
      setError("僅支援 jpg/png/webp/gif");
      return;
    }
    if (file.size > MAX_BYTES) {
      setError("圖片不可超過 5 MB");
      return;
    }
    setImage(file);
    setPreview(URL.createObjectURL(file));
  };

  const handleSend = async () => {
    const trimmed = content.trim();
    if (!trimmed && !image) return;

    // 立刻清空輸入欄（樂觀 UX）— 失敗時再還原
    const sentImage = image;
    const sentPreview = preview;
    setContent("");
    setImage(null);
    setPreview(null);
    if (fileRef.current) fileRef.current.value = "";
    setError("");
    setSending(true);

    try {
      await onSend({ content: trimmed, image: sentImage });
      // 成功 — 釋放預覽用的 blob URL（傳給 MessageThread 的 tempMsg 用了同一個）
      if (sentPreview) URL.revokeObjectURL(sentPreview);
    } catch (err) {
      console.error(err);
      // 失敗 → 還原內容讓用戶重發
      setContent(trimmed);
      if (sentImage) {
        setImage(sentImage);
        setPreview(sentPreview);
      }
      setError(err instanceof Error ? err.message : "送出失敗，已還原內容");
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="border-t border-gold/15 bg-surface px-4 py-3">
      {error && (
        <div className="mb-2 text-xs text-red-400">{error}</div>
      )}
      {preview && (
        <div className="relative inline-block mb-2">
          <img
            src={preview}
            alt="預覽"
            className="max-h-32 rounded-lg border border-gold/20"
          />
          <button
            onClick={() => pickImage(null)}
            className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-black/70 text-white text-xs flex items-center justify-center hover:bg-black"
            aria-label="移除圖片"
          >
            ✕
          </button>
        </div>
      )}
      <div className="flex items-end gap-2">
        <button
          onClick={() => fileRef.current?.click()}
          disabled={disabled || sending}
          className="p-2 rounded-lg text-muted hover:text-gold hover:bg-gold/10 transition-colors shrink-0 disabled:opacity-50"
          title="附加圖片"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          className="hidden"
          onChange={(e) => pickImage(e.target.files?.[0] || null)}
        />
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="輸入訊息... (Enter 送出 / Shift+Enter 換行)"
          rows={1}
          disabled={disabled || sending}
          className="studio-input flex-1 px-3 py-2 rounded-lg resize-none max-h-32 text-sm"
        />
        <PillButton
          theme="luxe"
          variant="filled"
          onClick={handleSend}
          disabled={disabled || sending || (!content.trim() && !image)}
        >
          {sending ? "..." : "送出"}
        </PillButton>
      </div>
    </div>
  );
};

export default MessageInput;
