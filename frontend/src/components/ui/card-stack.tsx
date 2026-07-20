/**
 * CardStack — Aceternity「card-stack」的 Vite 適配版
 * 參考：https://ui.aceternity.com/components/card-stack
 *
 * 行為：多張卡片堆疊（同時可見數張），每隔 intervalMs 毫秒
 *       把最上面那張翻到最底，循環播放。
 *
 * 與原版差異（刻意調整）：
 *   - 動畫改用專案既有的 framer-motion（原版用 motion/react）
 *   - 不引入 @tabler/icons-react、不使用 next/image；圖片用一般 <img>
 *   - 原版的 module-level `interval` 改為 useRef + useEffect 清理，
 *     避免多實例互相干擾、且離場正確清理計時器
 *   - 輪播間隔 props 化（intervalMs，預設 5000ms）
 *   - 尊重 prefers-reduced-motion：使用者要求減少動態時停止自動翻牌
 *   - render 期間不存取 window/document、不使用 Math.random()/new Date()（SSR 安全）
 *   - 深色主題樣式（bg-surface、border-white/10、text-white、text-gold）
 */

import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { useMediaQuery } from '@/hooks/useMediaQuery';

export interface CardStackItem {
  id: string | number;
  /** 名稱（見證者姓名） */
  name: string;
  /** 副標（身份 / 成就） */
  designation: string;
  /** 主要內容（見證引言等），可為任意 React 節點 */
  content: React.ReactNode;
}

interface CardStackProps {
  items: CardStackItem[];
  /** 自動翻牌間隔（毫秒），預設 5000ms */
  intervalMs?: number;
  /** 卡片之間垂直位移（px），預設 12 */
  offset?: number;
  /** 每往下一張的縮放遞減，預設 0.06 */
  scaleFactor?: number;
  /** 最多同時可見的卡片數，預設 3 */
  visibleCount?: number;
}

export const CardStack: React.FC<CardStackProps> = ({
  items,
  intervalMs = 5000,
  offset = 12,
  scaleFactor = 0.06,
  visibleCount = 3,
}) => {
  const [cards, setCards] = useState<CardStackItem[]>(items);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const reduceMotion = useMediaQuery('(prefers-reduced-motion: reduce)');

  // items 由外層非同步載入 / 變更時同步內部堆疊順序
  useEffect(() => {
    setCards(items);
  }, [items]);

  // 自動翻牌：最上面那張移到最底；少於 2 張或使用者要求減少動態時不啟動
  useEffect(() => {
    if (reduceMotion || cards.length <= 1) return;

    intervalRef.current = setInterval(() => {
      setCards((prev) => {
        const next = [...prev];
        const top = next.shift();
        if (top) next.push(top);
        return next;
      });
    }, intervalMs);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [reduceMotion, cards.length, intervalMs]);

  if (!cards.length) return null;

  return (
    <div className="relative mx-auto h-60 w-full max-w-sm md:h-64 md:max-w-md">
      {cards.map((card, index) => {
        // 只讓最上面的 visibleCount 張保持可見，其餘藏在底下
        const isVisible = index < visibleCount;
        return (
          <motion.div
            key={card.id}
            className="absolute inset-0 flex flex-col justify-between rounded-2xl border border-white/10 bg-surface p-5 shadow-lg shadow-black/40 sm:p-6"
            style={{ transformOrigin: 'top center' }}
            animate={{
              top: index * -offset,
              scale: 1 - index * scaleFactor,
              zIndex: cards.length - index,
              opacity: isVisible ? 1 : 0,
            }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="text-sm leading-relaxed text-white/70 sm:text-base">
              {card.content}
            </div>
            <div className="mt-4">
              <div className="mb-3 h-px w-8 bg-gold/30" />
              <p className="text-sm font-medium text-white/90">{card.name}</p>
              {card.designation && (
                <p className="mt-0.5 text-xs text-gold">{card.designation}</p>
              )}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
};

export default CardStack;
