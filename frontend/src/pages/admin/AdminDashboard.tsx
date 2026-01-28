/**
 * AdminDashboard 頁面 - 管理後台儀表板
 * @module pages/admin/AdminDashboard
 * @theme luxe (LUXE 高端主題)
 */

import React, { useState, useEffect } from "react";
import { StatCard, Loading } from "@/components/ui";
import { get } from "@/services/api";

/** 後端統計資料結構 */
interface AdminStats {
  totalUsers: number;
  totalCourses: number;
  totalVideos: number;
  totalOrders: number;
  recentUsers: Array<{
    user_id: number;
    email: string;
    name: string | null;
    created_at: string;
  }>;
  recentOrders: Array<{
    order_id: number;
    total_amount: number;
    status: string;
    created_at: string;
  }>;
}

/**
 * AdminDashboard - 管理後台首頁
 *
 * @returns {JSX.Element} 管理儀表板
 */
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
        // ✅ 防禦性編程：API 攔截器返回 response.data
        if (res && typeof res === "object" && "totalUsers" in res) {
          setStats(res);
        } else {
          console.error("Failed to fetch stats:", res);
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

  const displayStats = [
    {
      value: stats?.totalUsers?.toLocaleString() || "0",
      label: "總用戶數",
      icon: "👥",
      trend: { value: 12, direction: "up" as const },
    },
    {
      value: stats?.totalCourses?.toString() || "0",
      label: "活躍課程",
      icon: "📚",
      trend: { value: 5, direction: "up" as const },
    },
    {
      value: stats?.totalVideos?.toString() || "0",
      label: "總影片數",
      icon: "🎬",
      trend: { value: 8, direction: "up" as const },
    },
    {
      value: stats?.totalOrders?.toString() || "0",
      label: "總訂單數",
      icon: "💰",
      trend: { value: 15, direction: "up" as const },
    },
  ];

  const recentActivities =
    stats?.recentUsers?.slice(0, 4).map((user) => ({
      type: "user",
      message: `新用戶 ${user.name || user.email} 註冊`,
      time: formatRelativeTime(user.created_at),
    })) || [];

  if (loading) {
    return <Loading text="載入中..." />;
  }

  return (
    <div>
      {/* Page Title */}
      <div className="mb-6 sm:mb-8">
        <h1 className="text-xl sm:text-2xl font-light text-luxe-text">儀表板</h1>
        <p className="text-sm sm:text-base text-luxe-muted">歡迎來到管理後台</p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-3 sm:mb-4 p-3 sm:p-4 bg-red-900/20 border border-red-500/30 rounded-lg text-sm sm:text-base text-red-400">
          {error}
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4 mb-6 sm:mb-8">
        {displayStats.map((stat) => (
          <StatCard
            key={stat.label}
            value={stat.value}
            label={stat.label}
            icon={<span>{stat.icon}</span>}
            trend={stat.trend}
            theme="luxe"
          />
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Recent Activities */}
        <div className="bg-luxe-surface rounded-lg border border-luxe-gold/10 p-4 sm:p-6">
          <h2 className="text-base sm:text-lg text-luxe-text font-light mb-3 sm:mb-4">最近活動</h2>
          <div className="space-y-3 sm:space-y-4">
            {recentActivities.length > 0 ? (
              recentActivities.map((activity, index) => (
                <div
                  key={index}
                  className="flex items-center gap-3 sm:gap-4 pb-3 sm:pb-4 border-b border-luxe-gold/5 last:border-0 last:pb-0"
                >
                  <span className="text-lg sm:text-xl">👤</span>
                  <div className="flex-grow min-w-0">
                    <p className="text-xs sm:text-sm text-luxe-text truncate">{activity.message}</p>
                    <p className="text-[10px] sm:text-xs text-luxe-muted">{activity.time}</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs sm:text-sm text-luxe-muted">暫無最近活動</p>
            )}
          </div>
        </div>

        {/* Quick Stats Chart Placeholder */}
        <div className="bg-luxe-surface rounded-lg border border-luxe-gold/10 p-4 sm:p-6">
          <h2 className="text-base sm:text-lg text-luxe-text font-light mb-3 sm:mb-4">本週流量</h2>
          <div className="h-48 sm:h-64 flex items-center justify-center text-luxe-muted">
            <div className="text-center">
              <p className="mb-2 text-2xl sm:text-3xl">📊</p>
              <p className="text-xs sm:text-sm">圖表區域</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * 格式化相對時間
 */
function formatRelativeTime(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return "剛剛";
    if (minutes < 60) return `${minutes} 分鐘前`;
    if (hours < 24) return `${hours} 小時前`;
    return `${days} 天前`;
  } catch {
    return dateStr;
  }
}

export default AdminDashboard;
