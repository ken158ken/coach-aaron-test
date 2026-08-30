/**
 * 反饋圖片元件（私有 bucket → blob 讀取）
 * @module components/feedback/FeedbackImage
 *
 * 圖片走 GET /api/feedback/images/:id/file（需授權），因此不能直接放進 <img src>
 * （<img> 不會帶 Authorization header、跨網域也不一定帶 cookie）。
 * 這裡統一以 axios 取 blob → createObjectURL，兩種認證方式都通。
 *
 * 提供：
 *   - useFeedbackImage(id)：回傳 { url, loading, failed }
 *   - FeedbackImageThumb：卡片 / 氣泡裡的縮圖（點擊開 lightbox）
 *   - FeedbackLightbox：Modal 全圖檢視（原檔，可清晰看截圖）
 */

import React, { useEffect, useRef, useState } from "react";
import { Modal } from "@/components/ui";
import { feedbackService } from "@/services/feedback/feedback.service";

/** 讀取單張反饋圖片為 object URL；卸載時自動 revoke */
export function useFeedbackImage(imageId: string | null): {
  url: string | null;
  loading: boolean;
  failed: boolean;
} {
  const [url, setUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);
  const objectUrlRef = useRef<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    // 清掉上一張
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
    setUrl(null);
    setFailed(false);

    if (!imageId) return;

    setLoading(true);
    feedbackService
      .fetchImageBlob(imageId)
      .then((blob) => {
        if (cancelled) return;
        const objUrl = URL.createObjectURL(blob);
        objectUrlRef.current = objUrl;
        setUrl(objUrl);
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
        objectUrlRef.current = null;
      }
    };
  }, [imageId]);

  return { url, loading, failed };
}

interface ThumbProps {
  imageId: string;
  alt?: string;
  onClick?: () => void;
  /** 縮圖尺寸 class（預設方形小圖）*/
  className?: string;
  /** 主題（決定骨架/邊框色）*/
  theme?: "studio" | "luxe";
}

/** 縮圖：載入中顯示骨架，失敗顯示破圖佔位 */
export const FeedbackImageThumb: React.FC<ThumbProps> = ({
  imageId,
  alt = "",
  onClick,
  className = "w-20 h-20",
  theme = "studio",
}) => {
  const { url, loading, failed } = useFeedbackImage(imageId);
  const border = theme === "luxe" ? "border-luxe-gold/15" : "border-gold/15";
  const skeleton = theme === "luxe" ? "bg-luxe-bg/60" : "bg-black/5 dark:bg-white/5";

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!url}
      className={`relative overflow-hidden rounded-lg border ${border} ${skeleton} ${className} shrink-0 group focus:outline-none focus:ring-2 focus:ring-gold/40`}
      aria-label={alt || "查看圖片 / view image"}
    >
      {url ? (
        <img
          src={url}
          alt={alt}
          loading="lazy"
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
      ) : loading ? (
        <span className="absolute inset-0 flex items-center justify-center">
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-current/20 border-t-current/60 opacity-40" />
        </span>
      ) : failed ? (
        <span className="absolute inset-0 flex items-center justify-center text-lg opacity-40">
          🖼️
        </span>
      ) : null}
    </button>
  );
};

interface LightboxProps {
  imageId: string | null;
  onClose: () => void;
  fileName?: string;
}

/** Modal 全圖檢視（原檔） */
export const FeedbackLightbox: React.FC<LightboxProps> = ({
  imageId,
  onClose,
  fileName,
}) => {
  const { url, loading, failed } = useFeedbackImage(imageId);
  return (
    <Modal isOpen={!!imageId} onClose={onClose} size="2xl" title={fileName}>
      <div className="flex items-center justify-center min-h-[200px]">
        {loading ? (
          <span className="h-8 w-8 animate-spin rounded-full border-2 border-current/20 border-t-current/60 opacity-50" />
        ) : failed ? (
          <p className="text-sm opacity-60 py-12">🖼️</p>
        ) : url ? (
          <img
            src={url}
            alt={fileName || ""}
            className="max-w-full max-h-[70vh] object-contain rounded-lg"
          />
        ) : null}
      </div>
    </Modal>
  );
};
