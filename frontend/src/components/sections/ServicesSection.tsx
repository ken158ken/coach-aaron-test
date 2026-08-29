/**
 * ServicesSection - 主要服務項目與專長（apple-cards-carousel 版）
 * @module components/sections/ServicesSection
 *
 * @description
 * 改用 Aceternity「apple-cards-carousel」呈現：每一門課一張高卡片，
 * 橫向捲動、左右箭頭切換、點卡片展開 modal 看課程描述 + 價格 + 課程詳情連結。
 * 一列即可容納多張卡，視覺仍精簡（卡片文字精簡、細節收進 modal）。
 *
 * 保留：
 *   - 資料載入 courseService.getCourses()（GET /api/courses）
 *   - 載入中骨架（等高佔位卡）
 *   - 標題區可由 site_content 覆寫（services_tagline / _title / _subtitle）
 *   - default export 名稱 ServicesSection（Home.tsx 引用）不變
 *   - show_price 規則（沿用 formatPrice）
 *
 * SSR：資料在 useEffect 取得；卡片圖片先留空（顯示主題色佔位），客戶之後塞圖。
 * 卡片價格 / 分類 / 標題皆來自真實課程資料，未用 Math.random / new Date()。
 */

import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { courseService } from '@/services';
import { useSiteContent } from '@/hooks/useSiteContent';
import { useLanguage } from '@/context/LanguageContext';
import { useLocalize } from '@/hooks/useLocalize';
import { Carousel, Card } from '@/components/ui/apple-cards-carousel';
import { getInitialData } from '@/ssr/initialData';
import { dataKeys } from '@/ssr/routeData';
import type { Course } from '@/types';

/** loc() 需要 index signature，Course 介面沒有 → 統一轉型（沿用本專案既有寫法） */
const asRecord = (course: Course): Record<string, unknown> =>
  course as unknown as Record<string, unknown>;

/** 價格標籤（由字典帶入，避免 formatPrice 依賴 React context） */
interface PriceLabels {
  inquire: string;
  free: string;
}

/**
 * 格式化價格（沿用 Courses.tsx 的規則）：
 *   - 未開放售價（show_price 非 true）→ 洽詢價格
 *   - 價格為 0 / 未填 → 免費
 *   - 其他 → NT$ 千分位
 */
function formatPrice(course: Course, labels: PriceLabels): string {
  if (!course.show_price) return labels.inquire;
  if (!course.price || course.price === 0) return labels.free;
  return `NT$ ${course.price.toLocaleString()}`;
}

// ─── 課程 → modal 詳情內容 ────────────────────────────────────

const CourseContent: React.FC<{ course: Course }> = ({ course }) => {
  const { t } = useLanguage();
  const { loc } = useLocalize();
  // DB 內容：英文模式讀 course_description_en，空值自動 fallback 中文
  const description = loc(asRecord(course), 'course_description');

  return (
    <div className="flex flex-col gap-5">
      {description && (
        <p className="whitespace-pre-line leading-relaxed text-white/70">
          {description}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-white/5 pt-4">
        <div>
          <span className="text-xs text-white/40">{t.course.price}</span>
          <p className="text-lg font-light text-gold">
            {formatPrice(course, {
              inquire: t.course.inquirePrice,
              free: t.course.free,
            })}
          </p>
        </div>
      </div>

      <Link
        to={`/courses/${course.course_id}`}
        className="inline-flex w-fit items-center gap-1.5 rounded-full border border-gold/30 px-5 py-2 text-sm text-gold transition-colors hover:bg-gold/10"
      >
        {t.course.viewDetail}
        <span aria-hidden="true">→</span>
      </Link>
    </div>
  );
};

// ─── 載入中骨架（等高佔位卡）──────────────────────────────────

const SkeletonCards: React.FC = () => (
  <div className="flex gap-4 overflow-hidden py-4 sm:gap-6">
    {Array.from({ length: 4 }).map((_, i) => (
      <div
        key={i}
        className="h-72 w-56 shrink-0 animate-pulse rounded-3xl border border-white/10 bg-surface sm:h-96 sm:w-72"
      />
    ))}
  </div>
);

// ─── Component ────────────────────────────────────────────────

const ServicesSection: React.FC = () => {
  // ── SSR 預抓資料（與 Courses.tsx 同模式）：有資料時 SSR 直接輸出課程卡，
  //    server 與 client 首次 render 讀同一份 → 不會 hydration mismatch。
  //    只作「初值」：mount 後仍照常 fetch 覆蓋（SSR HTML 可能是 CDN 舊快取）──
  const ssrCourses = getInitialData<Course[]>(dataKeys.coursesList());
  const initialCourses = Array.isArray(ssrCourses) ? ssrCourses : [];

  const [courses, setCourses] = useState<Course[]>(initialCourses);
  const [loading, setLoading] = useState(initialCourses.length === 0);
  const { get } = useSiteContent();
  const { t, isZhTW } = useLanguage();
  const { loc } = useLocalize();
  const copy = t.servicesSection;

  /**
   * site_content 只存中文（`GET /api/content` 未回傳 content_value_en）：
   * 中文模式 DB 值優先，英文模式一律用字典。
   */
  const pick = (key: string, dict: string): string =>
    isZhTW ? get(key, dict) : dict;

  useEffect(() => {
    let cancelled = false;
    courseService
      .getCourses()
      .then((data) => {
        if (!cancelled) setCourses(data);
      })
      .catch((err) => {
        console.warn('[ServicesSection] 載入課程失敗', err);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section className="py-16 sm:py-20 px-4 bg-transparent">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8 sm:mb-10">
          <span className="text-gold text-xs uppercase tracking-widest">
            {pick('services_tagline', copy.tagline)}
          </span>
          <h2 className="mt-2 text-2xl sm:text-3xl font-light text-white/90">
            {pick('services_title', copy.title)}
          </h2>
          <p className="mt-2 text-sm text-white/40 max-w-xl mx-auto">
            {pick('services_subtitle', copy.subtitle)}
          </p>
        </div>

        {/* 課程卡片：一門一張，橫向捲動 */}
        {loading ? (
          <SkeletonCards />
        ) : courses.length > 0 ? (
          <Carousel
            items={courses.map((course, i) => (
              <Card
                key={course.course_id}
                index={i}
                layoutIdPrefix="service-course"
                card={{
                  // DB 內容：英文模式讀 course_category_en / course_title_en
                  category:
                    loc(asRecord(course), 'course_category').trim() ||
                    copy.defaultCategory,
                  title: loc(asRecord(course), 'course_title'),
                  // 有課程封面就顯示；沒有時 CardImage 會退回主題色佔位面板
                  src: course.course_thumbnail_url || undefined,
                  content: <CourseContent course={course} />,
                }}
              />
            ))}
          />
        ) : (
          <p className="text-center text-sm text-white/40">{copy.empty}</p>
        )}
      </div>
    </section>
  );
};

export default ServicesSection;
