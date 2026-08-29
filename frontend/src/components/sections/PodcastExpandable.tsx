/**
 * PodcastExpandable - Podcast《陪你健身》Expandable Card 版本
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

/**
 * DB（podcast_episodes 表）讀不到時的 fallback 單集。
 *
 * 原本的三筆是 B2C 模板假資料（健身入門迷思／飲食控制／訓練動力），
 * 與純 B2B 定位衝突，已改為節目中的 B2B 向集數。
 * ⚠️ 時長為概值、日期為節目實際年份區間；正式資料請由後台維護。
 */
const DEMO_EPISODES: PodcastEpisode[] = [
  {
    id: '1',
    title: 'EP20 續課八法',
    description: '把續約從「開口很尷尬」變成一套可執行的流程...',
    fullDescription:
      '開發一個新會員的成本，是維護一個舊會員的好幾倍。這集拆解續課的八個切入點：從課程中的成效回顧、時機判讀，到怎麼把續約談成「下一階段的規劃」而不是推銷。教練最該先補的一塊，通常就在這裡。',
    duration: '32:10',
    date: '2021',
    category: 'training',
  },
  {
    id: '2',
    title: 'EP22 SMARTER 目標設定',
    description: '會員做不到的目標，多半是一開始就設錯了...',
    fullDescription:
      '目標設定不是喊口號。這集用 SMARTER 架構逐項拆解：具體、可衡量、可達成、相關性、時限，再加上評估與調整兩步。學會之後，你不只能幫會員設目標，也能把自己的業績目標拆成每週做得完的動作。',
    duration: '28:45',
    date: '2021',
    category: 'mindset',
  },
  {
    id: '3',
    title: 'EP2 人類三大本能',
    description: '讀懂本能，才讀得懂會員為什麼說「我再想想」...',
    fullDescription:
      '所有溝通與成交的底層，都是人的本能反應。這集談趨吉避凶、追求認同與歸屬感三大本能如何影響決策，以及教練該怎麼在對話裡對準這些動機——這是我後來整套銷售心理學的起點。',
    duration: '25:30',
    date: '2021',
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
  // ⚠️ 節目 2022 年已停更，文案不得出現「每週更新」「持續更新」等時效性字眼。
  // 主標備選：'我的方法論，從這裡開始' ／ '58 集，一套方法的原點'
  // 說明備選：
  //   B 案：'58 集《陪你健身》，完整記錄了我方法論成形的過程。有空可以聽聽，它們現在還是有效的。'
  //   C 案：'在很多人還沒開始做 Podcast 的時候，我已經一集一集講完了 58 集。內容沒有過期——講的是原理，不是趨勢。'
  const pHeader = {
    tagline: get('podcast_tagline', 'Podcast'),
    title: get('podcast_title', 'Podcast《陪你健身》'),
    subtitle: get(
      'podcast_subtitle',
      '58 集完整節目，我方法論成形的過程'
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
