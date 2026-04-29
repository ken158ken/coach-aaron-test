/**
 * PodcastExpandable - 深海電台 Expandable Card 版本
 * @module components/sections/PodcastExpandable
 * @description Aceternity Expandable Card 風格：點擊卡片展開詳細內容
 */

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useScrollLock } from '@/hooks/useScrollLock';
import { useSiteContent } from '@/hooks/useSiteContent';
import {
  podcastService,
  type PodcastEpisode as DbEpisode,
} from '@/services/site/podcast.service';

interface PodcastEpisode {
  id: string;
  title: string;
  description: string;
  fullDescription: string;
  duration: string;
  date: string;
  category: string;
}

const DEMO_EPISODES: PodcastEpisode[] = [
  {
    id: '1',
    title: '新手必聽：健身入門的 5 大迷思',
    description: '打破常見的健身迷思，建立正確的訓練觀念...',
    fullDescription:
      '很多初學者在進入健身房前就已經被坊間的錯誤資訊影響。這集將逐一破解最常見的 5 個迷思，包括「重量訓練會讓女生變壯」、「空腹運動燃脂更快」等。讓你從一開始就走對路，避免浪費時間與精力在錯誤的方向上。',
    duration: '45:30',
    date: '2024-01-15',
    category: 'training',
  },
  {
    id: '2',
    title: '飲食控制不等於節食',
    description: '學會聰明吃，讓增肌減脂事半功倍...',
    fullDescription:
      '飲食是健身成效的關鍵，但很多人把「控制飲食」誤解為「不能吃」。這集深入探討熱量赤字、蛋白質攝取與碳水循環的概念，告訴你如何在享受美食的同時，依然達成增肌減脂的目標。',
    duration: '38:15',
    date: '2024-01-08',
    category: 'nutrition',
  },
  {
    id: '3',
    title: '如何保持訓練動力',
    description: '分享維持長期運動習慣的心法與技巧...',
    fullDescription:
      '開始健身容易，但如何讓運動成為生活中不可缺少的一部分？這集深度分析動力的本質，以及如何在低潮期持續前進。阿倫教官分享了他親身實踐的 3 個心法，幫助你建立自驅力，不再依賴外在刺激。',
    duration: '42:00',
    date: '2024-01-01',
    category: 'mindset',
  },
];

/** 把 DB 型別轉成元件本地型別 */
const fromDb = (ep: DbEpisode): PodcastEpisode => ({
  id: String(ep.id),
  title: ep.title,
  description: ep.description,
  fullDescription: ep.full_description,
  duration: ep.duration,
  date: ep.episode_date,
  category: ep.category,
});

const CATEGORY_STYLE: Record<string, string> = {
  training: 'text-cyan-400 bg-cyan-400/10 border-cyan-400/20',
  nutrition: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20',
  mindset: 'text-purple-400 bg-purple-400/10 border-purple-400/20',
};

const CATEGORY_LABEL: Record<string, string> = {
  training: '訓練',
  nutrition: '營養',
  mindset: '心態',
};

