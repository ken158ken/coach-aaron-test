/**
 * 文章預覽 Modal
 * @module components/admin/ArticlePreviewModal
 * @description 發布前預覽文章，使用與文章詳情頁相同的樣式
 */

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";

interface ArticlePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  article: {
    title: string;
    slug: string;
    excerpt: string;
    category: string;
    tags: string[];
    coverImage: string;
    content: string;
    status: "draft" | "published";
  };
  isSubmitting?: boolean;
}

/**
 * 文章預覽 Modal - 顯示文章預覽並確認發布
 */
const ArticlePreviewModal: React.FC<ArticlePreviewModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  article,
  isSubmitting = false,
}) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen && typeof document !== "undefined") {
      document.body.style.overflow = "hidden";
    }
    return () => {
      if (typeof document !== "undefined") {
        document.body.style.overflow = "";
      }
    };
  }, [isOpen]);

  // 只在客戶端掛載後才渲染，避免 SSR 水合問題
  if (!isOpen || !mounted || typeof document === "undefined") return null;

  const modalContent = (
    <div className="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto bg-black/80 backdrop-blur-sm">
      {/* 背景點擊關閉 */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Modal 內容 */}
      <div className="relative w-full max-w-4xl my-8 mx-4 bg-luxe-bg rounded-xl border border-luxe-gold/30 shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 bg-luxe-black border-b border-luxe-gold/20 rounded-t-xl">
          <div className="flex items-center gap-3">
            <span className="text-2xl">👁️</span>
            <div>
              <h2 className="text-lg font-medium text-luxe-text">預覽文章</h2>
              <p className="text-xs text-gray-400">確認排版後再發布</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-luxe-gold/10 text-gray-400 hover:text-white transition-colors"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* 預覽內容 - 使用與 ArticleDetail 相同的樣式 */}
        <div className="min-h-screen bg-luxe-bg">
          {/* Article Header */}
          <div className="bg-luxe-surface border-b border-luxe-gold/10 py-12 px-6">
            {/* Meta */}
            <div className="flex items-center gap-3 mb-4">
              {article.category && (
                <span className="text-luxe-gold text-sm">
                  {article.category}
                </span>
              )}
              <span className="text-luxe-muted text-sm">
                {article.status === "published" ? "已發布" : "草稿"}
              </span>
            </div>

            {/* Title */}
            <h1 className="text-4xl font-light text-luxe-text mb-6">
              {article.title || "未輸入標題"}
            </h1>

            {/* Article Info */}
            <div className="flex flex-wrap items-center gap-6 text-luxe-muted text-sm">
              <span>網址：/articles/{article.slug || "未設定"}</span>
              <span>預覽時間：{new Date().toLocaleString()}</span>
            </div>

            {/* Excerpt */}
            {article.excerpt && (
              <p className="mt-4 text-luxe-text/60 text-lg italic">
                {article.excerpt}
              </p>
            )}
          </div>

          {/* Article Content */}
          <div className="px-6 py-12">
            <div className="max-w-3xl mx-auto">
              {/* Thumbnail */}
              {article.coverImage && (
                <div className="mb-8 rounded-lg overflow-hidden">
                  <img
                    src={article.coverImage}
                    alt={article.title}
                    className="w-full"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = "none";
                    }}
                  />
                </div>
              )}

              {/* Content - 使用 dangerouslySetInnerHTML */}
              <div
                className="prose prose-invert prose-lg max-w-none text-luxe-text/80"
                dangerouslySetInnerHTML={{
                  __html:
                    article.content ||
                    "<p class='text-gray-500'>文章內容尚未撰寫</p>",
                }}
              />

              {/* Tags */}
              {article.tags && article.tags.length > 0 && (
                <div className="mt-8 pt-8 border-t border-luxe-gold/10">
                  <div className="flex flex-wrap gap-2">
                    {article.tags.map((tag, idx) => (
                      <span
                        key={idx}
                        className="px-3 py-1 bg-luxe-gold/10 text-luxe-gold text-sm rounded-full"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="sticky bottom-0 flex items-center justify-between px-6 py-4 bg-luxe-black border-t border-luxe-gold/20 rounded-b-xl">
          <div className="text-sm text-gray-400">
            {!article.title && (
              <span className="text-amber-400">⚠️ 請輸入標題</span>
            )}
            {!article.content && (
              <span className="text-amber-400 ml-2">⚠️ 請輸入內容</span>
            )}
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-6 py-2.5 text-sm bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
            >
              繼續編輯
            </button>
            <button
              onClick={onConfirm}
              disabled={isSubmitting || !article.title || !article.content}
              className="px-6 py-2.5 text-sm bg-luxe-gold text-black hover:bg-luxe-gold/90 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isSubmitting ? "發布中..." : "確認發布"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  // 使用 Portal 渲染到 body
  return createPortal(modalContent, document.body);
};

export default ArticlePreviewModal;
