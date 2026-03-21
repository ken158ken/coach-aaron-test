/**
 * PublishedPages - 已發布自訂頁面列表
 * @module pages/PublishedPages
 * @description 顯示所有已發布的 Landing Page（Demo 版本）
 */

import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

/** Demo 已發布頁面資料 */
const PUBLISHED_PAGES = [
  {
    id: "lp-1",
    title: "2026 春季特訓班 — 限時早鳥優惠",
    slug: "2026-spring-bootcamp",
    description: "6 週密集訓練，報名享 85 折＋免費體適能評估",
    updatedAt: "2026-02-01",
    viewCount: 342,
  },
  {
    id: "lp-3",
    title: "企業員工健康方案",
    slug: "corporate-wellness",
    description: "客製化團體課程，提升團隊體能與工作效率",
    updatedAt: "2026-02-14",
    viewCount: 128,
  },
];

const PublishedPages: React.FC = () => {
  return (
    <div className="min-h-screen bg-transparent relative">
      <div className="relative z-10 pt-20 sm:pt-24 pb-16 px-4">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-10">
            <span className="text-gold text-xs uppercase tracking-widest">
              Custom Pages
            </span>
            <h1 className="mt-2 text-2xl sm:text-3xl font-light text-white/90">
              自訂頁面
            </h1>
            <p className="mt-2 text-sm text-white/40">
              已發布的行銷活動頁面
            </p>
          </div>

          {/* Pages list */}
          {PUBLISHED_PAGES.length === 0 ? (
            <div className="text-center py-20 text-white/30">
              <p className="text-5xl mb-4">🚀</p>
              <p>尚無已發布的頁面</p>
            </div>
          ) : (
            <div className="space-y-4">
              {PUBLISHED_PAGES.map((page, i) => (
                <motion.div
                  key={page.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.08, duration: 0.3 }}
                  whileHover={{ y: -3, boxShadow: "0 8px 32px rgba(197,160,89,0.15)", borderColor: "rgba(197,160,89,0.4)" }}
                  className="bg-black/40 border border-gold/15 rounded-xl p-5 sm:p-6"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <h2 className="text-base sm:text-lg font-medium text-white/90 mb-1">
                        {page.title}
                      </h2>
                      <p className="text-sm text-white/45 mb-3 line-clamp-2">
                        {page.description}
                      </p>
                      <div className="flex items-center gap-4 text-xs text-white/30">
                        <span>/{page.slug}</span>
                        <span>👁 {page.viewCount} 次瀏覽</span>
                        <span>更新 {page.updatedAt}</span>
                      </div>
                    </div>
                    <Link
                      to={`/page/${page.slug}`}
                      className="shrink-0 px-4 py-2 text-xs bg-gold/15 text-gold border border-gold/30 rounded-lg hover:bg-gold/25 transition-colors"
                    >
                      查看頁面
                    </Link>
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          {/* Admin link */}
          <div className="mt-8 pt-6 border-t border-white/8 text-center">
            <Link
              to="/admin/landing-pages"
              className="text-xs text-white/30 hover:text-gold transition-colors"
            >
              ⚙️ 管理自訂頁面（後台）
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PublishedPages;
