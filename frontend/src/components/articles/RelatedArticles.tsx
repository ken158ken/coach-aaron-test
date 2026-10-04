/**
 * 相關文章（延伸閱讀）
 * @module components/articles/RelatedArticles
 *
 * @description
 * 推薦順序（AEO 內部連結用，讓同主題文章互相引流、也讓爬蟲看懂主題叢集）：
 *   1. `related_article_ids` 手動指定（後台可排序，優先度最高）
 *   2. 不足 3 篇 → 自動補：同分類優先 → `article_keywords` 逗號分詞交集數
 *      → 瀏覽數，最多補到 `max`（預設 4 篇）
 *   3. 一律排除自己
 *
 * 候選池來源有兩條路，都要能用：
 *   ● 文章頁：ArticleDetail 已經抓過 `/api/articles?limit=12`（SSR 預抓 key
 *     `articles:popular`），直接把那份清單用 `pool` 傳進來 → **SSR 就有輸出**。
 *   ● 課程頁：沒有 SSR 清單，本元件在 client 端自己抓 `/api/articles?limit=50`。
 *     （SSR 時 pool 為空 → 回傳 null，client 抓完才出現，不會 hydration mismatch：
 *      伺服器與客戶端「首次」render 都是 null。）
 *
 * `related_article_ids` 指到候選池裡沒有的文章時，會在 client 端用
 * `/api/articles/:id` 逐篇補抓（`requestedRef` 去重，避免無限迴圈）。
 */

import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { articleService } from "@/services/content/article.service";
import { useLanguage } from "@/context/LanguageContext";
import { useLocalize } from "@/hooks/useLocalize";
import type { Article } from "@/types";

/** 逗號分隔關鍵字 → 去空白小寫陣列 */
function parseKeywords(raw?: string | null): string[] {
  if (!raw || typeof raw !== "string") return [];
  return raw
    .split(",")
    .map((k) => k.trim().toLowerCase())
    .filter(Boolean);
}

/** 兩組關鍵字的交集數 */
function overlapCount(a: string[], b: string[]): number {
  if (a.length === 0 || b.length === 0) return 0;
  const setB = new Set(b);
  return a.reduce((n, k) => (setB.has(k) ? n + 1 : n), 0);
}

/** 依 article_id 去重（保留先出現的） */
function dedupe(list: Article[]): Article[] {
  const seen = new Set<number>();
  const out: Article[] = [];
  for (const item of list) {
    if (!item || typeof item.article_id !== "number") continue;
    if (seen.has(item.article_id)) continue;
    seen.add(item.article_id);
    out.push(item);
  }
  return out;
}

export interface ArticleCardProps {
  article: Article;
  /** 描述截斷字數（預設 60 字） */
  descriptionLimit?: number;
  /** 標題的語意層級（文章頁內的延伸閱讀用 h3，主題列表頁用 h2） */
  headingLevel?: "h2" | "h3";
}

/**
 * ArticleCard —— 文章卡（縮圖／分類／標題／描述前 N 字）
 *
 * 樣式刻意與 Articles.tsx 的 Focus Card 一致（`article-card-item`、
 * `bg-surface`、`border-gold/10`），只是去掉列表頁專屬的 hover 聚焦動畫。
 * 放在本檔是為了讓「延伸閱讀」與「主題頁」共用同一張卡，不必複製三份 markup。
 */
export const ArticleCard: React.FC<ArticleCardProps> = ({
  article,
  descriptionLimit = 60,
  headingLevel = "h3",
}) => {
  const { loc, catLabel } = useLocalize();
  const obj = article as unknown as Record<string, unknown>;
  const title = loc(obj, "article_title");
  const description = loc(obj, "article_description");
  const short =
    description.length > descriptionLimit
      ? `${description.slice(0, descriptionLimit)}…`
      : description;
  const Heading = headingLevel;

  return (
    <Link
      to={`/articles/${article.article_slug || article.article_id}`}
      className="group block h-full"
    >
      <article className="article-card-item bg-surface rounded-lg overflow-hidden border border-gold/10 hover:border-gold/40 hover:shadow-xl hover:shadow-gold/10 transition-all duration-300 h-full flex flex-col">
        {article.article_thumbnail_url ? (
          <div className="aspect-16/10 overflow-hidden">
            <img
              src={article.article_thumbnail_url}
              alt={title}
              loading="lazy"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          </div>
        ) : (
          <div className="no-thumb aspect-16/10 bg-[#c5a059]/10 flex items-center justify-center">
            <span className="text-3xl sm:text-4xl text-gold/30">📝</span>
          </div>
        )}

        <div className="p-3 sm:p-4 flex-1 flex flex-col">
          {article.article_category && (
            <span className="cat-label text-[10px] sm:text-xs text-gold mb-1.5">
              {catLabel(article.article_category)}
            </span>
          )}
          <Heading className="text-sm sm:text-base font-light text-white/90 mb-1.5 group-hover:text-gold transition-colors line-clamp-2">
            {title}
          </Heading>
          {short && (
            <p className="text-muted text-xs sm:text-sm line-clamp-2">{short}</p>
          )}
        </div>
      </article>
    </Link>
  );
};

