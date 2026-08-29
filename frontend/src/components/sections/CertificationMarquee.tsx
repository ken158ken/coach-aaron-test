/**
 * CertificationMarquee - 認證/成果無限橫向滾動 Marquee
 * @module components/sections/CertificationMarquee
 * @description Aceternity Infinite Moving Cards — 認證標章與學員成果數字無限滾動
 *              CSS animation (no JS scroll), hover 暫停，兩列反向增加層次感
 *              資料來源：DB `marquee_items` 表 — 由 admin CRUD 管理
 */

import React, { useEffect, useMemo, useState } from 'react';
import { marqueeService, type MarqueeItem } from '@/services/site/marquee.service';
import { useLanguage } from '@/context/LanguageContext';
import { getInitialData } from '@/ssr/initialData';
import { dataKeys } from '@/ssr/routeData';

/** 單筆預設項目：只留穩定的 id / icon / 排序，label 與 sub 由字典提供 */
interface MarqueeSeed {
  id: number;
  icon: string;
  /** 對應 t.certifications.certs / .stats 底下的 key */
  key: string;
}

/**
 * 預設認證標章（DB 載入失敗時的 fallback）— cert 軌只放證照，不混業績數字。
 *
 * 「130+ 教練」「月入 8 萬」「10 年經驗」等成果數字改列到下方 stat 軌，
 * 避免混淆「認證」與「成果」兩種不同性質的資訊。
 * 文案（label / sub）在 i18n 字典 `t.certifications.certs`。
 */
const CERT_SEEDS: MarqueeSeed[] = [
  { id: -1, icon: '🏅', key: 'nsca' },
  { id: -2, icon: '🎓', key: 'tquk' },
  { id: -3, icon: '🧠', key: 'nlp' },
  { id: -4, icon: '🧭', key: 'andaction' },
  { id: -5, icon: '📜', key: 'fitnessC' },
  { id: -6, icon: '💪', key: 'ace' },
  { id: -7, icon: '🏆', key: 'issa' },
];

/**
 * 預設成果數字（DB 載入失敗時的 fallback）。
 *
 * 已移除模板帶來的假數據：95% 學員續課率、3 倍平均業績成長、500+ 服務學員數、
 * 4.9★ 學員平均評分（且「學員」一詞在 B2B 語境下語意錯誤）。
 * 文案（label / sub）在 i18n 字典 `t.certifications.stats`。
 */
const STAT_SEEDS: MarqueeSeed[] = [
  { id: -11, icon: '', key: 'team' },
  { id: -12, icon: '', key: 'hours' },
  { id: -13, icon: '', key: 'years' },
  { id: -14, icon: '', key: 'episodes' },
  { id: -15, icon: '', key: 'coaches' },
  { id: -16, icon: '', key: 'income' },
];

/** 把 seed + 字典文案組成 MarqueeItem（與 DB 回傳同型別） */
const buildDefaults = (
  seeds: MarqueeSeed[],
  type: MarqueeItem['type'],
  labels: Record<string, { label: string; sub: string }>
): MarqueeItem[] =>
  seeds.map((seed, i) => ({
    id: seed.id,
    type,
    icon: seed.icon,
    label: labels[seed.key]?.label ?? '',
    sub: labels[seed.key]?.sub ?? '',
    sort_order: i + 1,
    is_active: true,
    created_at: '',
  }));

