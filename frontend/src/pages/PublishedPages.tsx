/**
 * PublishedPages - 已發布自訂頁面列表
 * @module pages/PublishedPages
 * @description 從 API 取得所有已發布的 Landing Page 並列出
 */

import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { landingService } from "../services/landing.service";

interface PublishedPage {
  id: number;
  project_name: string;
  custom_slug: string;
  seo_title: string | null;
  seo_description: string | null;
  published_at: string | null;
  updated_at: string;
}

const PublishedPages: React.FC = () => {
  const [pages, setPages] = useState<PublishedPage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    landingService
      .getPublishedProjects()
      .then((res) => {
        if (!cancelled) setPages(res.data);
      })
      .catch(() => {
        if (!cancelled) setError("無法載入頁面列表");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  const formatDate = (iso: string | null) => {
    if (!iso) return "—";
    return new Date(iso).toLocaleDateString("zh-TW");
  };

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

          {/* Content */}
          {loading ? (
            <div className="flex justify-center py-20">
              <div className="w-6 h-6 border-2 border-t-transparent border-gold rounded-full animate-spin" />
            </div>
          ) : error ? (
            <div className="text-center py-20 text-white/30">
              <p className="text-4xl mb-4">⚠️</p>
              <p>{error}</p>
            </div>
          ) : pages.length === 0 ? (
            <div className="text-center py-20 text-white/30">
              <p className="text-5xl mb-4">🚀</p>
              <p>尚無已發布的頁面</p>
            </div>
          ) : (
            <div className="space-y-4">
              {pages.map((page, i) => (
                <motion.div
                  key={page.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.08, duration: 0.3 }}
                  whileHover={{
                    y: -3,
                    boxShadow: "0 8px 32px rgba(197,160,89,0.15)",
                    borderColor: "rgba(197,160,89,0.4)",
                  }}
                  className="bg-black/40 border border-gold/15 rounded-xl p-5 sm:p-6"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <h2 className="text-base sm:text-lg font-medium text-white/90 mb-1">
                        {page.seo_title || page.project_name}
                      </h2>
                      {page.seo_description && (
                        <p className="text-sm text-white/45 mb-3 line-clamp-2">
                          {page.seo_description}
                        </p>
                      )}
                      <div className="flex items-center gap-4 text-xs text-white/30">
                        <span>/{page.custom_slug}</span>
                        <span>更新 {formatDate(page.updated_at)}</span>
                      </div>
                    </div>
                    <Link
                      to={`/page/${page.custom_slug}`}
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
