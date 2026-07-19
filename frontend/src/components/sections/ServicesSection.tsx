/**
 * ServicesSection - 主要服務項目與專長
 * @module components/sections/ServicesSection
 *
 * @description
 * 直接接既有的 `courses` 資料（`courseService.getCourses()` → `GET /api/courses`），
 * 不另開資料表。依 `course_category` 分組呈現（陪跑方案／線上課程／一對一服務），
 * 每門課顯示名稱、簡述與價格。
 *
 * 價格顯示沿用 `pages/Courses.tsx` 的既有規則：
 * 只有後端回傳 `show_price === true` 時才揭露金額，否則顯示「價格洽詢」。
 *
 * SSR 注意：資料在 useEffect 取得，載入中回傳固定高度骨架（不回 null），
 * 避免 SSR → hydration 之間版面跳動（CLS）。
 *
 * ─── 文案替換說明 ──────────────────────────────────────────────
 * 正式文案產出後只需改 `SERVICES_COPY`（亦可由 site_content 的
 * services_tagline / services_title / services_subtitle 覆寫），
 * 分組標題與排序改 `CATEGORY_ORDER` 即可。
 */

import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { courseService } from '@/services';
import { useSiteContent } from '@/hooks/useSiteContent';
import type { Course } from '@/types';

// ─── 文案（定稿版，來源 REPORTS/INDEX_B2B文案_定稿草案.md 第 3 節）──

/**
 * 區塊標題文案；同名的 site_content key 若有值會優先採用。
 *
 * 主標題備選（客戶日後可替換）：
 *   '我能幫你解決什麼'（痛點導向）／'從卡關到穩定業績，三種路徑'（結構導向）
 * 導言備選：
 *   B 案：'有人卡在體驗課成交，有人卡在續約，有人是整條路都想重走一次。
 *          所以我提供三種深度的服務——你不必全買，挑最痛的那一個先解決。'
 *   C 案：'三種形式，一個目標：把你的專業變成能算得出來的收入。
 *          從一堂線上課，到一整年的陪跑，深度由你決定。'
 * CTA 備選：'看全部 9 門課' ／ '課程總覽'
 */
const SERVICES_COPY = {
  tagline: 'Services',
  title: '主要服務項目與專長',
  subtitle:
    '教練的收入問題，通常不是「不夠專業」，是缺一套流程。我把十年的私教與帶團隊經驗拆成三種形式：整套陪跑、單點補強、一對一客製。你現在卡在哪一關，就從哪裡開始。',
  /** 無任何已發布課程時的替代說明 */
  empty: '服務項目整理中，歡迎直接來訊詢問。',
  /** 未登入或未開放售價時的價格文字 */
  inquirePrice: '價格洽詢',
  free: '免費',
  cta: '查看完整課程',
} as const;

/**
 * 分組顯示順序與標題。
 * 以「關鍵字比對 course_category」的方式歸類，
 * 因此後台把分類寫成「變現陪跑方案」或「陪跑」都能正確歸到同一組。
 * 未命中的分類會以原始分類名稱附加在最後，不會消失。
 */
const CATEGORY_ORDER: { key: string; match: string[]; title: string; description: string }[] = [
  {
    // 組別標題備選：'陪跑計畫｜從教練到經營者' ／ '主方案｜整套變現系統'
    key: 'coaching',
    match: ['陪跑'],
    title: '變現陪跑方案',
    description:
      '不是聽完課就自己回去試。每週一次視訊覆盤、追蹤邀約數與成交數、訊息 24 小時內回覆——我陪你把系統真的裝到你的日常裡。三種期程對應三個階段的深度。',
  },
  {
    // 組別標題備選：'線上課程｜單點突破' ／ '哪裡卡住，就補哪裡'
    key: 'online',
    match: ['線上'],
    title: '線上課程',
    description:
      '還沒準備好投入陪跑，可以先從最痛的那一點開始。四門課各自對應一個具體關卡，隨時可看、無觀看期限。',
  },
  {
    // ⚠️ DB 的 course_category 叫「一對一服務」，在此一律顯示為「一對一諮詢」，
    //    避免被誤讀成一般民眾的一對一私教體能課（本站已停止承接 B2C）。
    // 組別標題備選：'一對一｜針對你的狀況' ／ '客製諮詢'
    key: 'oneonone',
    match: ['一對一', '1對1'],
    title: '一對一諮詢',
    description:
      '課程講的是通則，但你的瓶頸是你自己的。這兩項服務不給模板，直接從你目前的數字和心態下手，一個月一期。',
  },
];

