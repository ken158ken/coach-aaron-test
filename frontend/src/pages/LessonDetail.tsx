/**
 * LessonDetail — 教學影片詳情
 * @module pages/LessonDetail
 *
 * Layout：左大右小（桌面）/ 上下（手機）
 *   - 左：Loom iframe（16:9）
 *   - 右：逐字稿，依播放進度自動 scroll + 高亮
 *
 * 同步策略（Loom 沒公開官方 SDK）：
 *   - 監聽 window.message 事件，origin 限定 loom.com
 *   - 從 payload 嘗試抽出當下 time（不同版本 shape 不一樣）
 *   - 失敗時退回靜態顯示，使用者可手動捲，點 line 不會真的 seek
 */

import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { lessonService } from "@/services/content/lesson.service";
import { Loading } from "@/components/ui";
import { SEOHead } from "@/components/seo";
import { useLanguage } from "@/context/LanguageContext";
import { useLocalize } from "@/hooks/useLocalize";
import { getInitialData } from "@/ssr/initialData";
import { dataKeys } from "@/ssr/routeData";
import type { Lesson } from "@/types";

const LessonDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { loc } = useLocalize();

  // ── SSR 預抓資料（key 帶 :id） ──
  const ssrLesson = id ? getInitialData<Lesson>(dataKeys.lesson(id)) : undefined;

  const [lesson, setLesson] = useState<Lesson | null>(ssrLesson ?? null);
  const [loading, setLoading] = useState(!ssrLesson);
  /** 首次 fetch 已有 SSR 資料 → 不切回 loading，避免水合後閃骨架 */
  const skipFirstLoadingRef = useRef(Boolean(ssrLesson));
  const [error, setError] = useState("");
  const [currentTime, setCurrentTime] = useState(0);

  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const transcriptListRef = useRef<HTMLDivElement | null>(null);
  const lineRefs = useRef<(HTMLButtonElement | null)[]>([]);

  // Fetch
  useEffect(() => {
    let alive = true;
    if (!id) return;
    (async () => {
      try {
        if (!skipFirstLoadingRef.current) setLoading(true);
        setError("");
        const data = await lessonService.getById(id);
        if (!alive) return;
        setLesson(data);
      } catch (err) {
        console.error("Failed to fetch lesson:", err);
        if (alive) setError(t.common.error);
      } finally {
        if (alive) setLoading(false);
        skipFirstLoadingRef.current = false;
      }
    })();
    return () => {
      alive = false;
    };
  }, [id, t.common.error]);

  // 監聽 Loom postMessage 抽 currentTime（能拿就拿，拿不到就罷）
  useEffect(() => {
    const onMessage = (e: MessageEvent) => {
      // origin 限定 loom.com
      if (!e.origin.includes("loom.com")) return;
      const t = extractLoomTime(e.data);
      if (t != null) setCurrentTime(t);
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, []);

  // 找當下要 highlight 的 line index
  const transcript = lesson?.transcript || [];
  const activeIdx = useMemo(() => {
    if (transcript.length === 0) return -1;
    // 用 binary search 因為 transcript 可能很長
    let lo = 0;
    let hi = transcript.length - 1;
    let best = -1;
    while (lo <= hi) {
      const mid = (lo + hi) >> 1;
      const e = transcript[mid];
      if (currentTime >= e.start && currentTime < e.end) {
        return mid;
      }
      if (currentTime < e.start) {
        hi = mid - 1;
      } else {
        best = mid;
        lo = mid + 1;
      }
    }
    return best;
  }, [transcript, currentTime]);

  // active line 進入畫面
  useEffect(() => {
    if (activeIdx < 0) return;
    const el = lineRefs.current[activeIdx];
    const container = transcriptListRef.current;
    if (!el || !container) return;
    const elTop = el.offsetTop;
    const elBottom = elTop + el.offsetHeight;
    const visibleTop = container.scrollTop;
    const visibleBottom = visibleTop + container.clientHeight;
    if (elTop < visibleTop || elBottom > visibleBottom) {
      container.scrollTo({
        top: elTop - container.clientHeight / 2 + el.offsetHeight / 2,
        behavior: "smooth",
      });
    }
  }, [activeIdx]);

  // ── SEO ──
  // 必須在 early return 之前建立，否則 loading 狀態下伺服器端輸出空 title
  const lessonObj = (lesson ?? {}) as unknown as Record<string, unknown>;
  const lessonsLabel = t.lessonsPage.title;
  const seoTitle =
    loc(lessonObj, "title") || (id ? `${lessonsLabel} #${id}` : lessonsLabel);
  const lessonUrl = `/lessons/${lesson?.id ?? id ?? ""}`;
  const seoHead = (
    <SEOHead
      title={seoTitle}
      description={loc(lessonObj, "description") || undefined}
      keywords={
        lesson?.keywords
          ? lesson.keywords.split(",").map((k) => k.trim())
          : t.lessonDetail.fallbackKeywords
      }
      image={lesson?.thumbnail_url || undefined}
      url={lessonUrl}
      type="article"
      isArticle={Boolean(lesson)}
      noIndex={Boolean(error) || (!loading && !lesson)}
      publishedTime={lesson?.created_at}
      modifiedTime={lesson?.updated_at}
      author={t.lessonDetail.author}
      breadcrumbs={[
        { name: lessonsLabel, url: "/lessons" },
        { name: seoTitle, url: lessonUrl },
      ]}
    />
  );

  if (loading) {
    return (
      <>
        {seoHead}
        <div className="min-h-screen flex items-center justify-center">
          <Loading theme="luxe" text={t.common.loading} />
        </div>
      </>
    );
  }
  if (error || !lesson) {
    return (
      <>
        {seoHead}
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <p className="text-white/60 mb-4">
              {error || t.lessonDetail.notFound}
            </p>
            <button
              onClick={() => navigate("/lessons")}
              className="text-gold hover:underline"
            >
              ← {t.lessonDetail.backToLessons}
            </button>
          </div>
        </div>
      </>
    );
  }

  const embedUrl = `https://www.loom.com/embed/${lesson.loom_id}?hide_owner=true&hide_share=true&hide_title=true&hideEmbedTopBar=true`;

  const tags = (lesson.keywords || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  return (
    <div className="relative min-h-screen bg-transparent">
      {seoHead}

      <div className="relative z-10 pt-20 sm:pt-24 pb-12 sm:pb-20 px-4">
        <div className="max-w-7xl mx-auto">
          {/* 麵包屑 / 返回 */}
          <div className="mb-4">
            <Link
              to="/lessons"
              className="inline-flex items-center gap-1 text-white/50 hover:text-gold text-sm transition-colors"
            >
              ← {t.lessonDetail.backToLessons}
            </Link>
          </div>

          {/* 標題 + meta */}
          <div className="mb-6 sm:mb-8">
            {lesson.category && (
              <p className="text-xs sm:text-sm text-gold/80 tracking-widest uppercase mb-3">
                {loc(
                  lesson as unknown as Record<string, unknown>,
                  "category",
                )}
              </p>
            )}
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-light text-white/90 mb-3 leading-tight">
              {loc(lesson as unknown as Record<string, unknown>, "title")}
            </h1>
            {lesson.description && (
              <p className="text-white/60 text-base sm:text-lg leading-relaxed max-w-3xl">
                {loc(
                  lesson as unknown as Record<string, unknown>,
                  "description",
                )}
              </p>
            )}
            <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-white/40">
              <span>👁 {lesson.view_count}</span>
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="px-2 py-0.5 bg-white/5 text-white/50 rounded-full"
                >
                  #{tag}
                </span>
              ))}
            </div>
          </div>

          {/* 主要內容：影片 + 逐字稿 */}
          <div className="grid grid-cols-1 lg:grid-cols-[1.65fr_1fr] gap-6">
            {/* 影片 */}
            <div className="space-y-4">
              <div className="relative aspect-video rounded-xl overflow-hidden bg-black border border-white/10">
                <iframe
                  ref={iframeRef}
                  src={embedUrl}
                  title={loc(lesson as unknown as Record<string, unknown>, "title")}
                  loading="lazy"
                  allowFullScreen
                  allow="autoplay; fullscreen; picture-in-picture; clipboard-write; encrypted-media"
                  className="absolute inset-0 w-full h-full border-0"
                />
              </div>
              {/* 補充說明（手機版 fallback：transcript 在影片下方） */}
              <p className="text-xs text-white/40 lg:hidden">
                {t.lessonDetail.transcriptHint}
              </p>
            </div>

            {/* 逐字稿面板 */}
            <aside
              className="rounded-xl bg-white/[0.02] border border-white/10 backdrop-blur-sm flex flex-col"
              style={{ maxHeight: "min(720px, calc(100vh - 160px))" }}
            >
              <header className="px-4 py-3 border-b border-white/8 flex items-center justify-between">
                <h2 className="text-sm font-medium text-white/85 tracking-widest uppercase">
                  {t.lessonDetail.transcript}
                </h2>
                {transcript.length > 0 && (
                  <span className="text-[10px] text-white/40">
                    {transcript.length} {t.lessonDetail.lines}
                  </span>
                )}
              </header>

              <div
                ref={transcriptListRef}
                className="flex-1 overflow-y-auto px-2 py-2 space-y-1 lesson-transcript-scroll"
              >
                {transcript.length === 0 ? (
                  <div className="p-6 text-center text-white/40 text-sm">
                    {t.lessonDetail.noTranscript}
                  </div>
                ) : (
                  transcript.map((entry, idx) => {
                    const active = idx === activeIdx;
                    return (
                      <button
                        key={idx}
                        ref={(el) => {
                          lineRefs.current[idx] = el;
                        }}
                        onClick={() => seekViaPostMessage(iframeRef.current, entry.start)}
                        className={`w-full text-left px-3 py-2 rounded-lg transition-all flex gap-3 ${
                          active
                            ? "bg-gold/15 ring-1 ring-gold/40"
                            : "hover:bg-white/5"
                        }`}
                      >
                        <span
                          className={`shrink-0 text-[11px] font-mono tabular-nums tracking-tight ${
                            active ? "text-gold" : "text-white/35"
                          }`}
                        >
                          {formatTimestamp(entry.start)}
                        </span>
                        <span
                          className={`text-sm leading-snug ${
                            active ? "text-white/95" : "text-white/65"
                          }`}
                        >
                          {entry.text}
                        </span>
                      </button>
                    );
                  })
                )}
              </div>

              <div className="px-4 py-2 border-t border-white/8 text-[10px] text-white/35 text-center">
                {t.lessonDetail.seekHint}
              </div>
            </aside>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
// helpers
// ─────────────────────────────────────────────────────────────

function formatTimestamp(seconds: number): string {
  const total = Math.floor(seconds);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  if (h > 0) return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

/**
 * 從 Loom postMessage payload 嘗試抽出 currentTime
 * Loom 在不同版本下 shape 不一樣，我們用 best-effort 掃描幾個常見欄位
 */
function extractLoomTime(data: unknown): number | null {
  if (!data) return null;
  if (typeof data === "number") return data;
  if (typeof data !== "object") return null;
  const obj = data as Record<string, unknown>;

  // 直接欄位
  for (const key of ["currentTime", "time", "position", "timestamp"]) {
    const v = obj[key];
    if (typeof v === "number" && isFinite(v) && v >= 0) return v;
  }

  // 巢狀 payload / data
  for (const key of ["payload", "data", "detail"]) {
    const inner = obj[key];
    if (inner && typeof inner === "object") {
      const t = extractLoomTime(inner);
      if (t != null) return t;
    }
  }

  return null;
}

/**
 * 試著請 Loom iframe 跳到指定時間（部分版本支援）
 * 不支援的話畫面不會動，但點擊還是會視覺 highlight
 */
function seekViaPostMessage(
  iframe: HTMLIFrameElement | null,
  timeSec: number,
): void {
  if (!iframe || !iframe.contentWindow) return;
  // 嘗試多種 shape，命中一個就好
  const messages = [
    { type: "loom:seek", time: timeSec },
    { type: "seek", time: timeSec },
    { command: "seek", value: timeSec },
  ];
  for (const m of messages) {
    try {
      iframe.contentWindow.postMessage(m, "https://www.loom.com");
    } catch {
      // ignore
    }
  }
}

export default LessonDetail;
