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
import { Carousel, Card } from '@/components/ui/apple-cards-carousel';
import { getInitialData } from '@/ssr/initialData';
import { dataKeys } from '@/ssr/routeData';
import type { Course } from '@/types';

// ─── 文案 ─────────────────────────────────────────────────────

const SERVICES_COPY = {
  tagline: 'Services',
  title: '所有課程與服務',
  subtitle: '左右滑動看完整方案，點任一張卡看課程內容與價格。',
  inquirePrice: '價格洽詢',
  free: '免費',
  detail: '看課程詳情',
} as const;

/**
 * 格式化價格（沿用 Courses.tsx 的規則）：
 *   - 未開放售價（show_price 非 true）→ 價格洽詢
 *   - 價格為 0 / 未填 → 免費
 *   - 其他 → NT$ 千分位
 */
function formatPrice(course: Course): string {
  if (!course.show_price) return SERVICES_COPY.inquirePrice;
  if (!course.price || course.price === 0) return SERVICES_COPY.free;
  return `NT$ ${course.price.toLocaleString()}`;
}

// ─── 課程 → modal 詳情內容 ────────────────────────────────────

const CourseContent: React.FC<{ course: Course }> = ({ course }) => (
  <div className="flex flex-col gap-5">
    {course.course_description && (
      <p className="whitespace-pre-line leading-relaxed text-white/70">
        {course.course_description}
      </p>
    )}

    <div className="flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-white/5 pt-4">
      <div>
        <span className="text-xs text-white/40">價格</span>
        <p className="text-lg font-light text-gold">{formatPrice(course)}</p>
      </div>
    </div>

    <Link
      to={`/courses/${course.course_id}`}
      className="inline-flex w-fit items-center gap-1.5 rounded-full border border-gold/30 px-5 py-2 text-sm text-gold transition-colors hover:bg-gold/10"
    >
      {SERVICES_COPY.detail}
      <span aria-hidden="true">→</span>
    </Link>
  </div>
);

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
            {get('services_tagline', SERVICES_COPY.tagline)}
          </span>
          <h2 className="mt-2 text-2xl sm:text-3xl font-light text-white/90">
            {get('services_title', SERVICES_COPY.title)}
          </h2>
          <p className="mt-2 text-sm text-white/40 max-w-xl mx-auto">
            {get('services_subtitle', SERVICES_COPY.subtitle)}
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
                  category: course.course_category?.trim() || '課程',
                  title: course.course_title,
                  // 圖片先留空 → 顯示主題色佔位，客戶之後塞圖
                  content: <CourseContent course={course} />,
                }}
              />
            ))}
          />
        ) : (
          <p className="text-center text-sm text-white/40">課程整理中，敬請期待。</p>
        )}
      </div>
    </section>
  );
};

export default ServicesSection;
