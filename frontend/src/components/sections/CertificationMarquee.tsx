/**
 * CertificationMarquee - 認證/成果無限橫向滾動 Marquee
 * @module components/sections/CertificationMarquee
 * @description Aceternity Infinite Moving Cards — 認證標章與學員成果數字無限滾動
 *              CSS animation (no JS scroll), hover 暫停，兩列反向增加層次感
 *              資料來源：DB `marquee_items` 表 — 由 admin CRUD 管理
 */

import React, { useEffect, useState } from 'react';
import { marqueeService, type MarqueeItem } from '@/services/site/marquee.service';
import { getInitialData } from '@/ssr/initialData';
import { dataKeys } from '@/ssr/routeData';

/**
 * 預設認證標章（DB 載入失敗時的 fallback）— cert 軌只放證照，不混業績數字。
 *
 * 「130+ 教練」「月入 8 萬」「10 年經驗」等成果數字改列到下方 stat 軌，
 * 避免混淆「認證」與「成果」兩種不同性質的資訊。
 */
const DEFAULT_CERTS: MarqueeItem[] = [
  { id: -1, type: 'cert', icon: '🏅', label: 'NSCA-CPT', sub: '美國肌力與體能協會 私人教練認證', sort_order: 1, is_active: true, created_at: '' },
  { id: -2, type: 'cert', icon: '🎓', label: 'TQUK Level 3', sub: '英國認證心理諮詢', sort_order: 2, is_active: true, created_at: '' },
  { id: -3, type: 'cert', icon: '🧠', label: 'NLP 執行師', sub: '神經語言程式學', sort_order: 3, is_active: true, created_at: '' },
  { id: -4, type: 'cert', icon: '🧭', label: 'Andaction 生活教練', sub: '目標設定與行動陪伴', sort_order: 4, is_active: true, created_at: '' },
  { id: -5, type: 'cert', icon: '📜', label: '健身教練 C 級', sub: '健身指導員培訓認證', sort_order: 5, is_active: true, created_at: '' },
  { id: -6, type: 'cert', icon: '💪', label: 'ACE-CPT', sub: '美國運動委員會認證', sort_order: 6, is_active: true, created_at: '' },
  { id: -7, type: 'cert', icon: '🏆', label: 'ISSA-CPT', sub: '國際運動科學協會', sort_order: 7, is_active: true, created_at: '' },
];

/**
 * 預設成果數字（DB 載入失敗時的 fallback）。
 *
 * 已移除模板帶來的假數據：95% 學員續課率、3 倍平均業績成長、500+ 服務學員數、
 * 4.9★ 學員平均評分（且「學員」一詞在 B2B 語境下語意錯誤）。
 */
const DEFAULT_STATS: MarqueeItem[] = [
  { id: -11, type: 'stat', icon: '', label: '50 人', sub: '教練團隊管理規模', sort_order: 1, is_active: true, created_at: '' },
  { id: -12, type: 'stat', icon: '', label: '1000+ 小時', sub: '教學與授課時數', sort_order: 2, is_active: true, created_at: '' },
  { id: -13, type: 'stat', icon: '', label: '10 年', sub: '健身產業經歷', sort_order: 3, is_active: true, created_at: '' },
  { id: -14, type: 'stat', icon: '', label: '58 集', sub: '《陪你健身》Podcast', sort_order: 4, is_active: true, created_at: '' },
  { id: -15, type: 'stat', icon: '', label: '130+', sub: '協助提升收入的教練', sort_order: 5, is_active: true, created_at: '' },
  { id: -16, type: 'stat', icon: '', label: '8 萬', sub: '個人私教月收入', sort_order: 6, is_active: true, created_at: '' },
];

const CertificationMarquee: React.FC = () => {
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

  const [certs, setCerts] = useState<MarqueeItem[]>(
    ssrCerts.length > 0 ? ssrCerts : DEFAULT_CERTS
  );
  const [stats, setStats] = useState<MarqueeItem[]>(
    ssrStats.length > 0 ? ssrStats : DEFAULT_STATS
  );

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

  // 複製兩份讓動畫無縫循環
  const certsDuped = [...certs, ...certs];
  const statsDuped = [...stats, ...stats];

  return (
    <section className="py-12 sm:py-16 overflow-hidden">
      {/* Section label */}
      <div className="text-center mb-8 px-4" data-aos="fade-up">
        <span className="text-gold text-xs uppercase tracking-widest">
          Credentials
        </span>
        {/* 定稿標題為「Credentials 專業認證」；上方 tagline 已顯示 Credentials，
            此處只放中文以免重複。備選：'專業背書' ／ '證照與資歷' */}
        <h2 className="mt-2 text-xl sm:text-2xl font-light text-white/80">
          專業認證
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