const PodcastExpandable: React.FC = () => {
  const [active, setActive] = useState<PodcastEpisode | null>(null);
  const [episodes, setEpisodes] = useState<PodcastEpisode[]>(DEMO_EPISODES);

  useScrollLock(!!active);

  const { get } = useSiteContent();
  const pHeader = {
    tagline: get('podcast_tagline', 'Podcast'),
    title: get('podcast_title', '深海電台'),
    subtitle: get(
      'podcast_subtitle',
      '每週更新健身知識、訓練技巧與生活態度分享'
    ),
  };

  // 從 DB 讀取單集清單（獨立 podcast_episodes 表）；失敗則保留 DEMO fallback
  useEffect(() => {
    podcastService
      .getAll()
      .then((rows) => {
        if (rows.length > 0) setEpisodes(rows.map(fromDb));
      })
      .catch((err) => {
        console.warn('[PodcastExpandable] 載入單集失敗，使用預設值', err);
      });
  }, []);

  return (
    <section className="py-16 sm:py-20 md:py-24 px-4 bg-transparent">
      <div className="max-w-[1440px] mx-auto">
        {/* Header */}
        <div className="text-center mb-8 sm:mb-12">
          <span className="inline-block text-white text-xs sm:text-sm uppercase tracking-widest mb-3 sm:mb-4">
            {pHeader.tagline}
          </span>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white/90 mb-3 sm:mb-4">
            {pHeader.title}
          </h2>
          <p className="text-sm sm:text-base text-white/50 max-w-xl mx-auto px-2">
            {pHeader.subtitle}
          </p>
        </div>

        {/* Cards Grid */}
        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
          {episodes.map((ep) => (
            <motion.div
              key={ep.id}
              layoutId={`podcast-card-${ep.id}`}
              onClick={() => setActive(ep)}
              className="bg-[#050505]/50 backdrop-blur-sm rounded-xl border border-white/10 p-5 sm:p-6 cursor-pointer select-none"
              whileHover={{
                y: -6,
                boxShadow: '0 8px 40px rgba(0,255,255,0.18)',
                borderColor: 'rgba(255,255,255,0.22)',
              }}
              transition={{ duration: 0.22 }}
            >
              {/* Play icon */}
              <motion.div
                layoutId={`podcast-icon-${ep.id}`}
                className="w-11 h-11 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mb-4"
              >
                <svg
                  className="w-5 h-5 text-white ml-0.5"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M8 5v14l11-7z" />
                </svg>
              </motion.div>

              {/* Category badge */}
              <motion.span
                layoutId={`podcast-cat-${ep.id}`}
                className={`inline-block text-xs px-2 py-0.5 rounded-full border mb-2 ${
                  CATEGORY_STYLE[ep.category] ??
                  'text-gold bg-gold/10 border-gold/20'
                }`}
              >
                {CATEGORY_LABEL[ep.category] ?? ep.category}
              </motion.span>

              {/* Title */}
              <motion.h3
                layoutId={`podcast-title-${ep.id}`}
                className="text-base font-medium text-white/90 mb-2"
              >
                {ep.title}
              </motion.h3>

              <p className="text-white/45 text-xs leading-relaxed line-clamp-2">
                {ep.description}
              </p>

              <div className="flex items-center justify-between mt-4 text-xs text-white/35">
                <span>🎧 {ep.duration}</span>
                <span>{ep.date}</span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Expanded overlay */}
      <AnimatePresence>
        {active && (
          <>
            {/* Backdrop */}
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50"
              onClick={() => setActive(null)}
            />

            {/* Expanded card */}
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
              <motion.div
                layoutId={`podcast-card-${active.id}`}
                className="relative bg-[#0a0a0a] border border-white/15 rounded-2xl p-6 sm:p-8 w-full max-w-lg pointer-events-auto shadow-2xl"
              >
                {/* Close button */}
                <button
                  onClick={() => setActive(null)}
                  className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/8 flex items-center justify-center text-white/50 hover:text-white hover:bg-white/15 transition-colors text-sm"
                >
                  ✕
                </button>

                {/* Icon */}
                <motion.div
                  layoutId={`podcast-icon-${active.id}`}
                  className="w-14 h-14 rounded-full bg-white/5 border border-white/12 flex items-center justify-center mb-5"
                >
                  <svg
                    className="w-6 h-6 text-white ml-0.5"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </motion.div>

                {/* Category */}
                <motion.span
                  layoutId={`podcast-cat-${active.id}`}
                  className={`inline-block text-xs px-2.5 py-1 rounded-full border mb-3 ${
                    CATEGORY_STYLE[active.category] ??
                    'text-gold bg-gold/10 border-gold/20'
                  }`}
                >
                  {CATEGORY_LABEL[active.category] ?? active.category}
                </motion.span>

                {/* Title */}
                <motion.h3
                  layoutId={`podcast-title-${active.id}`}
                  className="text-xl font-semibold text-white/95 mb-3"
                >
                  {active.title}
                </motion.h3>

                {/* Full description */}
                <motion.p
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15, duration: 0.3 }}
                  className="text-white/60 text-sm leading-relaxed mb-5"
                >
                  {active.fullDescription}
                </motion.p>

                {/* Meta */}
                <div className="flex items-center justify-between text-xs text-white/40 pt-4 border-t border-white/8">
                  <span>🎧 {active.duration}</span>
                  <span>{active.date}</span>
                </div>

                {/* Play CTA */}
                <motion.button
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2, duration: 0.3 }}
                  className="mt-4 w-full py-3 rounded-xl bg-white/5 border border-white/12 text-white/75 text-sm hover:bg-white/10 hover:text-white/95 transition-all flex items-center justify-center gap-2"
                >
                  <svg
                    className="w-4 h-4 ml-0.5"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M8 5v14l11-7z" />
                  </svg>
                  播放本集
                </motion.button>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>
    </section>
  );
};

export default PodcastExpandable;