export interface RelatedArticlesProps {
  /** 手動指定的相關文章 id（後台欄位 related_article_ids） */
  relatedIds?: number[] | null;
  /** 來源實體的關鍵字（逗號分隔字串：article_keywords / course_keywords） */
  keywords?: string | null;
  /** 來源實體的分類（同分類優先） */
  category?: string | null;
  /** 要排除的文章 id（文章頁傳自己） */
  excludeArticleId?: number;
  /** 既有候選池（文章頁可直接給 SSR 抓好的熱門文章清單） */
  pool?: Article[];
  /** 最多顯示幾篇（預設 4） */
  max?: number;
  /** 區塊標題（預設走字典的「延伸閱讀」） */
  heading?: string;
  className?: string;
}

/** 至少要湊到幾篇才不自動補（見檔頭演算法說明） */
const MIN_BEFORE_AUTOFILL = 3;

/**
 * RelatedArticles - 延伸閱讀／相關文章區塊
 */
export const RelatedArticles: React.FC<RelatedArticlesProps> = ({
  relatedIds,
  keywords,
  category,
  excludeArticleId,
  pool,
  max = 4,
  heading,
  className = "",
}) => {
  const { t } = useLanguage();
  /** client 端補抓到的文章（指定 id + 候選池） */
  const [extra, setExtra] = useState<Article[]>([]);
  /** 已發出過的請求（避免 setExtra → 重新 render → 再抓的迴圈） */
  const requestedRef = useRef<Set<string>>(new Set());

  const idsKey = (relatedIds || []).join(",");
  const poolLength = pool?.length ?? 0;

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      const found: Article[] = [];
      const haveIds = new Set((pool || []).map((a) => a.article_id));

      // 1) 手動指定但候選池沒有的文章 → 逐篇補抓（上限 max，不放大流量）
      for (const id of (relatedIds || []).slice(0, max)) {
        if (typeof id !== "number" || haveIds.has(id)) continue;
        const key = `id:${id}`;
        if (requestedRef.current.has(key)) continue;
        requestedRef.current.add(key);
        try {
          const data = await articleService.getByIdentifier(id);
          if (data && typeof data.article_id === "number") found.push(data);
        } catch {
          /* 單篇失敗就略過，不影響其他推薦 */
        }
      }

      // 2) 候選池太小（例如課程頁完全沒有）→ 抓一次列表當自動推薦的素材
      if (poolLength < MIN_BEFORE_AUTOFILL + 2 && !requestedRef.current.has("pool")) {
        requestedRef.current.add("pool");
        try {
          const res = await articleService.getAll({ limit: 50 });
          if (Array.isArray(res?.articles)) found.push(...res.articles);
        } catch {
          /* 列表失敗 → 只剩手動指定的推薦，區塊仍可用 */
        }
      }

      if (!cancelled && found.length > 0) {
        setExtra((prev) => dedupe([...prev, ...found]));
      }
    };

    run();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idsKey, poolLength, max]);

  const selected = useMemo(() => {
    const all = dedupe([...(pool || []), ...extra]).filter(
      (a) => a.article_id !== excludeArticleId,
    );
    const byId = new Map(all.map((a) => [a.article_id, a]));
    const used = new Set<number>();
    const out: Article[] = [];

    // 1) 手動指定（保留後台給的順序）
    for (const id of relatedIds || []) {
      if (out.length >= max) break;
      const hit = byId.get(id);
      if (hit && !used.has(hit.article_id)) {
        used.add(hit.article_id);
        out.push(hit);
      }
    }

    // 2) 不足 MIN_BEFORE_AUTOFILL 篇 → 同分類 → 關鍵字交集 → 瀏覽數
    if (out.length < MIN_BEFORE_AUTOFILL) {
      const myKeywords = parseKeywords(keywords);
      const ranked = all
        .filter((a) => !used.has(a.article_id))
        .map((a) => ({
          article: a,
          sameCategory:
            category && a.article_category && a.article_category === category
              ? 1
              : 0,
          overlap: overlapCount(myKeywords, parseKeywords(a.article_keywords)),
          views: a.view_count || 0,
        }))
        .sort(
          (x, y) =>
            y.sameCategory - x.sameCategory ||
            y.overlap - x.overlap ||
            y.views - x.views,
        );

      for (const row of ranked) {
        if (out.length >= max) break;
        used.add(row.article.article_id);
        out.push(row.article);
      }
    }

    return out.slice(0, max);
  }, [pool, extra, relatedIds, keywords, category, excludeArticleId, max]);

  if (selected.length === 0) return null;

  return (
    <section
      className={`bg-white/2 border border-white/5 rounded-lg p-6 sm:p-10 ${className}`}
    >
      <h2 className="text-xl sm:text-2xl font-light text-white mb-6 pb-3 border-b border-white/10">
        {heading || t.answerBlocks.relatedTitle}
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        {selected.map((item) => (
          <ArticleCard key={item.article_id} article={item} />
        ))}
      </div>
    </section>
  );
};

export default RelatedArticles;