/** 分組後的結果 */
interface ServiceGroup {
  key: string;
  title: string;
  description: string;
  courses: Course[];
}

/**
 * 依 course_category 將課程分組，並套用 CATEGORY_ORDER 的順序與標題。
 * 找不到對應分類的課程會依原始分類名稱自成一組，排在已知分組之後。
 */
function groupCourses(courses: Course[]): ServiceGroup[] {
  const known: ServiceGroup[] = CATEGORY_ORDER.map((c) => ({
    key: c.key,
    title: c.title,
    description: c.description,
    courses: [],
  }));
  const extras = new Map<string, ServiceGroup>();

  for (const course of courses) {
    const category = course.course_category?.trim() || '';
    const hitIndex = CATEGORY_ORDER.findIndex((c) =>
      c.match.some((m) => category.includes(m))
    );

    if (hitIndex >= 0) {
      known[hitIndex].courses.push(course);
      continue;
    }

    const fallbackKey = category || 'others';
    if (!extras.has(fallbackKey)) {
      extras.set(fallbackKey, {
        key: fallbackKey,
        title: category || '其他服務',
        description: '',
        courses: [],
      });
    }
    extras.get(fallbackKey)!.courses.push(course);
  }

  return [...known, ...extras.values()].filter((g) => g.courses.length > 0);
}

/** 價格文字（沿用 pages/Courses.tsx 的 show_price 規則） */
function formatPrice(course: Course): string {
  if (!course.show_price) return SERVICES_COPY.inquirePrice;
  if (!course.price || course.price === 0) return SERVICES_COPY.free;
  return `NT$ ${course.price.toLocaleString()}`;
}

// ─── Component ────────────────────────────────────────────────

const ServicesSection: React.FC = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
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

  const groups = groupCourses(courses);

  return (
    <section className="py-16 sm:py-20 px-4 bg-transparent">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10 sm:mb-12">
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

        {/* 載入中骨架：固定高度佔位，避免 SSR → hydration 版面跳動 */}
        {loading ? (
          <div
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5"
            aria-hidden="true"
          >
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="h-52 rounded-2xl border border-white/10 bg-surface/60 animate-pulse"
              />
            ))}
          </div>
        ) : groups.length === 0 ? (
          <p className="text-center text-sm text-white/40">
            {SERVICES_COPY.empty}
          </p>
        ) : (
          <div className="space-y-12 sm:space-y-14">
            {groups.map((group) => (
              <div key={group.key}>
                {/* 分組標題 */}
                <div className="mb-5 flex flex-wrap items-baseline gap-x-3 gap-y-1">
                  <h3 className="text-lg sm:text-xl font-light text-white/85">
                    <span className="text-gold mr-2">/</span>
                    {group.title}
                  </h3>
                  {group.description && (
                    <p className="text-xs text-white/35">{group.description}</p>
                  )}
                </div>

                {/* 課程卡 */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
                  {group.courses.map((course, i) => (
                    <motion.div
                      key={course.course_id}
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true, margin: '-60px' }}
                      transition={{
                        delay: Math.min(i, 5) * 0.06,
                        duration: 0.45,
                        ease: [0.16, 1, 0.3, 1],
                      }}
                    >
                      <Link
                        to={`/courses/${course.course_id}`}
                        className="group h-full flex flex-col gap-3 bg-surface border border-white/10 rounded-2xl p-5 sm:p-6 hover:border-gold/25 transition-colors duration-300"
                      >
                        <h4 className="text-white/90 text-base font-medium leading-snug group-hover:text-gold transition-colors duration-300">
                          {course.course_title}
                        </h4>

                        {course.course_description && (
                          <p className="text-white/55 text-sm leading-relaxed line-clamp-3 flex-1">
                            {course.course_description}
                          </p>
                        )}

                        <div className="pt-3 mt-auto border-t border-white/5 flex items-center justify-between gap-2">
                          <span className="text-gold text-sm">
                            {formatPrice(course)}
                          </span>
                          <span className="text-xs text-white/35 group-hover:text-white/60 transition-colors duration-300">
                            {SERVICES_COPY.cta} →
                          </span>
                        </div>
                      </Link>
                    </motion.div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default ServicesSection;
