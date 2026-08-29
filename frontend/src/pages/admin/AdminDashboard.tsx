/**
 * AdminDashboard 頁面 - 管理後台儀表板
 * @module pages/admin/AdminDashboard
 * @theme luxe (LUXE 高端主題)
 */

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { StatCard, Loading } from "@/components/ui";
import { get } from "@/services/api";

interface RankedItem {
  id: number;
  title: string;
  views?: number;
  enrolled?: number;
}

interface AdminStats {
  // 舊欄位（保持相容）
  userCount: number | null;
  courseCount: number | null;
  orderCount: number | null;
  monthlyRevenue: number;
  // 擴充欄位
  videoCount?: number | null;
  articleCount?: number | null;
  lessonCount?: number | null;
  newUsersThisMonth?: number | null;
  bookingCount?: number | null;
  totalArticleViews?: number;
  totalLessonViews?: number;
  topArticles?: RankedItem[];
  topLessons?: RankedItem[];
  topCourses?: RankedItem[];
}

/** 簡易橫條圖：純 CSS，不需額外套件 */
const BarChart: React.FC<{
  items: { label: string; value: number; suffix?: string }[];
  color?: string;
}> = ({ items, color = "bg-luxe-gold" }) => {
  const max = Math.max(...items.map((i) => i.value), 1);
  return (
    <div className="space-y-2.5">
      {items.map((item, idx) => (
        <div key={idx}>
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="text-luxe-text truncate max-w-[70%]">{item.label}</span>
            <span className="text-luxe-muted shrink-0 ml-2">
              {item.value.toLocaleString()}{item.suffix || ""}
            </span>
          </div>
          <div className="h-1.5 rounded-full bg-luxe-gold/10 overflow-hidden">
            <motion.div
              className={`h-full rounded-full ${color}`}
              initial={{ width: 0 }}
              animate={{ width: `${(item.value / max) * 100}%` }}
              transition={{ duration: 0.6, delay: idx * 0.08, ease: [0.16, 1, 0.3, 1] }}
            />
          </div>
        </div>
      ))}
    </div>
  );
};

