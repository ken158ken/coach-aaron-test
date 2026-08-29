/**
 * ImagesBadge - Aceternity UI Images Badge 風格
 * @module components/ui/images-badge
 * @description 重疊圓形 badge 列，hover 時向上展開預覽卡片並提供連結
 */

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "@/context/LanguageContext";

export interface BadgeItem {
  /** 顯示在圓形 badge 上的 emoji 或文字 */
  icon: string;
  /** 平台名稱（hover 卡片標題） */
  name: string;
  /** 描述文字（帳號 ID / 說明） */
  desc: string;
  /** 前往的連結 */
  href: string;
  /** badge 背景色（CSS background value，支援 gradient） */
  bg?: string;
}

interface ImagesBadgeProps {
  items: BadgeItem[];
  /** 每個 badge 的直徑，預設 48 */
  badgeSize?: number;
  /** hover 時卡片向上移動的距離（px），預設 120 */
  hoverTranslateY?: number;
  /** hover 時相鄰 badge 往兩側展開的距離（px），預設 18 */
  hoverSpread?: number;
  /** badge 之間的重疊量（負 margin），預設 -12 */
  overlap?: number;
}

const ImagesBadge: React.FC<ImagesBadgeProps> = ({
  items,
  badgeSize = 48,
  hoverTranslateY = 120,
  hoverSpread = 18,
  overlap = -14,
}) => {
  const { t } = useLanguage();
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  /**
   * 計算每個 badge 的水平偏移
   * hover 時：左側 badge 往左散開，右側往右散開
   */
  const getSpreadX = (i: number): number => {
    if (hoveredIdx === null) return 0;
    const dist = i - hoveredIdx;
    if (dist === 0) return 0;
    // 距離越遠，散開越多；每格加一個 spread
    return dist > 0 ? hoverSpread * Math.min(dist, 2) : -hoverSpread * Math.min(-dist, 2);
  };

  return (
    <div className="relative flex items-end" style={{ paddingTop: `${hoverTranslateY + 40}px` }}>
      {items.map((item, i) => {
        const isHovered = hoveredIdx === i;
        const spreadX = getSpreadX(i);

        return (
          <motion.div
            key={item.name}
            className="relative cursor-pointer"
            style={{
              marginLeft: i === 0 ? 0 : overlap,
              zIndex: isHovered ? 50 : hoveredIdx !== null ? 10 - Math.abs(i - (hoveredIdx ?? 0)) : items.length - i,
            }}
            animate={{ x: spreadX }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            onMouseEnter={() => setHoveredIdx(i)}
            onMouseLeave={() => setHoveredIdx(null)}
          >
            {/* Hover card — 出現在 badge 上方 */}
            <AnimatePresence>
              {isHovered && (
                <motion.div
                  key="card"
                  initial={{ opacity: 0, y: 8, scale: 0.92 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 6, scale: 0.94 }}
                  transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                  className="absolute bottom-full mb-3 left-1/2 -translate-x-1/2 pointer-events-auto"
                  style={{ width: 148, zIndex: 60 }}
                >
                  <div className="bg-[#0e0e0e] border border-white/15 rounded-2xl overflow-hidden shadow-2xl">
                    {/* Preview image area — platform colored banner */}
                    <div
                      className="flex items-center justify-center"
                      style={{
                        height: 72,
                        background: item.bg ?? "rgba(255,255,255,0.06)",
                      }}
                    >
                      <span style={{ fontSize: "2.2rem" }}>{item.icon}</span>
                    </div>

                    {/* Info */}
                    <div className="px-3 py-2.5">
                      <p className="text-white/90 text-xs font-semibold leading-tight">{item.name}</p>
                      <p className="text-white/45 text-[11px] mt-0.5 leading-tight truncate">{item.desc}</p>

                      {/* Link button */}
                      <a
                        href={item.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-2.5 flex items-center justify-center gap-1 w-full py-1.5 rounded-lg bg-white/8 border border-white/12 text-white/70 text-[11px] hover:bg-white/14 hover:text-white/95 transition-colors"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {t.uiCommon.goTo}
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                      </a>
                    </div>
                  </div>

                  {/* Card arrow */}
                  <div
                    className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-[#0e0e0e] border-r border-b border-white/15 rotate-45"
                    style={{ zIndex: -1 }}
                  />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Badge circle */}
            <motion.div
              className="rounded-full border-2 border-[#080808] flex items-center justify-center shadow-lg select-none"
              style={{
                width: badgeSize,
                height: badgeSize,
                fontSize: badgeSize * 0.42,
                background: item.bg ?? "rgba(255,255,255,0.08)",
              }}
              animate={{ y: isHovered ? -8 : 0, scale: isHovered ? 1.12 : 1 }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            >
              {item.icon}
            </motion.div>
          </motion.div>
        );
      })}
    </div>
  );
};

export { ImagesBadge };
export default ImagesBadge;
