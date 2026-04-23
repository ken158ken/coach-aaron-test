/**
 * useSiteContent - 首頁區塊共用內容讀取 Hook
 *
 * 封裝 `contentService.getPublicContent()` 的呼叫與快取，
 * 讓各 section 元件能以極短程式碼讀取 DB 的 content_key 文案，
 * 並對空值、JSON 解析錯誤提供 fallback。
 *
 * 設計原則：
 *   - Single Responsibility：本 hook 只負責「把 site_content 轉成易用的 getter」
 *   - SSR-safe：初始值必須是確定的字串（由呼叫端提供 fallback）
 *   - 靜默失敗：DB 不可達時不中斷首頁渲染，讓 fallback 值接管
 *
 * @module hooks/useSiteContent
 */

import { useEffect, useState } from 'react';
import { contentService } from '@/services/content.service';

/** 模組層級快取：避免每個 section 元件各自打一次 API */
let cache: Record<string, string> | null = null;
let inflight: Promise<Record<string, string>> | null = null;

/** 取得並快取全站內容 map（僅首次會發出請求） */
const loadContent = (): Promise<Record<string, string>> => {
  if (cache) return Promise.resolve(cache);
  if (inflight) return inflight;
  inflight = contentService
    .getPublicContent()
    .then((data) => {
      cache = data || {};
      return cache;
    })
    .catch((err) => {
      console.warn('[useSiteContent] 載入網站內容失敗（fallback 接管）', err);
      cache = {};
      return cache;
    })
    .finally(() => {
      inflight = null;
    });
  return inflight;
};

/** useSiteContent 回傳型別 */
export interface UseSiteContentResult {
  /** 原始 key-value map（未載入前為空物件） */
  content: Record<string, string>;
  /** 是否正在載入 */
  loading: boolean;
  /**
   * 安全讀值：回傳字串，若 key 不存在或值為空則回 fallback
   */
  get: (key: string, fallback: string) => string;
  /**
   * 以 JSON 解析取得陣列值；解析失敗或非陣列則回 fallback
   */
  getArray: <T = unknown>(key: string, fallback: T[]) => T[];
}

/**
 * 讀取 site_content（公開只讀）
 *
 * 使用範例：
 * ```tsx
 * const { get, getArray } = useSiteContent();
 * const title = get("podcast_title", "深海電台");
 * const words = getArray<string>("hero_flip_words", ["體態", "自信"]);
 * ```
 *
 * @returns 內容存取工具
 */
export function useSiteContent(): UseSiteContentResult {
  const [content, setContent] = useState<Record<string, string>>(
    () => cache ?? {}
  );
  const [loading, setLoading] = useState<boolean>(!cache);

  useEffect(() => {
    let cancelled = false;
    loadContent().then((data) => {
      if (!cancelled) {
        setContent(data);
        setLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const get = (key: string, fallback: string): string => {
    const val = content[key];
    return typeof val === 'string' && val.trim() !== '' ? val : fallback;
  };

  const getArray = <T = unknown>(key: string, fallback: T[]): T[] => {
    const raw = content[key];
    if (!raw) return fallback;
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed as T[];
      return fallback;
    } catch {
      console.warn(`[useSiteContent] 解析 ${key} JSON 失敗，使用 fallback`);
      return fallback;
    }
  };

  return { content, loading, get, getArray };
}

/**
 * 清除模組層級快取（測試或 admin 改值後強制刷新時使用）
 */
export function clearSiteContentCache(): void {
  cache = null;
  inflight = null;
}