const CertificationMarquee: React.FC = () => {
  const { t } = useLanguage();
  const copy = t.certifications;

  const defaultCerts = useMemo(
    () => buildDefaults(CERT_SEEDS, 'cert', copy.certs),
    [copy.certs]
  );
  const defaultStats = useMemo(
    () => buildDefaults(STAT_SEEDS, 'stat', copy.stats),
    [copy.stats]
  );
  // ── SSR 預抓資料：有資料時 SSR 直接輸出 DB 內容（否則用寫死預設值，
  //    兩種情況 server / client 首次 render 都一致，不會 hydration mismatch）。
  //    只作「初值」：mount 後仍照常 fetch 覆蓋（SSR HTML 可能是 CDN 舊快取）──
  const ssrItems = getInitialData<MarqueeItem[]>(dataKeys.marquee());
  const ssrCerts = Array.isArray(ssrItems)
    ? ssrItems.filter((i) => i.type === 'cert')
    : [];
  const ssrStats = Array.isArray(ssrItems)
    ? ssrItems.filter((i) => i.type === 'stat')
    : [];

  // 空陣列 = 尚無 DB 資料 → 渲染時改用字典預設值（見下方 displayCerts）
  const [certs, setCerts] = useState<MarqueeItem[]>(ssrCerts);
  const [stats, setStats] = useState<MarqueeItem[]>(ssrStats);

  useEffect(() => {
    marqueeService
      .getAll()
      .then((items) => {
        const nextCerts = items.filter((i) => i.type === 'cert');
        const nextStats = items.filter((i) => i.type === 'stat');
        if (nextCerts.length > 0) setCerts(nextCerts);
        if (nextStats.length > 0) setStats(nextStats);
      })
      .catch((err) => {
        console.warn('[CertificationMarquee] 載入 marquee 失敗，使用預設值', err);
      });
  }, []);

  // ⚠️ marquee_items 表沒有 label_en / sub_en 欄位，DB 內容目前只有中文；
  //    有 DB 資料時仍照顯示（不隱藏後台新增的項目），無資料才用已翻譯的預設值。
  const displayCerts = certs.length > 0 ? certs : defaultCerts;
  const displayStats = stats.length > 0 ? stats : defaultStats;

  // 複製兩份讓動畫無縫循環
  const certsDuped = [...displayCerts, ...displayCerts];
  const statsDuped = [...displayStats, ...displayStats];

  return (
    <section className="py-12 sm:py-16 overflow-hidden">
      {/* Section label */}
      <div className="text-center mb-8 px-4" data-aos="fade-up">
        <span className="text-gold text-xs uppercase tracking-widest">
          {copy.tagline}
        </span>
        {/* 定稿標題為「Credentials 專業認證」；上方 tagline 已顯示 Credentials，
            此處只放中文以免重複。備選：'專業背書' ／ '證照與資歷' */}
        <h2 className="mt-2 text-xl sm:text-2xl font-light text-white/80">
          {copy.title}
        </h2>
      </div>

      {/* Row 1 — 向左滾動（認證標章） */}
      <div
        className="relative mb-3 sm:mb-4"
        style={{
          maskImage:
            'linear-gradient(to right, transparent 0%, black 10%, black 90%, transparent 100%)',
          WebkitMaskImage:
            'linear-gradient(to right, transparent 0%, black 10%, black 90%, transparent 100%)',
        }}
      >
        <div
          className="flex gap-3 w-max"
          style={{ animation: 'marquee-left 30s linear infinite' }}
          onMouseEnter={(e) =>
            ((e.currentTarget as HTMLElement).style.animationPlayState =
              'paused')
          }
          onMouseLeave={(e) =>
            ((e.currentTarget as HTMLElement).style.animationPlayState =
              'running')
          }
        >
          {certsDuped.map((cert, i) => (
            <div
              key={`${cert.id}-${i}`}
              className="flex items-center gap-3 px-5 py-3 rounded-full border border-luxe-gold/20 bg-luxe-surface/60 backdrop-blur-sm shrink-0 hover:border-luxe-gold/50 hover:bg-luxe-gold/5 transition-colors duration-300 cursor-default"
            >
              <span className="text-xl">{cert.icon}</span>
              <div>
                <p className="text-luxe-gold text-sm font-medium leading-tight">
                  {cert.label}
                </p>
                <p className="text-white/40 text-xs">{cert.sub}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Row 2 — 向右滾動（成果數字）*/}
      <div
        className="relative"
        style={{
          maskImage:
            'linear-gradient(to right, transparent 0%, black 10%, black 90%, transparent 100%)',
          WebkitMaskImage:
            'linear-gradient(to right, transparent 0%, black 10%, black 90%, transparent 100%)',
        }}
      >
        <div
          className="flex gap-3 w-max"
          style={{ animation: 'marquee-right 24s linear infinite' }}
          onMouseEnter={(e) =>
            ((e.currentTarget as HTMLElement).style.animationPlayState =
              'paused')
          }
          onMouseLeave={(e) =>
            ((e.currentTarget as HTMLElement).style.animationPlayState =
              'running')
          }
        >
          {statsDuped.map((stat, i) => (
            <div
              key={`${stat.id}-${i}`}
              className="flex items-center gap-4 px-6 py-3 rounded-full border border-white/8 bg-white/3 backdrop-blur-sm shrink-0 hover:border-luxe-gold/30 transition-colors duration-300 cursor-default"
            >
              <span className="text-2xl font-bold text-luxe-gold tabular-nums">
                {stat.label}
              </span>
              <span className="text-white/50 text-sm">{stat.sub}</span>
            </div>
          ))}
        </div>
      </div>

      {/* CSS keyframe animations */}
      <style>{`
        @keyframes marquee-left {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        @keyframes marquee-right {
          0%   { transform: translateX(-50%); }
          100% { transform: translateX(0); }
        }
      `}</style>
    </section>
  );
};

export default CertificationMarquee;