const AdminDashboard: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [stats, setStats] = useState<AdminStats | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        setError("");
        const res = await get<AdminStats>("/api/admin/stats");
        if (res && typeof res === "object" && "userCount" in res) {
          setStats(res);
        } else {
          setError("載入統計數據失敗：數據格式錯誤");
        }
      } catch (err) {
        console.error("Failed to fetch stats:", err);
        setError("載入統計數據失敗");
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  /** `tour` 為新手導覽定位錨點（frontend/src/tours/pages/adminDashboard.tour.ts） */
  const primaryStats = [
    { value: stats?.userCount?.toLocaleString() || "0", label: "總用戶數", icon: "👥", sub: `本月新增 ${stats?.newUsersThisMonth ?? 0}`, tour: "dashboard-stat-users" },
    { value: stats?.courseCount?.toLocaleString() || "0", label: "線上課程", icon: "📚", sub: `預約 ${stats?.bookingCount ?? 0} 筆`, tour: "dashboard-stat-courses" },
    { value: stats?.articleCount?.toLocaleString() || "0", label: "已發布文章", icon: "📝", sub: `共 ${(stats?.totalArticleViews ?? 0).toLocaleString()} 次閱覽`, tour: "dashboard-stat-articles" },
    { value: `NT$ ${(stats?.monthlyRevenue || 0).toLocaleString()}`, label: "本月營收", icon: "💰", sub: `訂單 ${stats?.orderCount ?? 0} 筆`, tour: "dashboard-stat-revenue" },
  ];

  const contentStats = [
    { value: stats?.videoCount?.toLocaleString() || "0", label: "Reels 影片", icon: "🎬" },
    { value: stats?.lessonCount?.toLocaleString() || "0", label: "教學影片", icon: "🎓", sub: `${(stats?.totalLessonViews ?? 0).toLocaleString()} 次觀看` },
    { value: stats?.orderCount?.toLocaleString() || "0", label: "總訂單", icon: "🛒" },
    { value: stats?.bookingCount?.toLocaleString() || "0", label: "預約諮詢", icon: "📅" },
  ];

  const dotGridStyle: React.CSSProperties = {
    backgroundImage: "radial-gradient(circle, rgba(197,160,89,0.18) 1px, transparent 1px)",
    backgroundSize: "24px 24px",
  };

  const containerVariants = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.07 } },
  };
  const cardVariants = {
    hidden:  { opacity: 0, y: 14 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] } },
  };

  if (loading) return <Loading text="載入中..." />;

  return (
    <div className="relative">
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 opacity-40" style={dotGridStyle} />

      {/* Header */}
      <div className="mb-6" data-tour="dashboard-header">
        <h1 className="text-xl sm:text-2xl font-light text-luxe-text">儀表板</h1>
        <p className="text-sm text-luxe-muted">歡迎來到管理後台</p>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-900/20 border border-red-500/30 rounded-lg text-sm text-red-400">{error}</div>
      )}

      {/* 主要 StatCards */}
      <motion.div
        data-tour="dashboard-primary-stats"
        className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4 mb-6"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {primaryStats.map((stat) => (
          <motion.div key={stat.label} variants={cardVariants} data-tour={stat.tour}>
            <StatCard
              value={stat.value}
              label={stat.label}
              icon={<span>{stat.icon}</span>}
              theme="luxe"
            />
            {stat.sub && (
              <p className="text-[11px] text-luxe-muted mt-1 px-1">{stat.sub}</p>
            )}
          </motion.div>
        ))}
      </motion.div>

      {/* 內容統計 */}
      <motion.div
        data-tour="dashboard-content-stats"
        className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4 mb-6"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {contentStats.map((stat) => (
          <motion.div key={stat.label} variants={cardVariants}>
            <div className="bg-luxe-surface rounded-lg border border-luxe-gold/10 p-3 sm:p-4 hover:border-luxe-gold/20 transition-colors">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-lg">{stat.icon}</span>
                <span className="text-xs text-luxe-muted">{stat.label}</span>
              </div>
              <p className="text-xl sm:text-2xl font-light text-luxe-text">{stat.value}</p>
              {stat.sub && <p className="text-[11px] text-luxe-muted mt-0.5">{stat.sub}</p>}
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* 排行榜 */}
      <div className="grid lg:grid-cols-3 gap-4 sm:gap-6" data-tour="dashboard-rankings">
        {/* 熱門文章 */}
        <div className="bg-luxe-surface rounded-lg border border-luxe-gold/10 p-4 sm:p-5">
          <h2 className="text-sm font-medium text-luxe-text mb-4">📝 熱門文章（閱覽次數）</h2>
          {stats?.topArticles && stats.topArticles.length > 0 ? (
            <BarChart
              items={stats.topArticles.map((a) => ({ label: a.title, value: a.views ?? 0, suffix: " 次" }))}
              color="bg-blue-400"
            />
          ) : (
            <p className="text-xs text-luxe-muted">暫無資料</p>
          )}
        </div>

        {/* 熱門教學影片 */}
        <div className="bg-luxe-surface rounded-lg border border-luxe-gold/10 p-4 sm:p-5">
          <h2 className="text-sm font-medium text-luxe-text mb-4">🎓 熱門教學影片（觀看次數）</h2>
          {stats?.topLessons && stats.topLessons.length > 0 ? (
            <BarChart
              items={stats.topLessons.map((l) => ({ label: l.title, value: l.views ?? 0, suffix: " 次" }))}
              color="bg-purple-400"
            />
          ) : (
            <p className="text-xs text-luxe-muted">暫無資料</p>
          )}
        </div>

        {/* 課程報名 */}
        <div className="bg-luxe-surface rounded-lg border border-luxe-gold/10 p-4 sm:p-5">
          <h2 className="text-sm font-medium text-luxe-text mb-4">📚 課程報名（人數）</h2>
          {stats?.topCourses && stats.topCourses.length > 0 ? (
            <BarChart
              items={stats.topCourses.map((c) => ({ label: c.title, value: c.enrolled ?? 0, suffix: " 人" }))}
              color="bg-luxe-gold"
            />
          ) : (
            <p className="text-xs text-luxe-muted">暫無資料</p>
          )}
        </div>
      </div>

      {/* Google Analytics 提示 */}
      <div
        className="mt-6 p-4 bg-luxe-surface/60 border border-luxe-gold/10 rounded-lg"
        data-tour="dashboard-analytics"
      >
        <p className="text-xs text-luxe-muted">
          💡 網站訪問人數、跳出率、來源分析請透過{" "}
          <a
            href="https://analytics.google.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-luxe-gold hover:underline"
          >
            Google Analytics
          </a>{" "}
          或{" "}
          <a
            href="https://vercel.com/analytics"
            target="_blank"
            rel="noopener noreferrer"
            className="text-luxe-gold hover:underline"
          >
            Vercel Analytics
          </a>{" "}
          查看（Vercel Analytics SDK 已安裝，在 Vercel 後台啟用即可）
        </p>
      </div>
    </div>
  );
};

export default AdminDashboard;
