/**
 * TagInput 元件 - 標籤輸入
 * @module components/ui/form/TagInput
 * @description 支援輸入後按 Enter 新增標籤，可刪除標籤
 */

import React, { useState, KeyboardEvent, useRef } from "react";
import { useLanguage } from "@/context/LanguageContext";

/** 主題類型 */
type Theme = "abyss" | "prism" | "luxe";

interface TagInputProps {
  /** 當前標籤陣列 */
  tags: string[];
  /** 標籤變更回調 */
  onChange: (tags: string[]) => void;
  /** 佔位文字 */
  placeholder?: string;
  /** 主題 */
  theme?: Theme;
  /** 最大標籤數量 */
  maxTags?: number;
  /** 標籤驗證函數 */
  validate?: (tag: string) => boolean | string;
  /** 是否禁用 */
  disabled?: boolean;
  /** 自訂樣式 */
  className?: string;
  /** 標籤標題 */
  label?: string;
  /** 新手導覽定位錨點（tours/ 用 `[data-tour="..."]` 找元素） */
  "data-tour"?: string;
  /** 提示文字 */
  hint?: string;
}

/** 主題樣式配置 */
const themeStyles: Record<
  Theme,
  {
    container: string;
    input: string;
    tag: string;
    tagText: string;
    removeButton: string;
    label: string;
    hint: string;
  }
> = {
  abyss: {
    container:
      "bg-abyss-bg border-abyss-accent/30 focus-within:border-abyss-accent/60",
    input: "text-abyss-text placeholder-abyss-text/40",
    tag: "bg-abyss-accent/20 border-abyss-accent/40",
    tagText: "text-abyss-text",
    removeButton:
      "text-abyss-accent hover:text-abyss-text hover:bg-abyss-accent/40",
    label: "text-abyss-text",
    hint: "text-abyss-text/50",
  },
  prism: {
    container:
      "bg-prism-bg border-prism-accent/30 focus-within:border-prism-accent/60",
    input: "text-prism-text placeholder-prism-text/40",
    tag: "bg-prism-accent/20 border-prism-accent/40",
    tagText: "text-prism-text",
    removeButton:
      "text-prism-accent hover:text-prism-text hover:bg-prism-accent/40",
    label: "text-prism-text",
    hint: "text-prism-text/50",
  },
  luxe: {
    container:
      "bg-luxe-bg border-luxe-gold/30 focus-within:border-luxe-gold/60",
    input: "text-luxe-text placeholder-luxe-muted/50",
    tag: "bg-luxe-gold/20 border-luxe-gold/40",
    tagText: "text-luxe-text",
    removeButton: "text-luxe-gold hover:text-luxe-text hover:bg-luxe-gold/40",
    label: "text-luxe-text",
    hint: "text-luxe-muted",
  },
};

/**
 * TagInput - 標籤輸入元件
 *
 * @param {TagInputProps} props - 元件屬性
 * @returns {JSX.Element} 標籤輸入元件
 *
 * @example
 * ```tsx
 * const [tags, setTags] = useState<string[]>([]);
 *
 * <TagInput
 *   tags={tags}
 *   onChange={setTags}
 *   placeholder="輸入標籤後按 Enter"
 *   theme="luxe"
 *   maxTags={5}
 * />
 * ```
 */
const TagInput: React.FC<TagInputProps> = ({
  tags,
  onChange,
  placeholder,
  theme = "luxe",
  maxTags = 10,
  validate,
  disabled = false,
  className = "",
  label,
  hint,
  "data-tour": dataTour,
}) => {
  const { t } = useLanguage();
  const [inputValue, setInputValue] = useState("");
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const styles = themeStyles[theme];

  /**
   * 處理按鍵事件
   */
  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addTag();
    } else if (e.key === "Backspace" && !inputValue && tags.length > 0) {
      // 當輸入框為空且按下 Backspace 時，刪除最後一個標籤
      removeTag(tags.length - 1);
    }
  };

  /**
   * 新增標籤
   */
  const addTag = () => {
    const trimmedValue = inputValue.trim();

    if (!trimmedValue) {
      return;
    }

    // 檢查重複
    if (tags.includes(trimmedValue)) {
      setError(t.formUi.tagExists);
      return;
    }

    // 檢查數量上限
    if (tags.length >= maxTags) {
      setError(t.formUi.tagMax.replace("{max}", String(maxTags)));
      return;
    }

    // 自訂驗證
    if (validate) {
      const validationResult = validate(trimmedValue);
      if (validationResult !== true) {
        setError(
          typeof validationResult === "string"
            ? validationResult
            : t.formUi.tagInvalid,
        );
        return;
      }
    }

    // 新增標籤
    onChange([...tags, trimmedValue]);
    setInputValue("");
    setError("");
  };

  /**
   * 移除標籤
   */
  const removeTag = (index: number) => {
    if (disabled) return;
    const newTags = tags.filter((_, i) => i !== index);
    onChange(newTags);
    setError("");
  };

  /**
   * 點擊容器時聚焦輸入框
   */
  const handleContainerClick = () => {
    inputRef.current?.focus();
  };

  return (
    <div className={className} data-tour={dataTour}>
      {/* 標籤 */}
      {label && (
        <label className={`block text-sm font-medium mb-2 ${styles.label}`}>
          {label}
        </label>
      )}

      {/* 輸入容器 */}
      <div
        onClick={handleContainerClick}
        className={`
          min-h-[48px]
          px-3
          py-2
          border
          rounded-lg
          cursor-text
          transition-colors
          duration-200
          ${styles.container}
          ${disabled ? "opacity-50 cursor-not-allowed" : ""}
        `}
      >
        <div className="flex flex-wrap gap-2 items-center">
          {/* 已新增的標籤 */}
          {tags.map((tag, index) => (
            <span
              key={`${tag}-${index}`}
              className={`
                inline-flex
                items-center
                gap-1
                px-2.5
                py-1
                text-sm
                border
                rounded-full
                transition-all
                duration-200
                ${styles.tag}
                ${styles.tagText}
              `}
            >
              {tag}
              {!disabled && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeTag(index);
                  }}
                  className={`
                    w-4
                    h-4
                    flex
                    items-center
                    justify-center
                    rounded-full
                    transition-colors
                    duration-200
                    ${styles.removeButton}
                  `}
                  aria-label={t.formUi.removeTag.replace("{tag}", tag)}
                >
                  <svg
                    className="w-3 h-3"
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
              )}
            </span>
          ))}

          {/* 輸入框 */}
          {tags.length < maxTags && (
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => {
                setInputValue(e.target.value);
                setError("");
              }}
              onKeyDown={handleKeyDown}
              onBlur={addTag}
              placeholder={
                tags.length === 0
                  ? (placeholder ?? t.formUi.tagInputPlaceholder)
                  : ""
              }
              disabled={disabled}
              className={`
                flex-1
                min-w-[120px]
                bg-transparent
                outline-none
                text-sm
                ${styles.input}
                ${disabled ? "cursor-not-allowed" : ""}
              `}
            />
          )}
        </div>
      </div>

      {/* 錯誤訊息 */}
      {error && <p className="mt-1 text-sm text-red-400">{error}</p>}

      {/* 提示文字 */}
      {hint && !error && (
        <p className={`mt-1 text-xs ${styles.hint}`}>{hint}</p>
      )}

      {/* 標籤數量提示 */}
      {tags.length > 0 && (
        <p className={`mt-1 text-xs ${styles.hint}`}>
          {t.formUi.tagCount
            .replace("{count}", String(tags.length))
            .replace("{max}", String(maxTags))}
        </p>
      )}
    </div>
  );
};

export default TagInput;
