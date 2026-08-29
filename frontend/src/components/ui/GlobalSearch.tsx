/**
 * 全域搜尋元件
 * @module components/ui/GlobalSearch
 * @description 搜尋課程、文章、評論等全站內容
 */

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { createPortal } from "react-dom";
import { useLanguage } from "@/context/LanguageContext";

// 搜尋結果類型
interface SearchResult {
  id: string | number;
  type: "course" | "article" | "comment" | "review";
  title: string;
  description?: string;
  thumbnail?: string;
  url: string;
  highlight?: string;
}

interface GlobalSearchProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * 全域搜尋元件
 */
export const GlobalSearch: React.FC<GlobalSearchProps> = ({
  isOpen,
  onClose,
}) => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [mounted, setMounted] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // 搜尋 API
  const performSearch = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([]);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(
        `/api/search?q=${encodeURIComponent(searchQuery)}`,
      );
      if (response.ok) {
        const data = await response.json();
        setResults(data.results || []);
      } else {
        setResults([]);
      }
    } catch (error) {
      console.error("Search error:", error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Debounced 搜尋
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (query.trim()) {
      searchTimeoutRef.current = setTimeout(() => {
        performSearch(query);
      }, 300);
    } else {
      setResults([]);
    }

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [query, performSearch]);

  // 開啟時聚焦輸入框
  useEffect(() => {
    if (isOpen) {
      setQuery("");
      setResults([]);
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 100);
      if (typeof document !== "undefined") {
        document.body.style.overflow = "hidden";
      }
    } else {
      if (typeof document !== "undefined") {
        document.body.style.overflow = "";
      }
    }
    return () => {
      if (typeof document !== "undefined") {
        document.body.style.overflow = "";
      }
    };
  }, [isOpen]);

  // 鍵盤導航
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      onClose();
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => Math.min(prev + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => Math.max(prev - 1, 0));
    } else if (e.key === "Enter" && results[selectedIndex]) {
      handleSelect(results[selectedIndex]);
    }
  };

  // 選擇結果
  const handleSelect = (result: SearchResult) => {
    navigate(result.url);
    onClose();
  };

  // 類型圖示
  const getTypeIcon = (type: SearchResult["type"]) => {
    switch (type) {
      case "course":
        return "📚";
      case "article":
        return "📝";
      case "comment":
        return "💬";
      case "review":
        return "⭐";
      default:
        return "📄";
    }
  };

  // 類型標籤
  const getTypeLabel = (type: SearchResult["type"]) => {
    switch (type) {
      case "course":
        return t.course.title;
      case "article":
        return t.article.title;
      case "comment":
        return t.globalSearch.typeComment;
      case "review":
        return t.globalSearch.typeReview;
      default:
        return "";
    }
  };

  // 只在客戶端掛載後才渲染，避免 SSR 水合問題
  if (!isOpen || !mounted || typeof document === "undefined") return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-start justify-center pt-[10vh] bg-black/80 backdrop-blur-md"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl mx-4 bg-luxe-surface border border-luxe-gold/30 rounded-2xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 搜尋輸入框 */}
        <div className="flex items-center gap-4 px-6 py-4 border-b border-luxe-gold/20">
          <svg
            className="w-6 h-6 text-luxe-gold flex-shrink-0"
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
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={t.globalSearch.placeholder}
            className="flex-1 bg-transparent border-none outline-none text-lg text-luxe-text placeholder:text-gray-500"
          />
          {loading && (
            <div className="w-5 h-5 border-2 border-luxe-gold/30 border-t-luxe-gold rounded-full animate-spin" />
          )}
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <kbd className="px-2 py-1 text-xs bg-luxe-bg rounded border border-luxe-gold/20">
              ESC
            </kbd>
          </button>
        </div>

        {/* 搜尋結果 */}
        <div className="max-h-[60vh] overflow-y-auto">
          {query.trim() === "" ? (
            // 提示文字
            <div className="px-6 py-12 text-center text-gray-500">
              <p className="text-lg mb-2">{t.globalSearch.promptTitle}</p>
              <p className="text-sm">{t.globalSearch.promptHint}</p>
            </div>
          ) : loading ? (
            // 載入中
            <div className="px-6 py-12 text-center text-gray-500">
              <div className="w-8 h-8 mx-auto border-2 border-luxe-gold/30 border-t-luxe-gold rounded-full animate-spin mb-4" />
              <p>{t.chatUi.searching}</p>
            </div>
          ) : results.length === 0 ? (
            // 無結果
            <div className="px-6 py-12 text-center text-gray-500">
              <p className="text-4xl mb-4">🔍</p>
              <p className="text-lg mb-2">{t.globalSearch.noResults}</p>
              <p className="text-sm">{t.globalSearch.noResultsHint}</p>
            </div>
          ) : (
            // 結果列表
            <div className="py-2">
              {results.map((result, index) => (
                <button
                  key={`${result.type}-${result.id}`}
                  type="button"
                  onClick={() => handleSelect(result)}
                  onMouseEnter={() => setSelectedIndex(index)}
                  className={`w-full px-6 py-3 flex items-start gap-4 text-left transition-colors ${
                    index === selectedIndex
                      ? "bg-luxe-gold/10"
                      : "hover:bg-luxe-gold/5"
                  }`}
                >
                  {/* 縮圖或圖示 */}
                  <div className="w-12 h-12 flex-shrink-0 rounded-lg bg-luxe-bg flex items-center justify-center overflow-hidden">
                    {result.thumbnail ? (
                      <img
                        src={result.thumbnail}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-2xl">
                        {getTypeIcon(result.type)}
                      </span>
                    )}
                  </div>

                  {/* 內容 */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="px-2 py-0.5 text-xs bg-luxe-gold/20 text-luxe-gold rounded">
                        {getTypeLabel(result.type)}
                      </span>
                    </div>
                    <h4 className="font-medium text-luxe-text truncate">
                      {result.title}
                    </h4>
                    {result.description && (
                      <p className="text-sm text-gray-400 truncate">
                        {result.description}
                      </p>
                    )}
                    {result.highlight && (
                      <p
                        className="text-sm text-gray-500 mt-1"
                        dangerouslySetInnerHTML={{ __html: result.highlight }}
                      />
                    )}
                  </div>

                  {/* 箭頭 */}
                  {index === selectedIndex && (
                    <svg
                      className="w-5 h-5 text-luxe-gold flex-shrink-0 self-center"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* 快捷鍵提示 */}
        <div className="px-6 py-3 border-t border-luxe-gold/20 bg-luxe-black/50 flex items-center gap-6 text-xs text-gray-500">
          <span className="flex items-center gap-2">
            <kbd className="px-1.5 py-0.5 bg-luxe-bg rounded border border-luxe-gold/20">
              ↑
            </kbd>
            <kbd className="px-1.5 py-0.5 bg-luxe-bg rounded border border-luxe-gold/20">
              ↓
            </kbd>
            <span>{t.globalSearch.hintNavigate}</span>
          </span>
          <span className="flex items-center gap-2">
            <kbd className="px-1.5 py-0.5 bg-luxe-bg rounded border border-luxe-gold/20">
              Enter
            </kbd>
            <span>{t.globalSearch.hintSelect}</span>
          </span>
          <span className="flex items-center gap-2">
            <kbd className="px-1.5 py-0.5 bg-luxe-bg rounded border border-luxe-gold/20">
              ESC
            </kbd>
            <span>{t.chatUi.close}</span>
          </span>
        </div>
      </div>
    </div>,
    document.body,
  );
};

/**
 * 搜尋按鈕元件（用於 Navbar）
 */
export const SearchButton: React.FC<{ onClick: () => void }> = ({
  onClick,
}) => {
  const { t } = useLanguage();
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-400 hover:text-luxe-gold border border-white/20 hover:border-luxe-gold/50 rounded-lg transition-all"
      title={t.globalSearch.triggerTitle}
    >
      <svg
        className="w-4 h-4"
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
      <span className="hidden sm:inline">{t.common.search}</span>
      <kbd className="hidden md:inline px-1.5 py-0.5 text-xs bg-luxe-bg/50 rounded border border-white/10">
        ⌘K
      </kbd>
    </button>
  );
};

export default GlobalSearch;
